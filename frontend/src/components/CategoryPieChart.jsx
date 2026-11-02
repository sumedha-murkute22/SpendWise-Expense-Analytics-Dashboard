import React, { useState } from 'react';

export default function CategoryPieChart({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ gridColumn: 'span 5' }}>
        <h3 className="card-title">Spend by Category</h3>
        <p className="card-subtitle">Distribution of expenditures</p>
        <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          No category spend data available for this month.
        </div>
      </div>
    );
  }

  const total = data.reduce((acc, item) => acc + item.total_spent, 0);

  // Calculate SVG donut segments
  let cumulativeAngle = 0;
  const radius = 70;
  const strokeWidth = 32;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  const slices = data.map((item, idx) => {
    const fraction = total > 0 ? item.total_spent / total : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      index: idx
    };
  });

  return (
    <div className="card" style={{ gridColumn: 'span 5', minHeight: '380px' }}>
      <h3 className="card-title">Spend by Category</h3>
      <p className="card-subtitle">Distribution of total expenditures across categories</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '200px', height: '200px' }}>
          <svg viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            {slices.map((slice) => (
              <circle
                key={slice.category_id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={hoveredIndex === slice.index ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                style={{
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </svg>

          {/* Center Info Pill */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
              {hoveredIndex !== null ? slices[hoveredIndex].category_name : 'Total Spend'}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              ${hoveredIndex !== null ? slices[hoveredIndex].total_spent.toFixed(2) : total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, minWidth: '150px', maxHeight: '200px', overflowY: 'auto' }}>
          {slices.map((slice) => (
            <div
              key={slice.category_id}
              onMouseEnter={() => setHoveredIndex(slice.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.35rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: hoveredIndex === slice.index ? '#f1f5f9' : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: slice.color }}></span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>{slice.category_name}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>${slice.total_spent.toFixed(0)}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>({slice.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
