'use client';

import { useState, useEffect, useRef } from 'react';

export default function ActionMenu({ onFinancials, onUpdateStatus }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleItemClick = (callback) => (e) => {
    e.stopPropagation();
    setOpen(false);
    callback?.();
  };

  return (
    <div className="action-menu-container" ref={menuRef}>
      <button
        className="action-menu-trigger"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        aria-label="Actions"
      >
        ⋮
      </button>

      {open && (
        <div className="action-menu-dropdown">
          <button
            className="action-menu-item"
            onClick={handleItemClick(onFinancials)}
          >
            <span className="menu-icon">💰</span>
            Financials & Agent
          </button>
          <button
            className="action-menu-item"
            onClick={handleItemClick(onUpdateStatus)}
          >
            <span className="menu-icon">🔄</span>
            Update Status
          </button>
        </div>
      )}
    </div>
  );
}
