import React, { useState, useEffect } from 'react';
import { getNotes, getNote, saveNote, updateNote, deleteNote } from '../utils/api';
import '../../../popup/styles/popup.css';

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
      const response = await getNotes();
      
      if (response.success && response.data) {
        setNotes(response.data);
      } else {
        setError(response.error || 'Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Failed to load notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new note
  const createNewNote = async () => {
    if (!content.trim()) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const newTitle = title.trim() || `Notes from ${currentPageTitle || 'Vyna Extension'}`;
      
      const response = await saveNote(newTitle, content, currentPageUrl);
      
      if (response.success && response.data) {
        // Add new note to list and select it
        setNotes(prev => [response.data, ...prev]);
        setSelectedNote(response.data);
        resetForm();
        
        // Exit edit mode
        setIsEditing(false);
      } else {
        setError(response.error || 'Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      setError(error instanceof Error ? error.message : 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  // Function to update a note
  const updateExistingNote = async () => {
    if (!selectedNote || !content.trim()) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await updateNote(selectedNote.id, {
        title: title.trim() || selectedNote.title,
        content: content
      });
      
      if (response.success && response.data) {
        // Update notes list
        setNotes(prev => prev.map(note => 
          note.id === response.data.id ? response.data : note
        ));
        
        setSelectedNote(response.data);
        // Exit edit mode
        setIsEditing(false);
      } else {
        setError(response.error || 'Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      setError(error instanceof Error ? error.message : 'Failed to update note');
    } finally {
      setIsSaving(false);
    }
  };

  // Function to delete a note
  const deleteNoteById = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const response = await deleteNote(noteId);
      
      if (response.success) {
        // Remove from list
        setNotes(prev => prev.filter(note => note.id !== noteId));
        
        // If the selected note was deleted, clear selection
        if (selectedNote && selectedNote.id === noteId) {
          setSelectedNote(null);
          resetForm();
        }
      } else {
        alert(response.error || 'Failed to delete note');
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
      
      // Create a formatted content block
      const extractedContent = `# ${pageData.title}\n\nURL: ${pageData.url}\n\n${pageData.content}`;
      
      if (selectedNote && isEditing) {
        // Append to existing content
        setContent(prev => prev + '\n\n' + extractedContent);
      } else {
        // Create new note with extracted content
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
      updateExistingNote();
    } else {
      createNewNote();
    }
  };

  // Start new note
  const handleNewNote = () => {
    setSelectedNote(null);
    resetForm();
    setIsEditing(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with actions */}
      <div className="p-sm border-b flex gap-sm">
        <button 
          className="btn btn-sm btn-secondary"
          onClick={handleNewNote}
        >
          New Note
        </button>
        <button 
          className="btn btn-sm btn-primary"
          onClick={extractPageContent}
        >
          Extract Page
        </button>
      </div>

      {/* Notes container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Notes list */}
        <div className="w-1/3 border-r overflow-y-auto bg-gray-50">
          <h3 className="p-sm m-0 text-md font-semibold border-b">Your Notes</h3>
          
          {isLoading ? (
            <div className="p-md text-center text-secondary">Loading notes...</div>
          ) : error ? (
            <div className="p-md text-center text-error">{error}</div>
          ) : notes.length === 0 ? (
            <div className="p-md text-center text-secondary">No notes yet</div>
          ) : (
            <ul className="list-none p-0 m-0">
              {notes.map(note => (
                <li 
                  key={note.id}
                  className={`p-sm border-b cursor-pointer hover:bg-gray-100 ${selectedNote?.id === note.id ? 'bg-white border-l-4 border-l-secondary' : ''}`}
                  onClick={() => handleSelectNote(note)}
                >
                  <div className="font-medium mb-xs text-sm truncate">{note.title}</div>
                  <div className="flex justify-between items-center text-xs text-secondary">
                    <span>
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    <button
                      className="bg-transparent border-none text-secondary hover:text-error text-lg p-0 leading-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNoteById(note.id);
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

        {/* Note editor/viewer */}
        <div className="flex-1 overflow-y-auto p-md bg-white">
          {selectedNote && !isEditing ? (
            <div>
              <div className="flex justify-between items-center mb-md">
                <h2 className="m-0 text-lg">{selectedNote.title}</h2>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              </div>
              <div className="whitespace-pre-wrap text-md">
                {selectedNote.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          ) : (
            <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Note title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input text-md"
              />
              <textarea
                placeholder="Write your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-input text-md flex-1"
                rows={12}
              />
              <div className="flex justify-end gap-sm">
                {selectedNote && (
                  <button 
                    type="button" 
                    className="btn"
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
                  className="btn btn-secondary"
                  disabled={!content.trim() || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotepadView;