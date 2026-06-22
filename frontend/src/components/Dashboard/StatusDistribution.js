'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import { api } from '@/lib/api';

const STATUS_COLORS = {
  'Offer letter issued': '#6c5ce7',
  'EMGS paid': '#a29bfe',
  'EMGS 5%': '#74b9ff',
  'EMGS 15%': '#0984e3',
  'EMGS 32%': '#00cec9',
  'EMGS 35%': '#55efc4',
  'EMGS 70%': '#ffeaa7',
  'Visa Approved': '#00b894',
  'Tuition fees paid': '#fdcb6e',
  'Flight done': '#e17055',
  'EMGS Hold': '#ff7675',
  'Visa Rejected': '#d63031',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="custom-tooltip">
      <div className="label">{item.name}</div>
      <div className="value">{item.value} students</div>
    </div>
  );
}

function renderActiveShape(props) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, value,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 0 8px rgba(108, 92, 231, 0.4))' }}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-primary)" fontSize={14} fontWeight={700}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-secondary)" fontSize={12}>
        {value} students
      </text>
    </g>
  );
}

export default function StatusDistribution() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const result = await api.getStatusDistribution();
        const items = result.distribution || result.data || result || [];
        if (!cancelled) {
          setData(items.filter((item) => item.count > 0));
        }
      } catch (err) {
        console.error('Failed to fetch distribution:', err);
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(-1);
  }, []);

  return (
    <div>
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">Status Distribution</h3>
      </div>

      {loading ? (
        <div className="skeleton skeleton-chart" />
      ) : data.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No data yet</div>
          <div className="empty-state-subtitle">Add students to see distribution</div>
        </div>
      ) : (
        <>
          <div className="chart-container" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={2}
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || '#6c5ce7'}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            padding: '0 8px',
            marginTop: '8px',
          }}>
            {data.map((entry, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: STATUS_COLORS[entry.status] || '#6c5ce7',
                    flexShrink: 0,
                  }}
                />
                {entry.status}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
