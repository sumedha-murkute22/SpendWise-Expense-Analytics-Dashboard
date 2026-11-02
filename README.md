<<<<<<< HEAD
# SpendWise — Expense Analytics & Budgeting Dashboard

> **Portfolio Project:** Full-stack personal finance and budgeting platform featuring a React.js interactive analytics dashboard, a Python REST API, a SQL database, automated CSV transaction ingestion, and a companion Power BI business intelligence model.

---

> [!WARNING]
> **Verification Status Disclaimer:**  
> This project codebase was authored in accordance with resume specifications and software engineering design patterns. **It has not been executed, compiled, tested, or deployed in a live environment within this generation turn.** Pre-flight validation, dependency installation, and local runtime verification must be conducted by the user before running in a production or evaluation setting.

---

## 1. Resume Technology Alignment

| Resume Item | Implementation in SpendWise |
| :--- | :--- |
| **React.js Dashboard** | Responsive React 18 frontend with custom SVG interactive donut charts, monthly trend bars, and live budget variance monitors. |
| **Python REST API** | FastAPI backend with structured routes, dependency injection, and Pydantic request/response validation schemas. |
| **SQL Database** | Relational SQLAlchemy ORM and SQLite database (`spendwise.db`) with relational foreign keys, indexes, and an analytics view. |
| **Analytics Endpoints** | Dedicated analytical aggregations: Category Breakdown, Monthly Trends, and Budget vs. Actual variance with status indicators. |
| **CSV Bulk Ingestion** | Multipart form file upload endpoint parsing, sanitizing, and bulk-inserting CSV transactions with automatic category reconciliation. |
| **Companion Power BI Report** | Star-schema data model guide, relational DDL, and documented production DAX measures (Variance, Utilization %, MoM Spend Growth). |

---

## 2. Architecture & File Structure

```text
SpendWise/
├── .env.example                     # Environment configuration template
├── .gitignore                       # Git ignore rules for Python, Node, & SQLite
├── README.md                        # Project documentation and setup guide
├── backend/
│   ├── analytics.py                 # Metric calculations: KPIs, category share, trends, variance
│   ├── crud.py                      # Database operations and query builders
│   ├── csv_importer.py              # CSV parsing and batch ingestion pipeline
│   ├── database.py                  # SQLAlchemy engine and session dependency
│   ├── main.py                      # FastAPI application, CORS, and endpoint definitions
│   ├── models.py                    # SQLAlchemy ORM models (Category, Transaction, MonthlyBudget)
│   ├── requirements.txt             # Python backend dependencies
│   ├── schemas.py                   # Pydantic data models and validation contracts
│   └── seed_data.py                 # Synthetic database seeding script
├── data/
│   ├── synthetic_budgets.csv        # Synthetic category budget allocations
│   └── synthetic_transactions.csv   # 40+ labeled synthetic transactions across multiple months
├── frontend/
│   ├── index.html                   # HTML entry point with Inter font
│   ├── package.json                 # React 18, Vite dependencies & scripts
│   ├── vite.config.js               # Vite bundler and API proxy settings
│   └── src/
│       ├── App.jsx                  # Main application state and tab controller
│       ├── index.css                # CSS design system and responsive grid
│       ├── main.jsx                 # React root DOM mount point
│       └── components/
│           ├── AddTransactionModal.jsx   # Single expense entry dialog
│           ├── BudgetVsActualTable.jsx   # Budget variance monitor with inline adjustment
│           ├── CategoryPieChart.jsx      # Pure SVG category donut visualization
│           ├── CsvUploadModal.jsx        # Drag-and-drop CSV batch upload modal
│           ├── MonthlyTrendChart.jsx     # Pure SVG monthly expenditure vs. budget trend chart
│           ├── StatCards.jsx             # Key KPI summary stat cards
│           └── TransactionList.jsx       # Searchable, filterable transaction ledger table
└── power_bi/
    ├── README_PowerBI.md            # Power BI ingestion, modeling, and dashboard layout guide
    ├── dax_measures.txt             # Production DAX measures (Total Spend, MoM Growth, etc.)
    └── spendwise_schema.sql         # SQL DDL & analytical view definitions
```

---

## 3. Database Schema

The SQLite relational database comprises three normalized tables:

1. **`categories`**:
   - `id` (INTEGER, PK)
   - `name` (VARCHAR, Unique)
   - `color` (VARCHAR, Hex color code)
   - `icon` (VARCHAR)

2. **`transactions`**:
   - `id` (INTEGER, PK)
   - `date` (DATETIME)
   - `amount` (DECIMAL/FLOAT)
   - `description` (VARCHAR)
   - `payment_method` (VARCHAR: Credit Card, Debit Card, Bank Transfer, Cash)
   - `category_id` (INTEGER, FK -> `categories.id`)

3. **`monthly_budgets`**:
   - `id` (INTEGER, PK)
   - `month_year` (VARCHAR, Format: `YYYY-MM`)
   - `budget_amount` (DECIMAL/FLOAT)
   - `category_id` (INTEGER, FK -> `categories.id`)
   - *Constraint*: `UNIQUE(month_year, category_id)`

---

## 4. Synthetic Sample Data

All sample data included in `data/synthetic_transactions.csv` and `data/synthetic_budgets.csv` consists of **clearly labeled, synthetically generated sample records** designed to demonstrate:
- Consistent multi-month trends across August, September, and October 2026.
- Diverse spending categories: Housing, Groceries, Utilities, Dining, Transportation, Entertainment, Healthcare, and Shopping.
- Scenarios with healthy budget margins as well as over-budget warnings to test UI visual thresholds.

---

## 5. Setup & Execution Instructions

### Prerequisites
- **Python 3.9+**
- **Node.js 18+ & npm**

---

### Step 1: Configure Environment Variables
Copy the template file:
```bash
cp .env.example .env
```

---

### Step 2: Backend Setup (FastAPI & SQLite)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Populate initial database with synthetic records (Optional; `main.py` also auto-seeds on initial boot):
   ```bash
   python seed_data.py
   ```

5. Launch the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   - API Root: `http://localhost:8000`
   - Interactive Swagger Docs: `http://localhost:8000/docs`
   - ReDoc Documentation: `http://localhost:8000/redoc`

---

### Step 3: Frontend Setup (React 18 & Vite)

1. Open a second terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - Application URL: `http://localhost:5173`

---

## 6. REST API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck and service version status |
| `GET` | `/api/categories` | Fetch all categorized expense heads |
| `POST` | `/api/categories` | Create a new expense category |
| `GET` | `/api/transactions` | Query transactions with month, category, and text filters |
| `POST` | `/api/transactions` | Create an individual transaction |
| `DELETE` | `/api/transactions/{id}` | Remove a transaction record |
| `POST` | `/api/transactions/import-csv` | Bulk upload CSV file with automated parsing |
| `GET` | `/api/budgets` | Fetch category budgets for a specific month (`YYYY-MM`) |
| `POST` | `/api/budgets` | Set or update a monthly category budget |
| `GET` | `/api/analytics/kpis` | Summary metrics: Total spend, budget, variance, utilization % |
| `GET` | `/api/analytics/category-breakdown` | Category share breakdown for donut visualization |
| `GET` | `/api/analytics/monthly-trends` | Multi-month spending versus budget trend lines |
| `GET` | `/api/analytics/budget-vs-actual` | Category-by-category variance table data |

---

## 7. Power BI Companion Integration

Refer to [power_bi/README_PowerBI.md](power_bi/README_PowerBI.md) for full instructions on loading `data/synthetic_transactions.csv` into Power BI Desktop, establishing relationship models, and applying the measures in `power_bi/dax_measures.txt`.
=======
# SpendWise-Expense-Analytics-Dashboard
>>>>>>> d47cd87fad783cf38bff4bf16fcc7f1f68abd195
