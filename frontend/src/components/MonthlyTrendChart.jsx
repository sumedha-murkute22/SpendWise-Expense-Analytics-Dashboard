import React, { useState } from 'react';

export default function MonthlyTrendChart({ trends }) {
  const [activeBar, setActiveBar] = useState(null);

  if (!trends || trends.length === 0) {
    return (
      <div className="card" style={{ gridColumn: 'span 7' }}>
        <h3 className="card-title">Monthly Spending Trends</h3>
        <p className="card-subtitle">Month-by-month spend comparison</p>
        <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          No trend data recorded.
        </div>
      </div>
    );
  }

  const maxVal = Math.max(...trends.flatMap(t => [t.total_spent, t.total_budget, 100]));
  const chartHeight = 160;
  const chartWidth = 480;
  const barGroupWidth = chartWidth / trends.length;
  const barWidth = 18;

  return (
    <div className="card" style={{ gridColumn: 'span 7', minHeight: '380px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="card-title">Monthly Trends</h3>
          <p className="card-subtitle">Comparison of actual spend against assigned monthly budget</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#4f46e5', borderRadius: '2px' }}></span>
            <span>Actual Spend</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#cbd5e1', borderRadius: '2px' }}></span>
            <span>Budget Target</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} style={{ width: '100%', height: '220px', overflow: 'visible' }}>
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = chartHeight - pct * chartHeight;
            return (
              <g key={i}>
                <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x="0" y={y - 4} fill="#94a3b8" fontSize="9">
                  ${Math.round(pct * maxVal)}
                </text>
              </g>
            );
          })}

          {/* Bar Groups */}
          {trends.map((t, idx) => {
            const groupX = idx * barGroupWidth + (barGroupWidth / 2);
            const spendHeight = (t.total_spent / maxVal) * chartHeight;
            const budgetHeight = (t.total_budget / maxVal) * chartHeight;

            const spendY = chartHeight - spendHeight;
            const budgetY = chartHeight - budgetHeight;

            const isHovered = activeBar === idx;

            return (
              <g
                key={t.month_year}
                onMouseEnter={() => setActiveBar(idx)}
                onMouseLeave={() => setActiveBar(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Budget Bar (Background/Muted) */}
                <rect
                  x={groupX - barWidth - 2}
                  y={budgetY}
                  width={barWidth}
                  height={budgetHeight}
                  fill={isHovered ? '#94a3b8' : '#e2e8f0'}
                  rx="3"
                  style={{ transition: 'all 0.2s' }}
                />

                {/* Actual Spend Bar */}
                <rect
                  x={groupX + 2}
                  y={spendY}
                  width={barWidth}
                  height={spendHeight}
                  fill={t.total_spent > t.total_budget ? '#ef4444' : '#4f46e5'}
                  rx="3"
                  style={{ transition: 'all 0.2s' }}
                />

                {/* Month Label */}
                <text
                  x={groupX}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontWeight={isHovered ? '700' : '400'}
                >
                  {t.month_year}
                </text>

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={groupX - 50}
                      y={Math.min(spendY, budgetY) - 34}
                      width="100"
                      height="28"
                      fill="#0f172a"
                      rx="4"
                    />
                    <text
                      x={groupX}
                      y={Math.min(spendY, budgetY) - 16}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="500"
                    >
                      ${t.total_spent.toFixed(0)} / ${t.total_budget.toFixed(0)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
