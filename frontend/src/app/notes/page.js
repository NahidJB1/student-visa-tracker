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
  const [newNote, setNewNote] = useState({ title: '', content: '', color: 'default' });
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

  const fetchNotes = async () => {
    try {
      const data = await api.getNotes();
      setNotes(data.notes || []);
    } catch (err) {
      addToast('Failed to load notes', 'error');
    }
  };

  const saveNewNote = async () => {
    if (!newNote.title.trim() && !newNote.content.trim()) {
      setIsCreating(false);
      setNewNote({ title: '', content: '', color: 'default' });
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
      setNewNote({ title: '', content: '', color: 'default' });
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
            <input
              type="text"
              placeholder="Title"
              className="note-input note-title-input"
              value={newNote.title}
              onChange={e => setNewNote({ ...newNote, title: e.target.value })}
              autoFocus
            />
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

      {/* Masonry Grid */}
      <div className="notes-grid">
        {notes.map(note => (
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
            <input
              type="text"
              placeholder="Title"
              className="note-input note-title-input"
              value={activeNote.title}
              onChange={e => setActiveNote({ ...activeNote, title: e.target.value })}
            />
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
