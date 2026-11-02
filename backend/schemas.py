from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# Category Schemas
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: Optional[str] = "#4f46e5"
    icon: Optional[str] = "tag"


class CategoryCreate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# Transaction Schemas
class TransactionBase(BaseModel):
    date: datetime
    amount: float = Field(..., gt=0)
    description: str = Field(..., min_length=1, max_length=255)
    payment_method: Optional[str] = "Credit Card"
    category_id: int


class TransactionCreate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: int
    category_name: Optional[str] = None
    category_color: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# Monthly Budget Schemas
class MonthlyBudgetBase(BaseModel):
    month_year: str = Field(..., pattern=r"^\d{4}-\d{2}$", description="Format: YYYY-MM")
    budget_amount: float = Field(..., gt=0)
    category_id: int


class MonthlyBudgetCreate(MonthlyBudgetBase):
    pass


class MonthlyBudgetOut(MonthlyBudgetBase):
    id: int
    category_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# Analytics Response Schemas
class CategorySpend(BaseModel):
    category_id: int
    category_name: str
    color: str
    total_spent: float
    percentage: float
    transaction_count: int


class MonthlyTrend(BaseModel):
    month_year: str
    total_spent: float
    total_budget: float
    transaction_count: int


class BudgetVsActualItem(BaseModel):
    category_id: int
    category_name: str
    color: str
    budget_amount: float
    actual_spent: float
    variance: float  # budget_amount - actual_spent (positive is under budget, negative is over)
    percentage_utilized: float
    status: str  # "under_budget", "warning", "over_budget"


class KPIOverview(BaseModel):
    total_spend: float
    total_budget: float
    net_variance: float
    budget_utilization_pct: float
    total_transactions: int
    active_month: str
