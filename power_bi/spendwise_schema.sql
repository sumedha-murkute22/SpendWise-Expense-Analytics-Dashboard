-- =====================================================
-- SpendWise Relational Schema DDL
-- Database: SQLite / PostgreSQL / MySQL Compatible
-- =====================================================

-- Table: categories
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20) DEFAULT '#4f46e5',
    icon VARCHAR(30) DEFAULT 'tag'
);

-- Table: transactions
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATETIME NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Credit Card',
    category_id INTEGER NOT NULL,
    CONSTRAINT fk_transactions_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE CASCADE
);

-- Table: monthly_budgets
CREATE TABLE IF NOT EXISTS monthly_budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_year VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
    budget_amount DECIMAL(10, 2) NOT NULL,
    category_id INTEGER NOT NULL,
    CONSTRAINT fk_budgets_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_month_category
        UNIQUE (month_year, category_id)
);

-- Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month_category ON monthly_budgets(month_year, category_id);

-- Analytics View: Monthly Spend Summary
CREATE VIEW IF NOT EXISTS v_monthly_spend_summary AS
SELECT 
    strftime('%Y-%m', t.date) AS month_year,
    c.name AS category_name,
    c.color AS category_color,
    COUNT(t.id) AS total_transactions,
    ROUND(SUM(t.amount), 2) AS total_spent,
    COALESCE(b.budget_amount, 0) AS budget_amount,
    ROUND(COALESCE(b.budget_amount, 0) - SUM(t.amount), 2) AS variance
FROM categories c
JOIN transactions t ON t.category_id = c.id
LEFT JOIN monthly_budgets b ON b.category_id = c.id AND b.month_year = strftime('%Y-%m', t.date)
GROUP BY strftime('%Y-%m', t.date), c.name, c.color, b.budget_amount;
