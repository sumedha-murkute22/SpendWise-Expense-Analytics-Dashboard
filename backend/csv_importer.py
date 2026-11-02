import csv
import io
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from dateutil import parser
import models


DEFAULT_CATEGORY_COLORS = {
    "Housing": "#3b82f6",
    "Groceries": "#10b981",
    "Utilities": "#f59e0b",
    "Dining": "#ef4444",
    "Transportation": "#8b5cf6",
    "Entertainment": "#ec4899",
    "Healthcare": "#06b6d4",
    "Shopping": "#f97316",
    "General": "#64748b"
}


def parse_and_import_transactions_csv(csv_content: str, db: Session) -> Dict[str, Any]:
    """Parse CSV text and bulk insert validated transactions into database."""
    reader = csv.DictReader(io.StringIO(csv_content))
    imported_count = 0
    errors: List[str] = []

    # Cache existing categories
    categories_cache = {c.name.lower(): c for c in db.query(models.Category).all()}

    for row_idx, row in enumerate(reader, start=2):  # start=2 considering header is row 1
        # Normalize keys
        cleaned_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}

        # Validate presence
        date_str = cleaned_row.get("date")
        cat_name = cleaned_row.get("category", "General").title()
        amount_str = cleaned_row.get("amount")
        desc = cleaned_row.get("description", "Imported Transaction")
        pay_method = cleaned_row.get("payment_method", "Credit Card")

        if not date_str or not amount_str:
            errors.append(f"Row {row_idx}: Missing required 'date' or 'amount'.")
            continue

        # Parse date
        try:
            parsed_date = parser.parse(date_str)
        except Exception as e:
            errors.append(f"Row {row_idx}: Invalid date format '{date_str}'.")
            continue

        # Parse amount
        try:
            amount_val = float(amount_str.replace("$", "").replace(",", ""))
            if amount_val <= 0:
                errors.append(f"Row {row_idx}: Amount must be greater than zero.")
                continue
        except ValueError:
            errors.append(f"Row {row_idx}: Could not parse numeric amount '{amount_str}'.")
            continue

        # Resolve or create category
        cat_key = cat_name.lower()
        if cat_key in categories_cache:
            category_obj = categories_cache[cat_key]
        else:
            new_color = DEFAULT_CATEGORY_COLORS.get(cat_name, "#64748b")
            category_obj = models.Category(name=cat_name, color=new_color)
            db.add(category_obj)
            db.commit()
            db.refresh(category_obj)
            categories_cache[cat_key] = category_obj

        # Add transaction
        tx = models.Transaction(
            date=parsed_date,
            amount=amount_val,
            description=desc,
            payment_method=pay_method,
            category_id=category_obj.id
        )
        db.add(tx)
        imported_count += 1

    db.commit()
    return {
        "imported_count": imported_count,
        "error_count": len(errors),
        "errors": errors[:15]  # limit preview of errors
    }
