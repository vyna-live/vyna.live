import React, { useState, useEffect } from 'react';

interface NotepadViewProps {
  currentPageTitle: string;
  currentPageUrl: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const NotepadView: React.FC<NotepadViewProps> = ({ currentPageTitle, currentPageUrl }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Function to fetch notes
  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'apiRequest',
          method: 'GET',
          endpoint: '/notepads'
        }, (response) => {
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(response?.error || 'Failed to fetch notes');
          }
        });
      });
      
      setNotes(response);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Failed to load notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new note
  const createNote = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      const newTitle = title || `Notes from ${currentPageTitle || 'Vyna Extension'}`;
      
      const response = await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'apiRequest',
          method: 'POST',
          endpoint: '/notepads',
          data: {
            title: newTitle,
            content: content,
            source: 'extension',
            sourceUrl: currentPageUrl
          }
        }, (response) => {
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(response?.error || 'Failed to create note');
          }
        });
      });
      
      // Add new note to list and select it
      setNotes(prev => [response, ...prev]);
      setSelectedNote(response);
      resetForm();
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error('Error creating note:', error);
      setError('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Function to update a note
  const updateNote = async () => {
    if (!selectedNote) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updatedNote = await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'apiRequest',
          method: 'PATCH',
          endpoint: `/notepads/${selectedNote.id}`,
          data: {
            title: title,
            content: content
          }
        }, (response) => {
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(response?.error || 'Failed to update note');
          }
        });
      });
      
      // Update notes list
      setNotes(prev => prev.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ));
      
      setSelectedNote(updatedNote);
      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating note:', error);
      setError('Failed to update note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Function to delete a note
  const deleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'apiRequest',
          method: 'DELETE',
          endpoint: `/notepads/${noteId}`
        }, (response) => {
          if (response && response.success) {
            resolve(true);
          } else {
            reject(response?.error || 'Failed to delete note');
          }
        });
      });
      
      // Remove from list
      setNotes(prev => prev.filter(note => note.id !== noteId));
      
      // If the selected note was deleted, clear selection
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  // Function to handle note selection
  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(false);
  };

  // Function to extract content from current page
  const extractPageContent = async () => {
    try {
      const pageData = await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'extractCurrentPageContent' },
          (response) => {
            if (response && response.success) {
              resolve(response);
            } else {
              reject(response?.error || 'Failed to extract page content');
            }
          }
        );
      });
      
      // Append content to current note or create new note
      const extractedContent = `# ${pageData.title}\n\nURL: ${pageData.url}\n\n${pageData.content}`;
      
      if (selectedNote && isEditing) {
        setContent(prev => prev + '\n\n' + extractedContent);
      } else {
        setTitle(`Notes from ${pageData.title}`);
        setContent(extractedContent);
        setIsEditing(true);
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error extracting page content:', error);
      alert('Failed to extract page content. Please try again.');
    }
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setContent('');
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    if (isEditing && selectedNote) {
      updateNote();
    } else {
      createNote();
    }
  };

  // Start new note
  const handleNewNote = () => {
    setSelectedNote(null);
    resetForm();
    setIsEditing(true);
  };

  return (
    <div className="vyna-notepad-view">
      <div className="vyna-notepad-header">
        <div className="vyna-notepad-actions">
          <button 
            className="vyna-action-btn" 
            onClick={handleNewNote}
          >
            New Note
          </button>
          <button 
            className="vyna-action-btn" 
            onClick={extractPageContent}
          >
            Extract Page
          </button>
        </div>
      </div>

      <div className="vyna-notepad-container">
        <div className="vyna-notes-list">
          <h3>Your Notes</h3>
          
          {isLoading ? (
            <div className="vyna-loading-notes">Loading notes...</div>
          ) : error ? (
            <div className="vyna-notes-error">{error}</div>
          ) : notes.length === 0 ? (
            <div className="vyna-empty-notes">No notes yet</div>
          ) : (
            <ul>
              {notes.map(note => (
                <li 
                  key={note.id}
                  className={`vyna-note-item ${selectedNote?.id === note.id ? 'active' : ''}`}
                  onClick={() => handleSelectNote(note)}
                >
                  <div className="vyna-note-title">{note.title}</div>
                  <div className="vyna-note-meta">
                    <span className="vyna-note-date">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    <button
                      className="vyna-note-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      title="Delete note"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="vyna-note-editor">
          {selectedNote && !isEditing ? (
            <div className="vyna-note-view">
              <div className="vyna-note-view-header">
                <h2>{selectedNote.title}</h2>
                <button 
                  className="vyna-edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              </div>
              <div className="vyna-note-content">
                {selectedNote.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          ) : (
            <form className="vyna-note-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Note title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="vyna-note-title-input"
              />
              <textarea
                placeholder="Write your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="vyna-note-content-input"
                rows={15}
              />
              <div className="vyna-form-actions">
                {selectedNote && (
                  <button 
                    type="button" 
                    className="vyna-cancel-btn"
                    onClick={() => {
                      setIsEditing(false);
                      setTitle(selectedNote.title);
                      setContent(selectedNote.content);
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="submit" 
                  className="vyna-save-btn"
                  disabled={!content.trim() || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .vyna-notepad-view {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .vyna-notepad-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--vyna-border);
          background-color: white;
        }

        .vyna-notepad-actions {
          display: flex;
          gap: 8px;
        }

        .vyna-action-btn {
          font-size: 12px;
          padding: 6px 12px;
          background-color: var(--vyna-primary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .vyna-notepad-container {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .vyna-notes-list {
          width: 30%;
          border-right: 1px solid var(--vyna-border);
          overflow-y: auto;
          background-color: #f5f5f5;
        }

        .vyna-notes-list h3 {
          padding: 12px 16px;
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          border-bottom: 1px solid var(--vyna-border);
        }

        .vyna-notes-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .vyna-note-item {
          padding: 12px 16px;
          border-bottom: 1px solid var(--vyna-border);
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .vyna-note-item:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .vyna-note-item.active {
          background-color: white;
          border-left: 3px solid var(--vyna-secondary);
        }

        .vyna-note-title {
          font-weight: 500;
          margin-bottom: 4px;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .vyna-note-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #666;
        }

        .vyna-note-delete {
          background: none;
          border: none;
          color: #999;
          font-size: 18px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        }

        .vyna-note-delete:hover {
          color: var(--vyna-error);
        }

        .vyna-loading-notes,
        .vyna-empty-notes,
        .vyna-notes-error {
          padding: 16px;
          color: #666;
          font-size: 13px;
          text-align: center;
        }

        .vyna-notes-error {
          color: var(--vyna-error);
        }

        .vyna-note-editor {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background-color: white;
        }

        .vyna-note-view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .vyna-note-view-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .vyna-edit-btn {
          padding: 4px 12px;
          background-color: var(--vyna-secondary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .vyna-note-content {
          line-height: 1.6;
          white-space: pre-wrap;
          font-size: 14px;
        }

        .vyna-note-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .vyna-note-title-input {
          padding: 8px 12px;
          font-size: 16px;
          border: 1px solid var(--vyna-border);
          border-radius: 4px;
        }

        .vyna-note-content-input {
          padding: 12px;
          font-size: 14px;
          border: 1px solid var(--vyna-border);
          border-radius: 4px;
          resize: none;
          font-family: inherit;
          line-height: 1.5;
        }

        .vyna-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .vyna-cancel-btn {
          padding: 8px 16px;
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }

        .vyna-save-btn {
          padding: 8px 16px;
          background-color: var(--vyna-secondary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .vyna-save-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default NotepadView;
