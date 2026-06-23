'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { ToastProvider, useToast } from '@/components/Toast';
import StudentTable from '@/components/Processing/StudentTable';
import AddStudentModal from '@/components/Processing/AddStudentModal';
import FinancialsModal from '@/components/Processing/FinancialsModal';
import { api } from '@/lib/api';

import { exportToCSV } from '@/lib/exportUtils';

const ALL_STATUSES = [
  'Offer letter issued',
  'EMGS paid',
  'EMGS 5%',
  'EMGS 15%',
  'EMGS 32%',
  'EMGS 35%',
  'EMGS 70%',
  'Visa Approved',
  'Tuition fees paid',
  'Flight done',
  'EMGS Hold',
  'Visa Rejected',
];

function ProcessingContent() {
  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const [students, setStudents] = useState([]);
  const [activeFilter, setActiveFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFinancialsModal, setShowFinancialsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewAll, setViewAll] = useState(false);

  const fetchStudents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getStudents({ status: activeFilter || null, archived: false, all: viewAll });
      setStudents(data.students || data || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      if (!silent) addToast('Failed to load students', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeFilter, viewAll, addToast]);

  useEffect(() => {
    fetchStudents();
    
    const intervalId = setInterval(() => fetchStudents(true), 30000);
    const handleFocus = () => fetchStudents(true);
    
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchStudents]);

  const handleFilterChange = useCallback((status) => {
    setActiveFilter(status);
  }, []);

  const handleAddStudent = useCallback(() => {
    setShowAddModal(false);
    addToast('Student added successfully!', 'success');
    fetchStudents();
  }, [addToast, fetchStudents]);

  const handleFinancialsClick = useCallback((student) => {
    setSelectedStudent(student);
    setShowFinancialsModal(true);
  }, []);

  const handleFinancialsSave = useCallback(() => {
    setShowFinancialsModal(false);
    setSelectedStudent(null);
    addToast('Financials saved successfully!', 'success');
    fetchStudents();
  }, [addToast, fetchStudents]);

  const handleStatusChange = useCallback(
    (studentId, newStatus) => {
      addToast(`Status updated to "${newStatus}"`, 'success');
      // Delay refresh to allow exit animation to play
      setTimeout(() => {
        fetchStudents();
      }, 500);
    },
    [addToast, fetchStudents]
  );

  const handleRefresh = useCallback(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleExport = () => {
    exportToCSV(students, `SVT_Export_${new Date().toISOString().split('T')[0]}.csv`);
    addToast('CSV Exported successfully!', 'success');
  };

  return (
    <>
      <div className="page-container">
        {/* Header */}
        <div className="processing-header animate-slide-up">
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1 className="page-title">Processing</h1>
            <p className="page-subtitle">Manage student visa applications</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isAdmin && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--surface)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <input 
                  type="checkbox" 
                  checked={viewAll} 
                  onChange={(e) => setViewAll(e.target.checked)} 
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Agency View</span>
              </label>
            )}
            <button
              className="secondary-button"
              onClick={handleExport}
              title="Export to CSV"
            >
              ⬇️ Export
            </button>
            <button
              className="primary-button"
              onClick={() => setShowAddModal(true)}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span>
              Add Student
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div
          className="glass-card animate-slide-up delay-1"
          style={{ padding: 12, marginBottom: 24 }}
        >
          <div className="filter-bar">
            <button
              className={`filter-pill ${activeFilter === '' ? 'active' : ''}`}
              onClick={() => handleFilterChange('')}
            >
              All
            </button>
            {ALL_STATUSES.map((status) => (
              <button
                key={status}
                className={`filter-pill ${activeFilter === status ? 'active' : ''}`}
                onClick={() => handleFilterChange(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Student table */}
        <div className="animate-slide-up delay-2">
          {loading ? (
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: 56, borderRadius: 'var(--radius-md)' }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              {(!students || students.length === 0) && (
                <div className="glass-card" style={{ padding: 24, marginBottom: 24, color: 'var(--text-secondary)' }}>
                  <h3>Debug Info (Please send this back to me):</h3>
                  <pre style={{ overflowX: 'auto', fontSize: '0.8rem', background: '#000', padding: 12 }}>
                    {JSON.stringify(students, null, 2) === '[]' ? 'Array is empty []' : JSON.stringify(students, null, 2)}
                  </pre>
                </div>
              )}
              <StudentTable
                students={students}
                activeFilter={activeFilter}
              onStatusChange={handleStatusChange}
              onFinancialsClick={handleFinancialsClick}
              onRefresh={handleRefresh}
            />
            </>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddStudent}
        />
      )}

      {/* Financials Modal */}
      {showFinancialsModal && selectedStudent && (
        <FinancialsModal
          student={selectedStudent}
          onClose={() => {
            setShowFinancialsModal(false);
            setSelectedStudent(null);
          }}
          onSuccess={handleFinancialsSave}
        />
      )}
    </>
  );
}

export default function ProcessingPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="loading-spinner"
          style={{
            width: 40,
            height: 40,
            borderWidth: 3,
            color: 'var(--accent-primary)',
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ToastProvider>
      <Navbar />
      <ProcessingContent />
    </ToastProvider>
  );
}
