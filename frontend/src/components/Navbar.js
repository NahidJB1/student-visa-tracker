'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/processing', label: 'Processing', icon: '📋' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  if (isAdmin) {
    navLinks.push({ href: '/admin', label: 'Admin', icon: '🛡️' });
  }

  return (
    <nav className="navbar">
      <Link href="/dashboard" className="navbar-brand">
        <span>SVT</span>
      </Link>

      <div className="navbar-nav">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`navbar-link ${pathname === link.href ? 'active' : ''}`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>

      <div className="navbar-user">
        <div className="navbar-user-info">
          <span className="navbar-user-name">{user?.name || 'User'}</span>
          {isAdmin && <span className="navbar-role-badge">Admin</span>}
        </div>
        <button className="navbar-logout" onClick={logout}>
          <span>↪</span> Logout
        </button>
      </div>

      <button
        className="navbar-hamburger"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`navbar-mobile-menu ${mobileOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`navbar-link ${pathname === link.href ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.name || 'User'}
            </span>
            {isAdmin && <span className="navbar-role-badge">Admin</span>}
          </div>
          <button className="navbar-logout" onClick={logout} style={{ width: '100%', justifyContent: 'center' }}>
            <span>↪</span> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
