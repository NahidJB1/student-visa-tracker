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

  const [students, setStudents] = useState([]);
  const [activeFilter, setActiveFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFinancialsModal, setShowFinancialsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getStudents(activeFilter || null);
      setStudents(data.students || data || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      addToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, addToast]);

  useEffect(() => {
    fetchStudents();
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

  return (
    <>
      <div className="page-container">
        {/* Header */}
        <div className="processing-header animate-slide-up">
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1 className="page-title">Processing</h1>
            <p className="page-subtitle">Manage student visa applications</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span>
            Add Student
          </button>
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
            <StudentTable
              students={students}
              activeFilter={activeFilter}
              onStatusChange={handleStatusChange}
              onFinancialsClick={handleFinancialsClick}
              onRefresh={handleRefresh}
            />
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
