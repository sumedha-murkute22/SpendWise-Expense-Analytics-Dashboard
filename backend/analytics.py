from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
import models
import schemas


def get_kpi_overview(db: Session, month_year: Optional[str] = None) -> schemas.KPIOverview:
    """Calculate overall KPI figures (spend, budget, variance, utilization %) for a given month or overall."""
    tx_query = db.query(models.Transaction)
    budget_query = db.query(models.MonthlyBudget)

    current_month_str = month_year
    if not current_month_str:
        # Default to the most recent transaction's month or current calendar month
        latest_tx = db.query(models.Transaction).order_by(models.Transaction.date.desc()).first()
        if latest_tx and latest_tx.date:
            current_month_str = latest_tx.date.strftime("%Y-%m")
        else:
            current_month_str = datetime.utcnow().strftime("%Y-%m")

    parts = current_month_str.split("-")
    year, month = int(parts[0]), int(parts[1])

    month_txs = tx_query.filter(
        extract("year", models.Transaction.date) == year,
        extract("month", models.Transaction.date) == month
    ).all()

    total_spent = sum(t.amount for t in month_txs)
    total_tx_count = len(month_txs)

    month_budgets = budget_query.filter(models.MonthlyBudget.month_year == current_month_str).all()
    total_budget = sum(b.budget_amount for b in month_budgets)

    net_variance = round(total_budget - total_spent, 2)
    utilization_pct = round((total_spent / total_budget * 100), 2) if total_budget > 0 else 0.0

    return schemas.KPIOverview(
        total_spend=round(total_spent, 2),
        total_budget=round(total_budget, 2),
        net_variance=net_variance,
        budget_utilization_pct=utilization_pct,
        total_transactions=total_tx_count,
        active_month=current_month_str
    )


def get_spend_by_category(db: Session, month_year: Optional[str] = None) -> List[schemas.CategorySpend]:
    """Aggregate total expenditure grouped by category."""
    query = db.query(
        models.Category.id,
        models.Category.name,
        models.Category.color,
        func.coalesce(func.sum(models.Transaction.amount), 0.0).label("total_spent"),
        func.count(models.Transaction.id).label("tx_count")
    ).outerjoin(models.Transaction, models.Transaction.category_id == models.Category.id)

    if month_year:
        parts = month_year.split("-")
        if len(parts) == 2:
            query = query.filter(
                (models.Transaction.id == None) | (
                    (extract("year", models.Transaction.date) == int(parts[0])) &
                    (extract("month", models.Transaction.date) == int(parts[1]))
                )
            )

    results = query.group_by(models.Category.id, models.Category.name, models.Category.color).all()
    grand_total = sum(r[3] for r in results)

    breakdown = []
    for cat_id, cat_name, color, total, count in results:
        pct = round((total / grand_total * 100), 2) if grand_total > 0 else 0.0
        breakdown.append(schemas.CategorySpend(
            category_id=cat_id,
            category_name=cat_name,
            color=color or "#4f46e5",
            total_spent=round(total, 2),
            percentage=pct,
            transaction_count=count
        ))

    # Sort descending by spend
    breakdown.sort(key=lambda x: x.total_spent, reverse=True)
    return breakdown


def get_monthly_trends(db: Session, limit_months: int = 6) -> List[schemas.MonthlyTrend]:
    """Calculate month-by-month spend and budget comparison trends."""
    # Group transactions by year and month
    txs = db.query(models.Transaction).order_by(models.Transaction.date.asc()).all()
    
    monthly_map = {}
    for tx in txs:
        m_str = tx.date.strftime("%Y-%m")
        if m_str not in monthly_map:
            monthly_map[m_str] = {"spent": 0.0, "count": 0, "budget": 0.0}
        monthly_map[m_str]["spent"] += tx.amount
        monthly_map[m_str]["count"] += 1

    # Fetch all budgets and add to map
    budgets = db.query(models.MonthlyBudget).all()
    for b in budgets:
        if b.month_year not in monthly_map:
            monthly_map[b.month_year] = {"spent": 0.0, "count": 0, "budget": 0.0}
        monthly_map[b.month_year]["budget"] += b.budget_amount

    # Convert to sorted list
    sorted_months = sorted(monthly_map.keys())[-limit_months:]
    trend_list = []
    for m in sorted_months:
        data = monthly_map[m]
        trend_list.append(schemas.MonthlyTrend(
            month_year=m,
            total_spent=round(data["spent"], 2),
            total_budget=round(data["budget"], 2),
            transaction_count=data["count"]
        ))

    return trend_list


def get_budget_vs_actual(db: Session, month_year: str) -> List[schemas.BudgetVsActualItem]:
    """Compare budgeted amount versus actual spend category-by-category."""
    parts = month_year.split("-")
    year, month = int(parts[0]), int(parts[1])

    categories = db.query(models.Category).all()
    items = []

    for cat in categories:
        # Get budget for this month
        b = db.query(models.MonthlyBudget).filter(
            models.MonthlyBudget.month_year == month_year,
            models.MonthlyBudget.category_id == cat.id
        ).first()
        budget_val = b.budget_amount if b else 0.0

        # Calculate actual spend
        actual_spent = db.query(func.coalesce(func.sum(models.Transaction.amount), 0.0)).filter(
            models.Transaction.category_id == cat.id,
            extract("year", models.Transaction.date) == year,
            extract("month", models.Transaction.date) == month
        ).scalar() or 0.0

        variance = round(budget_val - actual_spent, 2)
        utilization = round((actual_spent / budget_val * 100), 2) if budget_val > 0 else 0.0

        if budget_val == 0:
            status = "unbudgeted"
        elif actual_spent > budget_val:
            status = "over_budget"
        elif utilization >= 85:
            status = "warning"
        else:
            status = "under_budget"

        items.append(schemas.BudgetVsActualItem(
            category_id=cat.id,
            category_name=cat.name,
            color=cat.color or "#4f46e5",
            budget_amount=round(budget_val, 2),
            actual_spent=round(actual_spent, 2),
            variance=variance,
            percentage_utilized=utilization,
            status=status
        ))

    # Sort so over-budget items appear at the top
    items.sort(key=lambda x: (x.status != "over_budget", -x.percentage_utilized))
    return items
