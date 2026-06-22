'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { ToastProvider, useToast } from '@/components/Toast';
import StudentTable from '@/components/Processing/StudentTable';
import FinancialsModal from '@/components/Processing/FinancialsModal';
import { api } from '@/lib/api';

const ARCHIVED_STATUSES = ['Visa Rejected', 'Flight done'];

function ArchivedContent() {
  const { addToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [activeFilter, setActiveFilter] = useState('');
  const [showFinancialsModal, setShowFinancialsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getStudents({ status: activeFilter || null, archived: true });
      setStudents(data.students || data || []);
    } catch (err) {
      console.error('Failed to fetch archived students:', err);
      addToast('Failed to load archived students', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, addToast]);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [fetchStudents, user]);

  const handleStatusChange = useCallback(
    (studentId, newStatus) => {
      // If the new status is no longer an archived status, remove it from this view
      if (!ARCHIVED_STATUSES.includes(newStatus)) {
        setStudents((prev) => prev.filter((s) => (s._id || s.id) !== studentId));
        addToast('Student unarchived successfully', 'success');
      } else {
        setStudents((prev) =>
          prev.map((s) => {
            if ((s._id || s.id) === studentId) {
              return { ...s, processing_status: newStatus };
            }
            return s;
          })
        );
        addToast('Status updated', 'success');
      }
    },
    [addToast]
  );

  const handleDelete = useCallback(
    async (studentId) => {
      try {
        await api.deleteStudent(studentId);
        setStudents((prev) => prev.filter((s) => (s._id || s.id) !== studentId));
        addToast('Student deleted permanently', 'success');
      } catch (err) {
        addToast('Failed to delete student', 'error');
      }
    },
    [addToast]
  );

  const handleFinancialsSave = useCallback(
    (studentId, updatedData) => {
      setStudents((prev) =>
        prev.map((s) => {
          if ((s._id || s.id) === studentId) {
            return {
              ...s,
              referrer_name: updatedData.referrer_name,
              agent_commission: updatedData.agent_commission,
              university_payment: updatedData.university_payment,
              amount_from_student: updatedData.amount_from_student,
              extra_income_amount: updatedData.extra_income_amount,
              extra_income_remark: updatedData.extra_income_remark,
              currency: updatedData.currency,
            };
          }
          return s;
        })
      );
      setShowFinancialsModal(false);
      addToast('Financials updated successfully', 'success');
    },
    [addToast]
  );

  if (authLoading || !user) {
    return <div className="page-container"><div className="skeleton skeleton-chart" /></div>;
  }

  return (
    <div className="page-container">
      <div className="processing-header">
        <div>
          <h1 className="page-title">Archived Applications</h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Students marked as Visa Rejected or Flight Done</p>
        </div>
      </div>

      <div className="filter-scroll" style={{ marginTop: '24px' }}>
        <button
          className={`filter-chip ${activeFilter === '' ? 'active' : ''}`}
          onClick={() => setActiveFilter('')}
        >
          All Archived
        </button>
        {ARCHIVED_STATUSES.map((status) => (
          <button
            key={status}
            className={`filter-chip ${activeFilter === status ? 'active' : ''}`}
            onClick={() => setActiveFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton skeleton-chart" style={{ marginTop: '24px' }} />
      ) : (
        <StudentTable
          students={students}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onFinancialsClick={(student) => {
            setSelectedStudent(student);
            setShowFinancialsModal(true);
          }}
        />
      )}

      {showFinancialsModal && selectedStudent && (
        <FinancialsModal
          student={selectedStudent}
          onClose={() => setShowFinancialsModal(false)}
          onSave={handleFinancialsSave}
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Navbar />
      <ToastProvider>
        <ArchivedContent />
      </ToastProvider>
    </>
  );
}
