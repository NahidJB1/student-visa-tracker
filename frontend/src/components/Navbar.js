'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="navbar" style={{ padding: '0 24px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/dashboard" className="navbar-brand">
          <span>SVT</span>
        </Link>
        {pathname !== '/dashboard' && (
          <Link href="/dashboard" className="btn-icon" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', textDecoration: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Home</span>
          </Link>
        )}
      </div>

      <div className="navbar-user" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
        <div className="navbar-user-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="navbar-user-name" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user?.name || 'User'}</span>
          {isAdmin && <span className="navbar-role-badge">Admin</span>}
        </div>
        <button className="navbar-logout" onClick={logout} style={{ marginLeft: '16px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </div>
    </nav>
  );
}
