import React from 'react';

export default function StatCards({ kpis }) {
  if (!kpis) return null;

  const {
    total_spend = 0,
    total_budget = 0,
    net_variance = 0,
    budget_utilization_pct = 0,
    total_transactions = 0,
    active_month = ''
  } = kpis;

  const isOverBudget = net_variance < 0;
  const utilizationStatus =
    budget_utilization_pct > 100
      ? 'badge-danger'
      : budget_utilization_pct > 85
      ? 'badge-warning'
      : 'badge-success';

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <span className="kpi-label">Total Spend ({active_month})</span>
        <span className="kpi-value">${total_spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className="kpi-badge badge-neutral">{total_transactions} recorded transactions</span>
      </div>

      <div className="kpi-card">
        <span className="kpi-label">Allocated Budget</span>
        <span className="kpi-value">${total_budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className="kpi-badge badge-neutral">Target for {active_month}</span>
      </div>

      <div className="kpi-card">
        <span className="kpi-label">Net Variance</span>
        <span className="kpi-value" style={{ color: isOverBudget ? 'var(--danger)' : 'var(--success)' }}>
          {isOverBudget ? '-' : '+'}${Math.abs(net_variance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`kpi-badge ${isOverBudget ? 'badge-danger' : 'badge-success'}`}>
          {isOverBudget ? 'Over Budget' : 'Within Budget'}
        </span>
      </div>

      <div className="kpi-card">
        <span className="kpi-label">Budget Utilization</span>
        <span className="kpi-value">{budget_utilization_pct}%</span>
        <span className={`kpi-badge ${utilizationStatus}`}>
          {budget_utilization_pct > 100 ? 'Exceeded Budget' : `${(100 - budget_utilization_pct).toFixed(1)}% remaining`}
        </span>
      </div>
    </div>
  );
}
