'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { ToastProvider, useToast } from '@/components/Toast';

const COLORS = [
  { id: 'default', color: 'var(--surface)' },
  { id: 'red', color: 'var(--error-bg)' },
  { id: 'orange', color: 'var(--warning-bg)' },
  { id: 'yellow', color: 'rgba(253, 203, 110, 0.15)' },
  { id: 'green', color: 'var(--success-bg)' },
  { id: 'teal', color: 'rgba(0, 206, 201, 0.15)' },
  { id: 'blue', color: 'var(--info-bg)' },
  { id: 'purple', color: 'rgba(108, 92, 231, 0.15)' },
  { id: 'pink', color: 'rgba(232, 67, 147, 0.15)' },
];

function NotesPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [notes, setNotes] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', color: 'default', is_pinned: false });
  const [activeNote, setActiveNote] = useState(null); // For editing
  
  const createRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchNotes();
      
      const intervalId = setInterval(() => fetchNotes(true), 30000);
      const handleFocus = () => fetchNotes(true);
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(intervalId);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [user]);

  // Click outside to save new note
  useEffect(() => {
    function handleClickOutside(event) {
      if (createRef.current && !createRef.current.contains(event.target)) {
        if (isCreating) {
          saveNewNote();
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCreating, newNote]);

  const fetchNotes = async (silent = false) => {
    try {
      const data = await api.getNotes();
      setNotes(data.notes || []);
    } catch (err) {
      if (!silent) addToast('Failed to load notes', 'error');
    }
  };

  const saveNewNote = async () => {
    if (!newNote.title.trim() && !newNote.content.trim()) {
      setIsCreating(false);
      setNewNote({ title: '', content: '', color: 'default', is_pinned: false });
      return;
    }
    
    try {
      const data = await api.createNote(newNote);
      setNotes([data.note, ...notes]);
      addToast('Note saved', 'success');
    } catch (err) {
      addToast('Failed to save note', 'error');
    } finally {
      setIsCreating(false);
      setNewNote({ title: '', content: '', color: 'default', is_pinned: false });
    }
  };

  const saveEditNote = async () => {
    if (!activeNote) return;
    
    try {
      const data = await api.updateNote(activeNote.id, activeNote);
      setNotes(notes.map(n => n.id === activeNote.id ? data.note : n));
    } catch (err) {
      addToast('Failed to update note', 'error');
    } finally {
      setActiveNote(null);
    }
  };

  const deleteNote = async (id, e) => {
    e.stopPropagation(); // prevent opening modal
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.deleteNote(id);
      setNotes(notes.filter(n => n.id !== id));
      addToast('Note deleted', 'success');
      if (activeNote && activeNote.id === id) setActiveNote(null);
    } catch (err) {
      addToast('Failed to delete note', 'error');
    }
  };

  if (loading || !user) return <div className="page-container"><div className="skeleton skeleton-chart" /></div>;

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      <div className="processing-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">My Notes</h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Private workspace for your thoughts and reminders</p>
        </div>
      </div>

      {/* Note Creator */}
      <div className="note-creator-wrapper">
        <div 
          className={`note-creator glass-card ${isCreating ? 'active' : ''}`} 
          ref={createRef}
          onClick={() => !isCreating && setIsCreating(true)}
          style={{ background: COLORS.find(c => c.id === newNote.color)?.color }}
        >
          {isCreating && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <input
                  type="text"
                  placeholder="Title"
                  className="note-input note-title-input"
                  value={newNote.title}
                  onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                  autoFocus
                  style={{ flex: 1 }}
                />
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setNewNote({ ...newNote, is_pinned: !newNote.is_pinned }); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: newNote.is_pinned ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
                  title={newNote.is_pinned ? 'Unpin' : 'Pin'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={newNote.is_pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  </svg>
                </button>
              </div>
          )}
          <textarea
            placeholder="Take a note..."
            className="note-input note-content-input"
            value={newNote.content}
            onChange={e => {
              setNewNote({ ...newNote, content: e.target.value });
              e.target.style.height = 'auto';
              e.target.style.height = (e.target.scrollHeight) + 'px';
            }}
            rows={isCreating ? 3 : 1}
          />
          {isCreating && (
            <div className="note-creator-footer">
              <div className="color-picker">
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`color-btn ${newNote.color === c.id ? 'selected' : ''}`}
                    style={{ background: c.color }}
                    onClick={(e) => { e.stopPropagation(); setNewNote({ ...newNote, color: c.id }); }}
                  />
                ))}
              </div>
              <button className="primary-button" onClick={(e) => { e.stopPropagation(); saveNewNote(); }}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {notes.filter(n => n.is_pinned).length > 0 && (
        <>
          <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '16px', marginTop: '32px' }}>Pinned</h3>
          <div className="notes-grid">
            {notes.filter(n => n.is_pinned).map(note => (
              <div 
                key={note.id} 
                className="note-card glass-card-hover animate-scale-in"
                style={{ background: COLORS.find(c => c.id === note.color)?.color || 'var(--surface)' }}
                onClick={() => setActiveNote(note)}
              >
                {note.title && <h3 className="note-title">{note.title}</h3>}
                <div className="note-content">{note.content}</div>
                
                <button className="note-delete-btn" onClick={(e) => {
                  e.stopPropagation();
                  api.updateNote(note.id, { ...note, is_pinned: !note.is_pinned }).then(res => {
                    setNotes(notes.map(n => n.id === note.id ? res.note : n));
                  });
                }} style={{ right: '40px', color: note.is_pinned ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={note.is_pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  </svg>
                </button>
                <button className="note-delete-btn" onClick={(e) => deleteNote(note.id, e)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '16px', marginTop: '32px' }}>Others</h3>
        </>
      )}

      <div className="notes-grid">
        {notes.filter(n => !n.is_pinned).map(note => (
          <div 
            key={note.id} 
            className="note-card glass-card-hover animate-scale-in"
            style={{ background: COLORS.find(c => c.id === note.color)?.color || 'var(--surface)' }}
            onClick={() => setActiveNote(note)}
          >
            {note.title && <h3 className="note-title">{note.title}</h3>}
            <div className="note-content">{note.content}</div>
            
            <button className="note-delete-btn" onClick={(e) => deleteNote(note.id, e)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {activeNote && (
        <div className="modal-overlay" onClick={saveEditNote}>
          <div 
            className="modal-content animate-scale-in note-modal" 
            onClick={e => e.stopPropagation()}
            style={{ background: COLORS.find(c => c.id === activeNote.color)?.color || 'var(--surface)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <input
                type="text"
                placeholder="Title"
                className="note-input note-title-input"
                value={activeNote.title}
                onChange={e => setActiveNote({ ...activeNote, title: e.target.value })}
                style={{ flex: 1 }}
              />
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setActiveNote({ ...activeNote, is_pinned: !activeNote.is_pinned }); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: activeNote.is_pinned ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
                title={activeNote.is_pinned ? 'Unpin' : 'Pin'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={activeNote.is_pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>
            </div>
            <textarea
              placeholder="Take a note..."
              className="note-input note-content-input"
              value={activeNote.content}
              onChange={e => setActiveNote({ ...activeNote, content: e.target.value })}
              rows={8}
            />
            <div className="note-creator-footer" style={{ marginTop: '16px' }}>
              <div className="color-picker">
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`color-btn ${activeNote.color === c.id ? 'selected' : ''}`}
                    style={{ background: c.color }}
                    onClick={() => setActiveNote({ ...activeNote, color: c.id })}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="secondary-button" onClick={(e) => deleteNote(activeNote.id, e)} style={{ color: 'var(--error)' }}>
                  Delete
                </button>
                <button className="primary-button" onClick={saveEditNote}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Navbar />
      <ToastProvider>
        <NotesPanel />
      </ToastProvider>
    </>
  );
}
