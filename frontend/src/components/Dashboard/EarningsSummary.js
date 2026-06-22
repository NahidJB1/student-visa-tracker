'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';

function formatCurrency(value, currency) {
  if (value == null || isNaN(value)) return `${currency === 'BDT' ? '৳' : 'RM'} 0.00`;
  const symbol = currency === 'BDT' ? '৳' : 'RM';
  return `${symbol} ` + Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      <div className="value">{formatCurrency(payload[0].value, currency)}</div>
    </div>
  );
}

export default function EarningsSummary() {
  const [period, setPeriod] = useState('1m');
  const [currency, setCurrency] = useState('RM');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const result = await api.getEarningsTimeline(period, currency);
        if (!cancelled) {
          setData(result.timeline || []);
        }
      } catch (err) {
        console.error('Failed to fetch earnings timeline:', err);
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [period, currency]);

  const periods = [
    { value: '1m', label: '1 Month' },
    { value: '3m', label: '3 Months' },
    { value: '6m', label: '6 Months' },
  ];

  return (
    <div>
      <div className="dashboard-card-header" style={{ alignItems: 'flex-start' }}>
        <h3 className="dashboard-card-title">Earnings Overview</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div className="chart-toggle" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <button
              className={currency === 'RM' ? 'active' : ''}
              onClick={() => setCurrency('RM')}
              style={{ padding: '4px 12px' }}
            >
              RM
            </button>
            <button
              className={currency === 'BDT' ? 'active' : ''}
              onClick={() => setCurrency('BDT')}
              style={{ padding: '4px 12px' }}
            >
              BDT
            </button>
          </div>
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
      </div>

      {loading ? (
        <div className="skeleton skeleton-chart" style={{ height: 280, marginTop: 16 }} />
      ) : (
        <div style={{ height: 280, marginTop: 16 }}>
          {data.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              No earnings recorded for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#a29bfe" stopOpacity={0.6} />
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
                  tickFormatter={(v) => {
                    const sym = currency === 'BDT' ? '৳' : 'RM';
                    if (v >= 1000) return `${sym}${(v / 1000).toFixed(0)}k`;
                    return `${sym}${v}`;
                  }}
                />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Bar
                  dataKey="total"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
