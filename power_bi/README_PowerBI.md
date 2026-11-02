# SpendWise Companion Power BI Reporting Guide

This directory provides the companion data model, DAX measures, and setup instructions to connect **Power BI Desktop** directly to the SpendWise dataset to surface spending insights for data-driven budgeting.

---

## 1. Data Connection Options

### Option A: Direct CSV Ingestion (Recommended for Quick Setup)
1. Open **Power BI Desktop**.
2. Click **Get Data** > **Text/CSV**.
3. Load `../data/synthetic_transactions.csv` and `../data/synthetic_budgets.csv`.
4. In the Power Query Editor, verify data types:
   - `synthetic_transactions`:
     - `date`: Date
     - `category`: Text
     - `amount`: Decimal Number / Currency
     - `description`: Text
     - `payment_method`: Text
   - `synthetic_budgets`:
     - `month_year`: Text (format `YYYY-MM`)
     - `category`: Text
     - `budget_amount`: Decimal Number / Currency
5. Click **Close & Apply**.

### Option B: SQLite ODBC Driver / SQL Database
1. Install the SQLite ODBC Driver on Windows.
2. In Power BI, select **Get Data** > **ODBC** > select `spendwise.db` as the DSN source.
3. Import the tables: `categories`, `transactions`, and `monthly_budgets`.

---

## 2. Power BI Data Model & Relationships

Set up a Star / Snowflake dimensional model:
- **Fact Table 1**: `Transactions` (`synthetic_transactions`)
- **Fact Table 2**: `MonthlyBudgets` (`synthetic_budgets`)
- **Dimension 1**: `DimCategory` (Distinct Categories table, created via `DISTINCT(synthetic_transactions[category])` or from the SQL Category table).
- **Dimension 2**: `DimCalendar` (Date Table generated with `CALENDARAUTO()`).

### Relationship Mappings:
1. `DimCategory[Category]` **1 : Many (1:*)** `Transactions[category]` (Single cross-filter direction).
2. `DimCategory[Category]` **1 : Many (1:*)** `MonthlyBudgets[category]` (Single cross-filter direction).
3. `DimCalendar[Date]` **1 : Many (1:*)** `Transactions[date]` (Single cross-filter direction).

---

## 3. Implemented DAX Measures
All DAX measure definitions can be copied directly from `dax_measures.txt`. Key measures include:
- `Total Spend`
- `Total Budget`
- `Budget Variance`
- `Budget Utilization %`
- `Month-over-Month (MoM) Spend Growth %`
- `Top Expense Category`
- `Average Daily Spend`

---

## 4. Suggested Report Visual Layout

| Visual Tile | Recommended Visual Type | Data Fields |
| :--- | :--- | :--- |
| **Header KPIs** | Card / New Card Visual | `Total Spend`, `Total Budget`, `Budget Variance`, `Utilization %` |
| **Category Breakdown** | Donut Chart or Treemap | Legend: `Category`, Values: `Total Spend` |
| **Monthly Trend** | Clustered Column & Line Chart | X-Axis: `Month-Year`, Columns: `Total Spend` & `Total Budget`, Line: `Utilization %` |
| **Variance Matrix** | Matrix Visual | Rows: `Category`, Values: `Budget`, `Actual`, `Variance`, Conditional Formatting on `Variance` |
| **Payment Channel Mix** | 100% Stacked Bar Chart | Axis: `Payment Method`, Values: `Total Spend` |
| **Detailed Ledger** | Table Visual | `Date`, `Description`, `Category`, `Amount` |
