'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { ToastProvider, useToast } from '@/components/Toast';

import PasswordInput from '@/components/PasswordInput';

function SettingsPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      setProfileData({ name: user.name || '', email: user.email || '' });
    }
  }, [user, loading, router]);

  useEffect(() => {
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        setIsInstalled(true);
      }
    };
    checkInstalled();
    
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstalled(false);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (!isInstalled) {
      addToast('To install on iOS: tap the Share icon and select "Add to Home Screen". On desktop: check the URL bar for an install icon.', 'info');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await api.updateProfile(profileData);
      addToast('Profile updated successfully!', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    try {
      await api.updatePassword(passwordData);
      addToast('Password updated successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      addToast(err.message || 'Failed to update password', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading || !user) return <div className="page-container"><div className="skeleton skeleton-chart" /></div>;

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      <div className="processing-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Manage your personal account preferences</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: '32px', gap: '32px' }}>
        <div className="glass-card animate-slide-up" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '32px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'white'
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Profile Details</h2>
              <p style={{ color: 'var(--text-tertiary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Update your personal information</p>
            </div>
          </div>
          
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={profileData.name}
                onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={profileData.email}
                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                required
              />
            </div>
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="primary-button" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        <div className="glass-card animate-slide-up delay-1" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Security</h2>
            <p style={{ color: 'var(--text-tertiary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Change your password</p>
          </div>
          <form onSubmit={handleUpdatePassword}>
            <PasswordInput
              label="Current Password"
              placeholder="Enter current password"
              value={passwordData.currentPassword}
              onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              required
            />
            <PasswordInput
              label="New Password"
              placeholder="Enter new strong password"
              value={passwordData.newPassword}
              onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
            />
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="primary-button" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        <div className="glass-card animate-slide-up delay-2 full-width" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>App Installation</h2>
            <p style={{ color: 'var(--text-tertiary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Install SVT on your device</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>SVT App</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                {isInstalled ? 'App is currently installed on this device.' : 'Install for a better native experience.'}
              </p>
            </div>
            <button 
              className="primary-button" 
              disabled={isInstalled}
              onClick={handleInstallClick}
              style={{ padding: '8px 16px', opacity: isInstalled ? 0.5 : 1, cursor: isInstalled ? 'default' : 'pointer' }}
            >
              {isInstalled ? 'Installed' : 'Install'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Navbar />
      <ToastProvider>
        <SettingsPanel />
      </ToastProvider>
    </>
  );
}
