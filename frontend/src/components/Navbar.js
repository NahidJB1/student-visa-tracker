'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      <div className="navbar-user" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', position: 'relative' }} ref={dropdownRef}>
        <div 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 'var(--radius-md)',
            transition: 'background 0.2s',
            background: dropdownOpen ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
          }}
        >
          {isAdmin && <span className="navbar-role-badge" style={{ marginRight: '8px' }}>Admin</span>}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            fontWeight: '700',
            color: 'white'
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        {dropdownOpen && (
          <div className="glass-card animate-scale-in" style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '240px',
            padding: '8px 0',
            zIndex: 100,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>{user?.email}</div>
            </div>
            
            <Link 
              href="/settings" 
              className="dropdown-item" 
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background 0.2s', fontSize: '0.95rem' }}
              onClick={() => setDropdownOpen(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              Profile Settings
            </Link>

            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

            <button 
              className="dropdown-item"
              onClick={logout} 
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--error-color, #ff7675)', textDecoration: 'none', transition: 'background 0.2s', fontSize: '0.95rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Switch Account / Log Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
