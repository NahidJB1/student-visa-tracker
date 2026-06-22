'use client';

import { useState, useCallback } from 'react';
import StatusDropdown from './StatusDropdown';
import ActionMenu from './ActionMenu';

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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(value) {
  if (value == null || isNaN(value)) return '$0.00';
  return '$' + Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function StudentTable({
  students,
  activeFilter,
  onStatusChange,
  onFinancialsClick,
  onRefresh,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [showStatusId, setShowStatusId] = useState(null);
  const [exitingIds, setExitingIds] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  const toggleExpand = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleEmgsTracker = useCallback(async (e, student) => {
    e.stopPropagation();
    const studentId = student._id || student.id;
    try {
      await navigator.clipboard.writeText(student.passport_number);
      setCopiedId(studentId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard may fail silently
    }
    window.open(
      'https://visa.educationmalaysia.gov.my/emgs/application/searchForm/?___SID=S',
      '_blank',
      'noopener,noreferrer'
    );
  }, []);

  const handleStatusChange = useCallback(
    (studentId, newStatus) => {
      if (activeFilter && newStatus !== activeFilter) {
        // Animate the row out, then refresh
        setExitingIds((prev) => new Set(prev).add(studentId));
        setTimeout(() => {
          setExitingIds((prev) => {
            const next = new Set(prev);
            next.delete(studentId);
            return next;
          });
          onRefresh?.();
        }, 420);
      }
      onStatusChange?.(studentId, newStatus);
    },
    [activeFilter, onStatusChange, onRefresh]
  );

  if (!students || students.length === 0) {
    return (
      <div className="glass-card">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No students found</div>
          <div className="empty-state-subtitle">
            {activeFilter
              ? `No students with status "${activeFilter}". Try a different filter or add a new student.`
              : 'Get started by adding your first student.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card student-table-container animate-fade-in">
      <table className="student-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Passport</th>
            <th>Institute</th>
            <th>Status</th>
            <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const id = student._id || student.id;
            const isExpanded = expandedId === id;
            const isExiting = exitingIds.has(id);
            const showStatus = showStatusId === id;
            // Financial fields come flat from the API join
            const hasFinancials = student.financial_id != null;
            const fin = hasFinancials ? {
              referrer_name: student.referrer_name,
              agent_commission: student.agent_commission,
              university_payment: student.university_payment,
              amount_from_student: student.amount_from_student,
              extra_income_amount: student.extra_income_amount,
              extra_income_remark: student.extra_income_remark,
            } : null;

            let earnings = null;
            if (fin) {
              const fromStudent = parseFloat(fin.amount_from_student) || 0;
              const agentComm = parseFloat(fin.agent_commission) || 0;
              const uniPayment = parseFloat(fin.university_payment) || 0;
              const extraIncome = parseFloat(fin.extra_income_amount) || 0;
              earnings = (fromStudent - (agentComm + uniPayment)) + extraIncome;
            }

            return (
              <tr
                key={id}
                style={{ display: 'contents' }}
              >
                {/* Main row */}
                <td
                  colSpan={5}
                  style={{ padding: 0, border: 'none' }}
                >
                  <div
                    className={`${isExiting ? 'animate-row-exit' : ''}`}
                  >
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                      <tbody>
                        <tr
                          className={isExpanded ? 'student-row-expanded' : ''}
                          onClick={() => toggleExpand(id)}
                        >
                          <td>
                            <div className="student-name-cell">
                              <div className="student-avatar">
                                {getInitials(student.name)}
                              </div>
                              <span style={{ fontWeight: 500 }}>{student.name}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {student.passport_number}
                            </span>
                          </td>
                          <td>{student.institute_name || '—'}</td>
                          <td>
                            {showStatus ? (
                              <StatusDropdown
                                student={student}
                                onStatusChange={(sid, newStatus) => {
                                  setShowStatusId(null);
                                  handleStatusChange(sid, newStatus);
                                }}
                              />
                            ) : (
                              <span
                                className="status-badge"
                                data-status={student.processing_status}
                              >
                                {student.processing_status}
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <button
                                className="emgs-tracker-btn"
                                onClick={(e) => handleEmgsTracker(e, student)}
                                title="Copy passport & open EMGS tracker"
                              >
                                🔍
                                {copiedId === id && (
                                  <span style={{ fontSize: '0.7rem' }}>Copied!</span>
                                )}
                              </button>
                              <ActionMenu
                                onFinancials={() => onFinancialsClick?.(student)}
                                onUpdateStatus={() =>
                                  setShowStatusId((prev) => (prev === id ? null : id))
                                }
                              />
                            </div>
                          </td>
                        </tr>

                        {/* Expanded content */}
                        {isExpanded && (
                          <tr className="student-row-expanded">
                            <td colSpan={5} style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>
                              <div className="student-expand-content">
                                <div className="student-expand-inner">
                                  <div className="student-expand-item">
                                    <span className="student-expand-label">Course / Program</span>
                                    <span className="student-expand-value">
                                      {student.course_program || '—'}
                                    </span>
                                  </div>
                                  <div className="student-expand-item">
                                    <span className="student-expand-label">Created</span>
                                    <span className="student-expand-value">
                                      {formatDate(student.created_at || student.createdAt)}
                                    </span>
                                  </div>
                                  <div className="student-expand-item">
                                    <span className="student-expand-label">Updated</span>
                                    <span className="student-expand-value">
                                      {formatDate(student.updated_at || student.updatedAt)}
                                    </span>
                                  </div>
                                  {fin && (
                                    <>
                                      {fin.referrer_name && (
                                        <div className="student-expand-item">
                                          <span className="student-expand-label">Referrer / Agent</span>
                                          <span className="student-expand-value">
                                            {fin.referrer_name}
                                          </span>
                                        </div>
                                      )}
                                      <div className="student-expand-item">
                                        <span className="student-expand-label">Earnings</span>
                                        <span
                                          className="student-expand-value"
                                          style={{
                                            color: earnings >= 0 ? 'var(--success)' : 'var(--error)',
                                            fontWeight: 700,
                                          }}
                                        >
                                          {formatCurrency(earnings)}
                                        </span>
                                      </div>
                                      <div className="student-expand-item">
                                        <span className="student-expand-label">Breakdown</span>
                                        <span
                                          className="student-expand-value"
                                          style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                                        >
                                          Student: {formatCurrency(fin.amount_from_student)} − (Comm: {formatCurrency(fin.agent_commission)} + Uni: {formatCurrency(fin.university_payment)}) + Extra: {formatCurrency(fin.extra_income_amount)}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  {!fin && (
                                    <div className="student-expand-item">
                                      <span className="student-expand-label">Financials</span>
                                      <span
                                        className="student-expand-value"
                                        style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}
                                      >
                                        No financial data yet
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Passport copied toast */}
      {copiedId && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-secondary)',
            border: '1px solid rgba(116, 185, 255, 0.3)',
            color: 'var(--info)',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            animation: 'slideUp var(--transition-normal) ease forwards',
          }}
        >
          📋 Passport copied!
        </div>
      )}
    </div>
  );
}
