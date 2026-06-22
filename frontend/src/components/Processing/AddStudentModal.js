'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function AddStudentModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    passport_number: '',
    institute_name: '',
    course_program: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Student name is required';
    if (!form.passport_number.trim()) errs.passport_number = 'Passport number is required';
    if (!form.institute_name.trim()) errs.institute_name = 'Institute name is required';
    if (!form.course_program.trim()) errs.course_program = 'Course/Program is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setApiError('');
    try {
      await api.addStudent(form);
      onSuccess?.();
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New Student</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {apiError && (
              <div className="login-error" style={{ marginBottom: 16 }}>
                {apiError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="student-name">Student Name</label>
              <input
                id="student-name"
                className="input-field"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange('name')}
                autoFocus
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="passport">Passport Number</label>
              <input
                id="passport"
                className="input-field"
                placeholder="A12345678"
                value={form.passport_number}
                onChange={handleChange('passport_number')}
              />
              {errors.passport_number && <span className="form-error">{errors.passport_number}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="institute">Institute Name</label>
              <input
                id="institute"
                className="input-field"
                placeholder="University of..."
                value={form.institute_name}
                onChange={handleChange('institute_name')}
              />
              {errors.institute_name && <span className="form-error">{errors.institute_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="course">Course / Program</label>
              <input
                id="course"
                className="input-field"
                placeholder="Bachelor of Computer Science"
                value={form.course_program}
                onChange={handleChange('course_program')}
              />
              {errors.course_program && <span className="form-error">{errors.course_program}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="loading-spinner" />
                  Adding...
                </>
              ) : (
                'Add Student'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
