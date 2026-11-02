from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    color = Column(String(20), default="#4f46e5")
    icon = Column(String(30), default="tag")

    transactions = relationship("Transaction", back_populates="category_rel", cascade="all, delete-orphan")
    budgets = relationship("MonthlyBudget", back_populates="category_rel", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=False)
    payment_method = Column(String(50), default="Credit Card")
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)

    category_rel = relationship("Category", back_populates="transactions")


class MonthlyBudget(Base):
    __tablename__ = "monthly_budgets"

    id = Column(Integer, primary_key=True, index=True)
    # Store in "YYYY-MM" format, e.g. "2026-10"
    month_year = Column(String(7), nullable=False, index=True)
    budget_amount = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)

    category_rel = relationship("Category", back_populates="budgets")

    __table_args__ = (
        UniqueConstraint("month_year", "category_id", name="uq_month_category"),
    )
