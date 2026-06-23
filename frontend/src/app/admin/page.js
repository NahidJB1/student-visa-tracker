'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { ToastProvider, useToast } from '@/components/Toast';

import PasswordInput from '@/components/PasswordInput';

function AdminPanel() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset Password State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      addToast('Failed to load users', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.register(formData);
      addToast('User created successfully!', 'success');
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      addToast(err.message || 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetUserId) return;
    setIsResetting(true);
    try {
      await api.resetUserPassword(resetUserId, resetPassword);
      addToast('Password reset successfully!', 'success');
      setResetModalOpen(false);
      setResetPassword('');
      setResetUserId(null);
    } catch (err) {
      addToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? ALL of their students, notes, and financials will be permanently erased!")) return;
    try {
      await api.adminDeleteUser(id);
      addToast('User deleted successfully.', 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.message || 'Failed to delete user', 'error');
    }
  };

  if (loading || !isAdmin) return <div className="page-container"><div className="skeleton skeleton-chart" /></div>;

  return (
    <div className="page-container">
      <div className="processing-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Manage users and access control</p>
        </div>
        <button className="primary-button" onClick={() => setIsModalOpen(true)}>
          <span>+</span> Add User
        </button>
      </div>

      <div className="glass-card" style={{ marginTop: '24px' }}>
        <div className="student-table-container">
          <table className="student-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="status-badge" data-status={u.role === 'admin' ? 'Visa Approved' : 'EMGS Hold'}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      className="secondary-button" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => {
                        setResetUserId(u.id);
                        setResetModalOpen(true);
                      }}
                    >
                      Reset Password
                    </button>
                    {user?.id !== u.id && (
                      <button 
                        className="btn-icon" 
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', cursor: 'pointer' }}
                        onClick={() => handleDeleteUser(u.id)}
                        title="Delete User"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: '600' }}>Add New User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <PasswordInput
                label="Password"
                placeholder="Enter strong password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetModalOpen && (
        <div className="modal-overlay" onClick={() => setResetModalOpen(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: '600' }}>Reset User Password</h2>
            <form onSubmit={handleResetPassword}>
              <PasswordInput
                label="New Password"
                placeholder="Enter new password"
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
                required
              />
              <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                <button type="button" className="secondary-button" onClick={() => setResetModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={isResetting}>
                  {isResetting ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Navbar />
      <ToastProvider>
        <AdminPanel />
      </ToastProvider>
    </>
  );
}
