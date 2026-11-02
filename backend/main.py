import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models
import schemas
import crud
import analytics
from csv_importer import parse_and_import_transactions_csv
from seed_data import seed_database

# Create tables upon startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SpendWise Expense Analytics API",
    description="Full-stack expense tracking, analytics, and budgeting backend.",
    version="1.0.0"
)

# CORS Configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local frontend access smoothly
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Seed synthetic data on initial run if database is fresh."""
    seed_database()


@app.get("/api/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "SpendWise Analytics API", "version": "1.0.0"}


# --- Category Endpoints ---
@app.get("/api/categories", response_model=List[schemas.CategoryOut], tags=["Categories"])
def list_categories(db: Session = Depends(get_db)):
    return crud.get_categories(db)


@app.post("/api/categories", response_model=schemas.CategoryOut, status_code=201, tags=["Categories"])
def create_category(cat: schemas.CategoryCreate, db: Session = Depends(get_db)):
    existing = crud.get_category_by_name(db, cat.name)
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists.")
    return crud.create_category(db, cat)


# --- Transaction Endpoints ---
@app.get("/api/transactions", response_model=List[schemas.TransactionOut], tags=["Transactions"])
def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    category_id: Optional[int] = Query(None),
    month_year: Optional[str] = Query(None, description="Format YYYY-MM"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    txs = crud.get_transactions(db, skip=skip, limit=limit, category_id=category_id, month_year=month_year, search=search)
    # Augment response with category name & color
    result = []
    for t in txs:
        out = schemas.TransactionOut(
            id=t.id,
            date=t.date,
            amount=t.amount,
            description=t.description,
            payment_method=t.payment_method,
            category_id=t.category_id,
            category_name=t.category_rel.name if t.category_rel else "Uncategorized",
            category_color=t.category_rel.color if t.category_rel else "#64748b"
        )
        result.append(out)
    return result


@app.post("/api/transactions", response_model=schemas.TransactionOut, status_code=201, tags=["Transactions"])
def add_transaction(tx: schemas.TransactionCreate, db: Session = Depends(get_db)):
    new_tx = crud.create_transaction(db, tx)
    return schemas.TransactionOut(
        id=new_tx.id,
        date=new_tx.date,
        amount=new_tx.amount,
        description=new_tx.description,
        payment_method=new_tx.payment_method,
        category_id=new_tx.category_id,
        category_name=new_tx.category_rel.name if new_tx.category_rel else None,
        category_color=new_tx.category_rel.color if new_tx.category_rel else None
    )


@app.delete("/api/transactions/{transaction_id}", tags=["Transactions"])
def remove_transaction(transaction_id: int, db: Session = Depends(get_db)):
    success = crud.delete_transaction(db, transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    return {"message": "Transaction deleted successfully"}


@app.post("/api/transactions/import-csv", tags=["Transactions"])
async def import_transactions_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")
    try:
        content_bytes = await file.read()
        csv_text = content_bytes.decode("utf-8-sig")  # Handles possible BOM
        summary = parse_and_import_transactions_csv(csv_text, db)
        return {"status": "success", "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV: {str(e)}")


# --- Budget Endpoints ---
@app.get("/api/budgets", response_model=List[schemas.MonthlyBudgetOut], tags=["Budgets"])
def list_budgets(month_year: str = Query(..., description="Format YYYY-MM"), db: Session = Depends(get_db)):
    budgets = crud.get_budgets_by_month(db, month_year)
    result = []
    for b in budgets:
        result.append(schemas.MonthlyBudgetOut(
            id=b.id,
            month_year=b.month_year,
            budget_amount=b.budget_amount,
            category_id=b.category_id,
            category_name=b.category_rel.name if b.category_rel else None
        ))
    return result


@app.post("/api/budgets", response_model=schemas.MonthlyBudgetOut, tags=["Budgets"])
def set_budget(budget: schemas.MonthlyBudgetCreate, db: Session = Depends(get_db)):
    b = crud.set_or_update_budget(db, budget)
    return schemas.MonthlyBudgetOut(
        id=b.id,
        month_year=b.month_year,
        budget_amount=b.budget_amount,
        category_id=b.category_id,
        category_name=b.category_rel.name if b.category_rel else None
    )


# --- Analytics Endpoints ---
@app.get("/api/analytics/kpis", response_model=schemas.KPIOverview, tags=["Analytics"])
def get_kpis(month_year: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return analytics.get_kpi_overview(db, month_year)


@app.get("/api/analytics/category-breakdown", response_model=List[schemas.CategorySpend], tags=["Analytics"])
def get_category_breakdown(month_year: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return analytics.get_spend_by_category(db, month_year)


@app.get("/api/analytics/monthly-trends", response_model=List[schemas.MonthlyTrend], tags=["Analytics"])
def get_trends(limit: int = Query(6, ge=2, le=24), db: Session = Depends(get_db)):
    return analytics.get_monthly_trends(db, limit_months=limit)


@app.get("/api/analytics/budget-vs-actual", response_model=List[schemas.BudgetVsActualItem], tags=["Analytics"])
def get_budget_vs_actual(month_year: str = Query(..., description="Format YYYY-MM"), db: Session = Depends(get_db)):
    return analytics.get_budget_vs_actual(db, month_year)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
