import { useState } from 'react';

export default function PasswordInput({ value, onChange, placeholder = '••••••••', required = false, label, className = 'form-input', containerStyle = {} }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="form-group" style={{ position: 'relative', marginBottom: '16px', ...containerStyle }}>
      {label && <label className="form-label">{label}</label>}
      <input
        type={showPassword ? 'text' : 'password'}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        style={{ paddingRight: '40px' }}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={{
          position: 'absolute',
          right: '12px',
          top: label ? '38px' : '12px',
          background: 'none',
          border: 'none',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center'
        }}
        tabIndex="-1"
      >
        {showPassword ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        )}
      </button>
    </div>
  );
}
