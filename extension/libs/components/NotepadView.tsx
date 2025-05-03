import React, { useState, useEffect } from 'react';
import { getNotes, createNote, updateNote, deleteNote } from '@libs/utils/api';

interface NotepadViewProps {
  userId: number;
}

interface Note {
  id: number;
  title: string;
  content: string;
  updatedAt: string;
  createdAt: string;
}

const NotepadView: React.FC<NotepadViewProps> = ({ userId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isEdited, setIsEdited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);
  
  // Setup editors when a note is selected
  useEffect(() => {
    if (selectedNoteId) {
      const selectedNote = notes.find(note => note.id === selectedNoteId);
      if (selectedNote) {
        setEditedTitle(selectedNote.title);
        setEditedContent(selectedNote.content);
        setIsEdited(false);
      }
    } else {
      setEditedTitle('');
      setEditedContent('');
      setIsEdited(false);
    }
  }, [selectedNoteId, notes]);
  
  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const data = await getNotes();
      setNotes(data);
      
      // Set the most recent note as selected if there are any notes
      if (data.length > 0 && !selectedNoteId) {
        setSelectedNoteId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const createNewNote = async () => {
    try {
      setIsSaving(true);
      const newTitle = `New Note ${new Date().toLocaleDateString()}`;
      const newNote = await createNote(newTitle, '');
      setNotes([newNote, ...notes]);
      setSelectedNoteId(newNote.id);
    } catch (error) {
      console.error('Error creating new note:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const saveNote = async () => {
    if (!selectedNoteId || !isEdited) return;
    
    try {
      setIsSaving(true);
      const updatedNote = await updateNote(selectedNoteId, {
        title: editedTitle,
        content: editedContent
      });
      
      setNotes(notes.map(note => 
        note.id === selectedNoteId ? updatedNote : note
      ));
      setIsEdited(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const deleteSelectedNote = async () => {
    if (!selectedNoteId) return;
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      setIsSaving(true);
      await deleteNote(selectedNoteId);
      
      const updatedNotes = notes.filter(note => note.id !== selectedNoteId);
      setNotes(updatedNotes);
      setSelectedNoteId(updatedNotes.length > 0 ? updatedNotes[0].id : null);
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value);
    setIsEdited(true);
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    setIsEdited(true);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getExcerpt = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };
  
  // Render empty state if no notes exist
  if (notes.length === 0 && !isLoading) {
    return (
      <div className="empty-state">
        <h3>No Notes Yet</h3>
        <p>Create a new note to store your ideas and information</p>
        <button className="btn-primary" onClick={createNewNote} disabled={isSaving}>
          {isSaving ? 'Creating...' : 'Create New Note'}
        </button>
      </div>
    );
  }
  
  return (
    <div className="notepad-container">
      <div className="notepad-list">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading notes...</p>
          </div>
        ) : (
          <>
            <div className="note-list-header">
              <button 
                className="btn-outline new-note-btn" 
                onClick={createNewNote}
                disabled={isSaving}
              >
                + New Note
              </button>
            </div>
            
            {notes.map(note => (
              <div 
                key={note.id} 
                className={`note-item ${selectedNoteId === note.id ? 'active' : ''}`}
                onClick={() => setSelectedNoteId(note.id)}
              >
                <div className="note-title">{note.title}</div>
                <div className="note-excerpt">{getExcerpt(note.content)}</div>
                <div className="note-date">{formatDate(note.updatedAt)}</div>
              </div>
            ))}
          </>
        )}
      </div>
      
      {selectedNoteId && (
        <div className="note-editor">
          <div className="editor-header">
            <input
              type="text"
              className="editor-title-input"
              value={editedTitle}
              onChange={handleTitleChange}
              placeholder="Note title"
              disabled={isSaving}
            />
            
            <div className="editor-actions">
              {isEdited && (
                <button 
                  className="btn-outline save-btn" 
                  onClick={saveNote}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
          
          <div className="editor-content">
            <textarea
              className="editor-textarea"
              value={editedContent}
              onChange={handleContentChange}
              placeholder="Start typing your note here..."
              disabled={isSaving}
            />
          </div>
          
          <div className="editor-actions">
            <div className="editor-action-group">
              <button 
                className="btn-outline delete-btn" 
                onClick={deleteSelectedNote}
                disabled={isSaving}
              >
                Delete
              </button>
            </div>
            
            <div className="editor-action-group">
              {isEdited && (
                <button 
                  className="btn-primary" 
                  onClick={saveNote}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotepadView;
