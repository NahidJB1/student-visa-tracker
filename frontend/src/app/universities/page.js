'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { ToastProvider, useToast } from '@/components/Toast';

function UniversitiesPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [programs, setPrograms] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeLevel, setActiveLevel] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setPrograms([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const data = await api.searchUniversities(query);
      setPrograms(data.programs || []);
      setActiveLevel(''); // Reset filter on new search
      setVisibleCount(10); // Reset pagination on new search
    } catch (err) {
      addToast('Failed to load universities', 'error');
    } finally {
      setIsSearching(false);
    }
  }, [addToast]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  if (loading || !user) return <div className="page-container"><div className="skeleton skeleton-chart" /></div>;

  // Derive filters from current search results
  const availableLevels = Array.from(new Set(programs.map(p => p.level))).sort();
  
  // Apply filter
  const filteredPrograms = activeLevel 
    ? programs.filter(p => p.level === activeLevel) 
    : programs;

  // Apply pagination
  const visiblePrograms = filteredPrograms.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPrograms.length;

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      <div className="processing-header">
        <div>
          <h1 className="page-title">Universities & Programs</h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Search across 480+ programs to find the perfect fit</p>
        </div>
      </div>

      <div className="search-container" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <div className="form-group" style={{ position: 'relative', margin: 0 }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px', fontSize: '1.1rem', padding: '16px 16px 16px 48px', borderRadius: '100px' }}
            placeholder="Search by subject, university name, or level (e.g. IT, SEGi, Diploma)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg 
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>

      {!isSearching && programs.length > 10 && availableLevels.length > 1 && (
        <div className="filter-scroll" style={{ marginBottom: '32px' }}>
          <button
            className={`filter-chip ${activeLevel === '' ? 'active' : ''}`}
            onClick={() => { setActiveLevel(''); setVisibleCount(10); }}
          >
            All Levels
          </button>
          {availableLevels.map((level) => (
            <button
              key={level}
              className={`filter-chip ${activeLevel === level ? 'active' : ''}`}
              onClick={() => { setActiveLevel(level); setVisibleCount(10); }}
            >
              {level}
            </button>
          ))}
        </div>
      )}

      {isSearching ? (
        <div className="skeleton skeleton-chart" />
      ) : programs.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          {searchQuery.trim() ? (
            <>
              <h3>No programs found</h3>
              <p>Try using different keywords or check spelling.</p>
            </>
          ) : (
            <>
              <h3>Search for Programs</h3>
              <p>Type a subject, university name, or level (e.g. IT, SEGi, Diploma) to begin.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="notes-grid">
            {visiblePrograms.map(prog => (
              <div key={prog.id} className="glass-card glass-card-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span className="status-badge" data-status="Visa Approved" style={{ marginBottom: '8px', display: 'inline-block' }}>
                    {prog.level}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {prog.name}
                  </h3>
                </div>
                
                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                    <span style={{ fontWeight: 500 }}>{prog.university}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>{prog.duration}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      <span style={{ fontWeight: 600 }}>{prog.fees}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
              <button 
                className="secondary-button" 
                onClick={() => setVisibleCount(prev => prev + 10)}
                style={{ padding: '12px 32px', fontSize: '1rem', borderRadius: '100px' }}
              >
                Show 10 more results
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Navbar />
      <ToastProvider>
        <UniversitiesPanel />
      </ToastProvider>
    </>
  );
}
