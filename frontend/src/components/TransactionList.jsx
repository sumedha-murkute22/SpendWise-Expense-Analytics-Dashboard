import React, { useState } from 'react';

export default function TransactionList({
  transactions,
  categories,
  onDeleteTransaction,
  onOpenAddModal,
  onOpenUploadModal,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory
}) {
  return (
    <div className="card" style={{ gridColumn: 'span 12' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 className="card-title">Transaction Ledger</h3>
          <p className="card-subtitle">Search, filter, and audit individual expenditure line items</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="text-input"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '220px' }}
          />

          <select
            className="select-input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button className="btn btn-outline" onClick={onOpenUploadModal}>
            Upload CSV
          </button>

          <button className="btn btn-primary" onClick={onOpenAddModal}>
            + Add Transaction
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Payment Method</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No transactions found matching your criteria.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td>
                    <strong>{tx.description}</strong>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8125rem'
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: tx.category_color || '#64748b'
                        }}
                      />
                      {tx.category_name}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{tx.payment_method}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${tx.amount.toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-danger-outline"
                      onClick={() => onDeleteTransaction(tx.id)}
                      title="Delete record"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
