'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      <div className="value">{payload[0].value} students</div>
    </div>
  );
}

export default function TimeSeriesChart() {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const result = await api.getTimeline(period);
        if (!cancelled) {
          setData(result.timeline || result.data || result || []);
        }
      } catch (err) {
        console.error('Failed to fetch timeline:', err);
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [period]);

  const periods = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: '6months', label: '6 Months' },
  ];

  return (
    <div>
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">Student Growth</h3>
        <div className="chart-toggle">
          {periods.map((p) => (
            <button
              key={p.value}
              className={period === p.value ? 'active' : ''}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="skeleton skeleton-chart" />
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                stroke="var(--text-tertiary)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--text-tertiary)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6c5ce7"
                strokeWidth={2.5}
                fill="url(#areaGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: '#6c5ce7',
                  strokeWidth: 2,
                  fill: 'var(--bg-primary)',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
