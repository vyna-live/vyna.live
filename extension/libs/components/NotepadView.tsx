import React, { useState, useEffect } from 'react';
import { getNotes, createNote, updateNote, deleteNote } from '@libs/utils/api';

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const NotepadView: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notes from API
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedNotes = await getNotes();
        setNotes(loadedNotes);
        
        // Select the first note if available
        if (loadedNotes.length > 0 && !selectedNoteId) {
          setSelectedNoteId(loadedNotes[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load notes:', err);
        setError('Failed to load notes. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNotes();
  }, []);

  // Get the selected note
  const selectedNote = notes.find(note => note.id === selectedNoteId) || null;

  // Handle note selection
  const handleSelectNote = (noteId: number) => {
    if (isEditing) {
      if (!window.confirm('You have unsaved changes. Discard changes?')) {
        return;
      }
    }
    
    setSelectedNoteId(noteId);
    setIsEditing(false);
  };

  // Start editing a note
  const handleStartEditing = () => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setIsEditing(true);
    }
  };

  // Save edited note
  const handleSaveNote = async () => {
    if (!selectedNoteId || !editTitle.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedNote = await updateNote(selectedNoteId, {
        title: editTitle,
        content: editContent
      });
      
      // Update notes array
      setNotes(notes.map(note => 
        note.id === selectedNoteId ? updatedNote : note
      ));
      
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to save note:', err);
      setError('Failed to save note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new note
  const handleCreateNote = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newNote = await createNote('New Note', '');
      setNotes([newNote, ...notes]);
      setSelectedNoteId(newNote.id);
      
      // Start editing the new note
      setEditTitle(newNote.title);
      setEditContent(newNote.content);
      setIsEditing(true);
    } catch (err: any) {
      console.error('Failed to create note:', err);
      setError('Failed to create note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a note
  const handleDeleteNote = async () => {
    if (!selectedNoteId) return;
    
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await deleteNote(selectedNoteId);
      
      // Remove note from array
      const updatedNotes = notes.filter(note => note.id !== selectedNoteId);
      setNotes(updatedNotes);
      
      // Select the first note if available
      if (updatedNotes.length > 0) {
        setSelectedNoteId(updatedNotes[0].id);
      } else {
        setSelectedNoteId(null);
      }
      
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to delete note:', err);
      setError('Failed to delete note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  return (
    <div className="notepad-view">
      <div className="notepad-sidebar">
        <button 
          className="new-note-button"
          onClick={handleCreateNote}
          disabled={isLoading}
        >
          New Note
        </button>
        
        <div className="note-list">
          {notes.map(note => (
            <div 
              key={note.id}
              className={`note-item ${note.id === selectedNoteId ? 'active' : ''}`}
              onClick={() => handleSelectNote(note.id)}
            >
              <div className="note-title">{note.title}</div>
              <div className="note-date">
                {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
          
          {notes.length === 0 && !isLoading && (
            <div className="no-notes-message">
              No notes yet. Create a new note to get started.
            </div>
          )}
        </div>
      </div>
      
      <div className="notepad-main">
        {error && <div className="error-message">{error}</div>}
        
        {isLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <div>Loading...</div>
          </div>
        ) : selectedNote ? (
          isEditing ? (
            <div className="note-editor">
              <input
                type="text"
                className="note-title-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Note Title"
              />
              <textarea
                className="note-content-input"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Write your note here..."
              />
              <div className="editor-actions">
                <button 
                  className="save-button"
                  onClick={handleSaveNote}
                  disabled={!editTitle.trim()}
                >
                  Save
                </button>
                <button 
                  className="cancel-button"
                  onClick={handleCancelEditing}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="note-viewer">
              <div className="note-header">
                <h2 className="note-title">{selectedNote.title}</h2>
                <div className="note-actions">
                  <button 
                    className="edit-button"
                    onClick={handleStartEditing}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={handleDeleteNote}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="note-content">
                {selectedNote.content ? (
                  <div className="content-text">{selectedNote.content}</div>
                ) : (
                  <div className="empty-content">This note is empty. Click Edit to add content.</div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="no-note-selected">
            <p>Select a note or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotepadView;
