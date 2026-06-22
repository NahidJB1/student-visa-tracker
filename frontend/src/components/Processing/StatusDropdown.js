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

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === student.processing_status) return;

    setLoading(true);
    try {
      await api.updateStudentStatus(student._id || student.id, newStatus);
      onStatusChange?.(student._id || student.id, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="status-select-wrapper">
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
    </div>
  );
}
