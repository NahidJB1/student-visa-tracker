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

    let remark = undefined;
    if (newStatus === 'EMGS Hold') {
      const input = window.prompt("EMGS Hold Reason (Optional):");
      if (input === null) {
        // User cancelled the prompt, revert the dropdown
        e.target.value = student.processing_status;
        return;
      }
      remark = input.trim();
    }

    setLoading(true);
    try {
      await api.updateStudentStatus(student._id || student.id, newStatus, remark);
      // Let the parent component know so it can refresh the data
      onStatusChange?.(student._id || student.id, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
      e.target.value = student.processing_status;
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
