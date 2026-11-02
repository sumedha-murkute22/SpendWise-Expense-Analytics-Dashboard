import os
import csv
from dateutil import parser
from database import SessionLocal, engine, Base
import models


DEFAULT_CATEGORIES = [
    {"name": "Housing", "color": "#3b82f6", "icon": "home"},
    {"name": "Groceries", "color": "#10b981", "icon": "shopping-cart"},
    {"name": "Utilities", "color": "#f59e0b", "icon": "zap"},
    {"name": "Dining", "color": "#ef4444", "icon": "coffee"},
    {"name": "Transportation", "color": "#8b5cf6", "icon": "truck"},
    {"name": "Entertainment", "color": "#ec4899", "icon": "film"},
    {"name": "Healthcare", "color": "#06b6d4", "icon": "activity"},
    {"name": "Shopping", "color": "#f97316", "icon": "package"}
]


def seed_database():
    """Seed initial categories, synthetic transactions, and synthetic budgets."""
    print("Initializing SQLite database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Categories if empty
        if db.query(models.Category).count() == 0:
            print("Seeding default categories...")
            for cat_data in DEFAULT_CATEGORIES:
                cat = models.Category(**cat_data)
                db.add(cat)
            db.commit()

        # Build category map
        category_map = {c.name.lower(): c.id for c in db.query(models.Category).all()}

        # 2. Seed Synthetic Transactions if empty
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
        tx_csv_path = os.path.join(data_dir, "synthetic_transactions.csv")

        if db.query(models.Transaction).count() == 0 and os.path.exists(tx_csv_path):
            print(f"Loading synthetic transactions from {tx_csv_path}...")
            with open(tx_csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    cat_id = category_map.get(row["category"].strip().lower())
                    if not cat_id:
                        # Fallback create category
                        new_cat = models.Category(name=row["category"].strip(), color="#64748b")
                        db.add(new_cat)
                        db.commit()
                        category_map[row["category"].strip().lower()] = new_cat.id
                        cat_id = new_cat.id

                    tx = models.Transaction(
                        date=parser.parse(row["date"].strip()),
                        amount=float(row["amount"].strip()),
                        description=row["description"].strip(),
                        payment_method=row.get("payment_method", "Credit Card").strip(),
                        category_id=cat_id
                    )
                    db.add(tx)
                db.commit()
            print("Successfully populated synthetic transactions.")

        # 3. Seed Synthetic Budgets if empty
        budget_csv_path = os.path.join(data_dir, "synthetic_budgets.csv")
        if db.query(models.MonthlyBudget).count() == 0 and os.path.exists(budget_csv_path):
            print(f"Loading synthetic budgets from {budget_csv_path}...")
            with open(budget_csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    cat_id = category_map.get(row["category"].strip().lower())
                    if cat_id:
                        b = models.MonthlyBudget(
                            month_year=row["month_year"].strip(),
                            budget_amount=float(row["budget_amount"].strip()),
                            category_id=cat_id
                        )
                        db.add(b)
                db.commit()
            print("Successfully populated synthetic budgets.")

        print("SpendWise database seeding complete.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
