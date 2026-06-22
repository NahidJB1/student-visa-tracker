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

function formatCurrency(value) {
  if (value == null || isNaN(value)) return '$0.00';
  return '$' + Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      <div className="value">{formatCurrency(payload[0].value)}</div>
    </div>
  );
}

function AnimatedValue({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, value);
      setDisplay(current);
      if (step >= steps) {
        setDisplay(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return formatCurrency(display);
}

export default function EarningsSummary() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const result = await api.getEarnings();
        if (!cancelled) {
          setEarnings(result.earnings || result.data || result);
        }
      } catch (err) {
        console.error('Failed to fetch earnings:', err);
        if (!cancelled) setEarnings(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const cards = earnings ? [
    { label: '1 Month', value: earnings.oneMonth ?? earnings['1month'] ?? 0 },
    { label: '3 Months', value: earnings.threeMonths ?? earnings['3months'] ?? 0 },
    { label: '6 Months', value: earnings.sixMonths ?? earnings['6months'] ?? 0 },
    { label: '12 Months', value: earnings.twelveMonths ?? earnings['12months'] ?? 0 },
  ] : [];

  const chartData = cards.map((c) => ({
    period: c.label,
    earnings: c.value,
  }));

  return (
    <div>
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">Earnings Overview</h3>
      </div>

      {loading ? (
        <>
          <div className="earnings-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
          <div className="skeleton skeleton-chart" style={{ height: 200 }} />
        </>
      ) : (
        <>
          <div className="earnings-grid">
            {cards.map((card, index) => (
              <div
                key={card.label}
                className={`earnings-card animate-slide-up delay-${index + 1}`}
              >
                <div className="earnings-card-label">{card.label}</div>
                <div className={`earnings-card-value ${card.value >= 0 ? 'positive' : 'negative'}`}>
                  <AnimatedValue value={card.value} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 220, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#a29bfe" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="period"
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
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="earnings"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
