'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ActionMenu({ onFinancials, onUpdateStatus }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    function handleScroll() {
      if (open) setOpen(false);
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, { passive: true });
      const tableContainer = document.querySelector('.student-table-container');
      if (tableContainer) {
        tableContainer.addEventListener('scroll', handleScroll, { passive: true });
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
      const tableContainer = document.querySelector('.student-table-container');
      if (tableContainer) {
        tableContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [open]);

  const handleItemClick = (callback) => (e) => {
    e.stopPropagation();
    setOpen(false);
    callback?.();
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!open) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="action-menu-container">
      <button
        ref={triggerRef}
        className="action-menu-trigger"
        onClick={toggleMenu}
        aria-label="Actions"
      >
        ⋮
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div 
          className="action-menu-dropdown" 
          ref={menuRef}
          style={{ 
            position: 'fixed', 
            top: coords.top, 
            right: coords.right, 
            zIndex: 9999, 
            margin: 0 
          }}
        >
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
        </div>,
        document.body
      )}
    </div>
  );
}
