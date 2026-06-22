'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';

function formatCurrency(value) {
  if (value == null || isNaN(value)) return '$0.00';
  return '$' + Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function FinancialsModal({ student, onClose, onSuccess }) {
  const [form, setForm] = useState({
    referrer_name: '',
    agent_commission: '',
    university_payment: '',
    amount_from_student: '',
    extra_income_amount: '',
    extra_income_remark: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchFinancials() {
      setLoading(true);
      try {
        const result = await api.getFinancials(student._id || student.id);
        if (!cancelled && result.financial) {
          const f = result.financial;
          setForm({
            referrer_name: f.referrer_name || '',
            agent_commission: f.agent_commission ?? '',
            university_payment: f.university_payment ?? '',
            amount_from_student: f.amount_from_student ?? '',
            extra_income_amount: f.extra_income_amount ?? '',
            extra_income_remark: f.extra_income_remark || '',
          });
        }
      } catch (err) {
        // No existing financials, leave form empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchFinancials();
    return () => { cancelled = true; };
  }, [student]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setApiError('');
  };

  const earningsPreview = useMemo(() => {
    const agentComm = parseFloat(form.agent_commission) || 0;
    const uniPayment = parseFloat(form.university_payment) || 0;
    const fromStudent = parseFloat(form.amount_from_student) || 0;
    const extraIncome = parseFloat(form.extra_income_amount) || 0;
    return (fromStudent - (agentComm + uniPayment)) + extraIncome;
  }, [form.agent_commission, form.university_payment, form.amount_from_student, form.extra_income_amount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError('');
    try {
      const payload = {
        referrer_name: form.referrer_name,
        agent_commission: parseFloat(form.agent_commission) || 0,
        university_payment: parseFloat(form.university_payment) || 0,
        amount_from_student: parseFloat(form.amount_from_student) || 0,
        extra_income_amount: parseFloat(form.extra_income_amount) || 0,
        extra_income_remark: form.extra_income_remark,
      };
      await api.updateFinancials(student._id || student.id, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to save financials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>Financials — {student.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton" style={{ height: 48, borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {apiError && (
                <div className="login-error" style={{ marginBottom: 16 }}>
                  {apiError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Referrer Name</label>
                <input
                  className="input-field"
                  placeholder="Agent / Referrer"
                  value={form.referrer_name}
                  onChange={handleChange('referrer_name')}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Agent Commission ($)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.agent_commission}
                    onChange={handleChange('agent_commission')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">University Payment ($)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.university_payment}
                    onChange={handleChange('university_payment')}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount from Student ($)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.amount_from_student}
                    onChange={handleChange('amount_from_student')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Extra Income Amount ($)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.extra_income_amount}
                    onChange={handleChange('extra_income_amount')}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Extra Income Remark</label>
                <input
                  className="input-field"
                  placeholder="Optional note"
                  value={form.extra_income_remark}
                  onChange={handleChange('extra_income_remark')}
                />
              </div>

              <div className="earnings-preview">
                <div className="earnings-preview-label">Calculated Earnings</div>
                <div
                  className="earnings-preview-value"
                  style={{
                    color: earningsPreview >= 0 ? 'var(--success)' : 'var(--error)',
                  }}
                >
                  {formatCurrency(earningsPreview)}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-tertiary)',
                  marginTop: 4,
                }}>
                  (Student Amount − (Commission + Uni Payment)) + Extra Income
                </div>
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
                    Saving...
                  </>
                ) : (
                  'Save Financials'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
