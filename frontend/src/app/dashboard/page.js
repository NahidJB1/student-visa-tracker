'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3, color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const apps = [
    { name: 'Analytics', icon: '📊', href: '/analytics', desc: 'Earnings & Metrics', color: 'var(--info)' },
    { name: 'Processing', icon: '📋', href: '/processing', desc: 'Active Applications', color: 'var(--success)' },
    { name: 'Sub & Uni', icon: '🎓', href: '/universities', desc: 'Search Programs', color: 'var(--warning)' },
    { name: 'Notes', icon: '📝', href: '/notes', desc: 'Private Workspace', color: 'var(--accent-secondary)' },
    { name: 'Archived', icon: '📦', href: '/archived', desc: 'Rejected & Flown', color: 'var(--text-tertiary)' },
    { name: 'Settings', icon: '⚙️', href: '/settings', desc: 'Account Prefs', color: 'var(--text-secondary)' },
  ];

  if (isAdmin) {
    apps.push({ name: 'Admin Panel', icon: '🛡️', href: '/admin', desc: 'User Management', color: 'var(--error)' });
  }

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 140px)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>What would you like to do today?</p>
        </div>

        <div className="app-grid">
          {apps.map((app, index) => (
            <Link href={app.href} key={app.name} className="app-grid-item glass-card-hover" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="app-icon" style={{ background: `color-mix(in srgb, ${app.color} 15%, transparent)`, color: app.color }}>
                {app.icon}
              </div>
              <h2 className="app-name">{app.name}</h2>
              <p className="app-desc">{app.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </>
  );
}
