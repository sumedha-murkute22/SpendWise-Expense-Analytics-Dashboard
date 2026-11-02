import React, { useState } from 'react';

export default function BudgetVsActualTable({ items, activeMonth, onUpdateBudget }) {
  const [editingCatId, setEditingCatId] = useState(null);
  const [newBudgetVal, setNewBudgetVal] = useState('');

  const handleStartEdit = (item) => {
    setEditingCatId(item.category_id);
    setNewBudgetVal(item.budget_amount.toString());
  };

  const handleSaveBudget = (categoryId) => {
    const val = parseFloat(newBudgetVal);
    if (!isNaN(val) && val >= 0) {
      onUpdateBudget(categoryId, activeMonth, val);
    }
    setEditingCatId(null);
  };

  return (
    <div className="card" style={{ gridColumn: 'span 12' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 className="card-title">Budget vs. Actual Variance</h3>
          <p className="card-subtitle">Category breakdown for month {activeMonth}</p>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Budget Assigned</th>
              <th>Actual Spent</th>
              <th>Variance ($)</th>
              <th>Utilization (%)</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isOver = item.status === 'over_budget';
              const isWarning = item.status === 'warning';
              const progressWidth = Math.min(item.percentage_utilized, 100);

              return (
                <tr key={item.category_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }}></span>
                      <strong>{item.category_name}</strong>
                    </div>
                  </td>

                  <td>
                    {editingCatId === item.category_id ? (
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input
                          type="number"
                          className="text-input"
                          style={{ width: '90px', padding: '0.25rem 0.5rem' }}
                          value={newBudgetVal}
                          onChange={(e) => setNewBudgetVal(e.target.value)}
                        />
                        <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleSaveBudget(item.category_id)}>
                          Save
                        </button>
                      </div>
                    ) : (
                      <span>${item.budget_amount.toFixed(2)}</span>
                    )}
                  </td>

                  <td>${item.actual_spent.toFixed(2)}</td>

                  <td style={{ color: isOver ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                    {item.variance >= 0 ? `+$${item.variance.toFixed(2)}` : `-$${Math.abs(item.variance).toFixed(2)}`}
                  </td>

                  <td style={{ width: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${progressWidth}%`,
                            height: '100%',
                            backgroundColor: isOver ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '40px' }}>{item.percentage_utilized}%</span>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`kpi-badge ${
                        isOver ? 'badge-danger' : isWarning ? 'badge-warning' : 'badge-success'
                      }`}
                    >
                      {isOver ? 'Over Budget' : isWarning ? 'Near Limit' : 'On Track'}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    {editingCatId !== item.category_id && (
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => handleStartEdit(item)}
                      >
                        Adjust Budget
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
