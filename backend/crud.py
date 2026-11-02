from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
import models
import schemas


# --- Categories ---
def get_categories(db: Session) -> List[models.Category]:
    return db.query(models.Category).order_by(models.Category.name).all()


def get_category_by_name(db: Session, name: str) -> Optional[models.Category]:
    return db.query(models.Category).filter(func.lower(models.Category.name) == name.strip().lower()).first()


def create_category(db: Session, cat: schemas.CategoryCreate) -> models.Category:
    db_cat = models.Category(name=cat.name.strip(), color=cat.color, icon=cat.icon)
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat


# --- Transactions ---
def get_transactions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    month_year: Optional[str] = None,
    search: Optional[str] = None
) -> List[models.Transaction]:
    query = db.query(models.Transaction).join(models.Category)

    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)

    if month_year:
        # month_year is "YYYY-MM"
        parts = month_year.split("-")
        if len(parts) == 2:
            year, month = int(parts[0]), int(parts[1])
            query = query.filter(
                extract("year", models.Transaction.date) == year,
                extract("month", models.Transaction.date) == month
            )

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(models.Transaction.description.ilike(pattern))

    return query.order_by(models.Transaction.date.desc()).offset(skip).limit(limit).all()


def create_transaction(db: Session, tx: schemas.TransactionCreate) -> models.Transaction:
    db_tx = models.Transaction(
        date=tx.date,
        amount=tx.amount,
        description=tx.description.strip(),
        payment_method=tx.payment_method,
        category_id=tx.category_id
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx


def delete_transaction(db: Session, transaction_id: int) -> bool:
    tx = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not tx:
        return False
    db.delete(tx)
    db.commit()
    return True


# --- Monthly Budgets ---
def get_budgets_by_month(db: Session, month_year: str) -> List[models.MonthlyBudget]:
    return db.query(models.MonthlyBudget).filter(models.MonthlyBudget.month_year == month_year).all()


def set_or_update_budget(db: Session, budget: schemas.MonthlyBudgetCreate) -> models.MonthlyBudget:
    existing = db.query(models.MonthlyBudget).filter(
        models.MonthlyBudget.month_year == budget.month_year,
        models.MonthlyBudget.category_id == budget.category_id
    ).first()

    if existing:
        existing.budget_amount = budget.budget_amount
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_b = models.MonthlyBudget(
            month_year=budget.month_year,
            budget_amount=budget.budget_amount,
            category_id=budget.category_id
        )
        db.add(new_b)
        db.commit()
        db.refresh(new_b)
        return new_b
