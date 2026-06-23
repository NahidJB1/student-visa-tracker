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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      setProfileData({ name: user.name || '', email: user.email || '' });
    }
  }, [user, loading, router]);

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
    <div className="page-container">
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
