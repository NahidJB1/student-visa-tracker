'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';
import TimeSeriesChart from '@/components/Dashboard/TimeSeriesChart';
import StatusDistribution from '@/components/Dashboard/StatusDistribution';
import EarningsSummary from '@/components/Dashboard/EarningsSummary';

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div className="loading-spinner" style={{
          width: 40,
          height: 40,
          borderWidth: 3,
          color: 'var(--accent-primary)',
        }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ToastProvider>
      <Navbar />
      <div className="page-container">
        <div className="page-header animate-slide-up">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name || 'User'}</p>
        </div>

        <div className="dashboard-grid">
          <div className="glass-card dashboard-card animate-slide-up delay-1">
            <TimeSeriesChart />
          </div>

          <div className="glass-card dashboard-card animate-slide-up delay-2">
            <StatusDistribution />
          </div>

          <div className="glass-card dashboard-card full-width animate-slide-up delay-3">
            <EarningsSummary />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
