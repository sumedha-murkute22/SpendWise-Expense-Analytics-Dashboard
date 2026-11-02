import React, { useState, useEffect } from 'react';
import StatCards from './components/StatCards';
import CategoryPieChart from './components/CategoryPieChart';
import MonthlyTrendChart from './components/MonthlyTrendChart';
import BudgetVsActualTable from './components/BudgetVsActualTable';
import TransactionList from './components/TransactionList';
import AddTransactionModal from './components/AddTransactionModal';
import CsvUploadModal from './components/CsvUploadModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'transactions'
  const [activeMonth, setActiveMonth] = useState('2026-10');
  const [availableMonths, setAvailableMonths] = useState(['2026-10', '2026-09', '2026-08']);

  // Data State
  const [kpis, setKpis] = useState(null);
  const [categorySpend, setCategorySpend] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [budgetVsActual, setBudgetVsActual] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch reference categories
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  // Fetch Dashboard & Analytics Data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [kpiRes, catRes, trendRes, bvaRes] = await Promise.all([
        fetch(`/api/analytics/kpis?month_year=${activeMonth}`),
        fetch(`/api/analytics/category-breakdown?month_year=${activeMonth}`),
        fetch('/api/analytics/monthly-trends?limit=6'),
        fetch(`/api/analytics/budget-vs-actual?month_year=${activeMonth}`)
      ]);

      const [kpiData, catData, trendData, bvaData] = await Promise.all([
        kpiRes.json(),
        catRes.json(),
        trendRes.json(),
        bvaRes.json()
      ]);

      setKpis(kpiData);
      setCategorySpend(catData);
      setMonthlyTrends(trendData);
      setBudgetVsActual(bvaData);

      // Populate months list from trends if available
      if (trendData && trendData.length > 0) {
        const months = trendData.map((t) => t.month_year).reverse();
        setAvailableMonths(months);
      }
    } catch (err) {
      console.error('Error fetching dashboard analytics', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Transactions List
  const loadTransactions = async () => {
    try {
      let url = `/api/transactions?month_year=${activeMonth}&limit=200`;
      if (selectedCategory) url += `&category_id=${selectedCategory}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await fetch(url);
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeMonth]);

  useEffect(() => {
    loadTransactions();
  }, [activeMonth, selectedCategory, searchTerm]);

  // Action Handlers
  const handleAddTransaction = async (newTx) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      });
      if (res.ok) {
        loadDashboardData();
        loadTransactions();
      }
    } catch (err) {
      console.error('Error adding transaction', err);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadDashboardData();
        loadTransactions();
      }
    } catch (err) {
      console.error('Error deleting transaction', err);
    }
  };

  const handleUpdateBudget = async (categoryId, monthYear, budgetAmount) => {
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: categoryId,
          month_year: monthYear,
          budget_amount: budgetAmount
        })
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error updating budget', err);
    }
  };

  return (
    <div>
      {/* Top Navigation Bar */}
      <header className="header-container">
        <div className="brand">
          <div className="brand-logo">SW</div>
          <div>
            <h1 className="brand-title">SpendWise</h1>
            <p className="brand-tag">Expense Analytics & Budgeting Dashboard</p>
          </div>
        </div>

        <div className="nav-actions">
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Period:</label>
          <select
            className="select-input"
            value={activeMonth}
            onChange={(e) => setActiveMonth(e.target.value)}
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <button className="btn btn-outline" onClick={() => setIsUploadOpen(true)}>
            Import CSV
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            + New Expense
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="app-container">
        {/* Navigation Tabs */}
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Analytics Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions Ledger
          </button>
        </div>

        {/* Tab 1: Analytics Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <StatCards kpis={kpis} />

            <div className="section-grid">
              <MonthlyTrendChart trends={monthlyTrends} />
              <CategoryPieChart data={categorySpend} />
              <BudgetVsActualTable
                items={budgetVsActual}
                activeMonth={activeMonth}
                onUpdateBudget={handleUpdateBudget}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Transactions Ledger */}
        {activeTab === 'transactions' && (
          <div className="section-grid">
            <TransactionList
              transactions={transactions}
              categories={categories}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenAddModal={() => setIsAddOpen(true)}
              onOpenUploadModal={() => setIsUploadOpen(true)}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddTransaction={handleAddTransaction}
        categories={categories}
      />

      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          loadDashboardData();
          loadTransactions();
        }}
      />
    </div>
  );
}
