'use client';

import { useState } from 'react';
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

export default function StatusDropdown({ student, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [remarkInput, setRemarkInput] = useState(student.emgs_hold_remark || '');

  const handleUpdate = async (newStatus, remark) => {
    setLoading(true);
    try {
      await api.updateStudentStatus(student._id || student.id, newStatus, remark);
      onStatusChange?.(student._id || student.id, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === student.processing_status) return;

    if (newStatus === 'EMGS Hold') {
      setRemarkInput(student.emgs_hold_remark || '');
      setShowModal(true);
    } else {
      await handleUpdate(newStatus, undefined);
    }
  };

  return (
    <>
      <div className="status-select-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <select
          className="status-select"
          value={student.processing_status}
          onChange={handleChange}
          disabled={loading}
          onClick={(e) => e.stopPropagation()}
        >
          {ALL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {student.processing_status === 'EMGS Hold' && (
          <button 
            className="btn-icon" 
            onClick={(e) => { e.stopPropagation(); setRemarkInput(student.emgs_hold_remark || ''); setShowModal(true); }}
            title="Edit Hold Reason"
            style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            ✏️
          </button>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); setShowModal(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>EMGS Hold Reason</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                Please provide a reason or remark for why this application is on hold (optional).
              </p>
              <textarea
                className="form-input"
                style={{ minHeight: '100px', resize: 'vertical' }}
                value={remarkInput}
                onChange={(e) => setRemarkInput(e.target.value)}
                placeholder="e.g., Missing documents, waiting for payment..."
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button className="secondary-button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button 
                  className="primary-button" 
                  onClick={async () => {
                    setShowModal(false);
                    await handleUpdate('EMGS Hold', remarkInput.trim());
                  }}
                >
                  Save Remark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
