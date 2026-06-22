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
  });
  
  const [extraIncomes, setExtraIncomes] = useState([]);
  const [isEditing, setIsEditing] = useState(true);
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
          });
          
          let parsedExtras = [];
          if (typeof f.extra_incomes === 'string') {
            try { parsedExtras = JSON.parse(f.extra_incomes); } catch (e) {}
          } else if (Array.isArray(f.extra_incomes)) {
            parsedExtras = f.extra_incomes;
          }
          
          // Migrate old single extra income if it exists and array is empty
          if (parsedExtras.length === 0 && f.extra_income_amount > 0) {
            parsedExtras.push({
              amount: f.extra_income_amount,
              remark: f.extra_income_remark || ''
            });
          }
          
          setExtraIncomes(parsedExtras);

          // If there's base data, start in read-only mode
          if (f.amount_from_student > 0 || f.referrer_name) {
            setIsEditing(false);
          }
        }
      } catch (err) {
        // No existing financials
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

  const handleExtraIncomeChange = (index, field, value) => {
    setExtraIncomes(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addExtraIncome = () => {
    setExtraIncomes(prev => [...prev, { amount: '', remark: '' }]);
    setIsEditing(true); // Switch to edit mode if they want to add
  };

  const removeExtraIncome = (index) => {
    setExtraIncomes(prev => prev.filter((_, i) => i !== index));
  };

  const earningsPreview = useMemo(() => {
    const agentComm = parseFloat(form.agent_commission) || 0;
    const uniPayment = parseFloat(form.university_payment) || 0;
    const fromStudent = parseFloat(form.amount_from_student) || 0;
    
    const totalExtra = extraIncomes.reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0);
    
    return (fromStudent - (agentComm + uniPayment)) + totalExtra;
  }, [form, extraIncomes]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setApiError('');
    try {
      const payload = {
        referrer_name: form.referrer_name,
        agent_commission: parseFloat(form.agent_commission) || 0,
        university_payment: parseFloat(form.university_payment) || 0,
        amount_from_student: parseFloat(form.amount_from_student) || 0,
        extra_incomes: extraIncomes.map(inc => ({
          amount: parseFloat(inc.amount) || 0,
          remark: inc.remark || ''
        })),
      };
      await api.updateFinancials(student._id || student.id, payload);
      onSuccess?.();
      setIsEditing(false);
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
      <div className="modal-content" style={{ maxWidth: 640 }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0 }}>Financials — {student.name}</h2>
            {!isEditing && !loading && (
              <button 
                onClick={() => setIsEditing(true)}
                className="btn-icon" 
                title="Edit Financials"
                style={{ width: 28, height: 28, fontSize: '0.9rem' }}
              >
                ✏️
              </button>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 48, borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="modal-body" style={{ paddingTop: 0 }}>
            {apiError && (
              <div className="login-error" style={{ marginBottom: 16 }}>
                {apiError}
              </div>
            )}

            {!isEditing ? (
              /* READ-ONLY VIEW */
              <div className="read-only-details" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="glass-card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>Base Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Referrer Name</div>
                      <div style={{ fontWeight: 500 }}>{form.referrer_name || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Amount from Student</div>
                      <div style={{ fontWeight: 500 }}>{formatCurrency(form.amount_from_student)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Agent Commission</div>
                      <div style={{ fontWeight: 500 }}>{formatCurrency(form.agent_commission)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>University Payment</div>
                      <div style={{ fontWeight: 500 }}>{formatCurrency(form.university_payment)}</div>
                    </div>
                  </div>
                </div>

                {extraIncomes.length > 0 && (
                  <div className="glass-card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>Extra Incomes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {extraIncomes.map((inc, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < extraIncomes.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: i < extraIncomes.length - 1 ? 12 : 0 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--success)' }}>+{formatCurrency(inc.amount)}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{inc.remark || 'No remark'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={addExtraIncome}
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                >
                  <span style={{ fontSize: '1.2rem', lineHeight: 0.5, marginRight: 6 }}>+</span> Add extra income
                </button>
              </div>
            ) : (
              /* EDIT VIEW */
              <form onSubmit={handleSubmit}>
                <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 16 }}>Base Details</h3>
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

                  <div className="form-group" style={{ marginBottom: 0 }}>
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
                </div>

                <div className="glass-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', margin: 0 }}>Extra Incomes</h3>
                    <button 
                      type="button" 
                      className="btn-secondary btn-sm" 
                      onClick={addExtraIncome}
                    >
                      + Add
                    </button>
                  </div>
                  
                  {extraIncomes.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                      No extra income entries.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {extraIncomes.map((inc, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--bg-primary)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Amount ($)</label>
                              <input
                                type="number"
                                className="input-field"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                value={inc.amount}
                                onChange={(e) => handleExtraIncomeChange(i, 'amount', e.target.value)}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Remark</label>
                              <input
                                className="input-field"
                                placeholder="E.g., Second installment"
                                value={inc.remark}
                                onChange={(e) => handleExtraIncomeChange(i, 'remark', e.target.value)}
                              />
                            </div>
                          </div>
                          <button 
                            type="button" 
                            className="btn-icon" 
                            onClick={() => removeExtraIncome(i)}
                            title="Remove"
                            style={{ color: 'var(--error)', marginTop: 22 }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* Global Earnings Preview */}
            <div className="earnings-preview" style={{ marginTop: 24, padding: 20, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div className="earnings-preview-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Net Earnings</div>
              <div
                className="earnings-preview-value"
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: earningsPreview >= 0 ? 'var(--success)' : 'var(--error)',
                }}
              >
                {formatCurrency(earningsPreview)}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                marginTop: 4,
              }}>
                (Student Amount − (Commission + Uni Payment)) + Total Extra Incomes
              </div>
            </div>

          </div>
        )}

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 0 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            {isEditing ? 'Cancel' : 'Close'}
          </button>
          {isEditing && (
            <button type="button" className="btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <span className="loading-spinner" />
                  Saving...
                </>
              ) : (
                'Save Financials'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
