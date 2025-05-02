import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface NotepadViewProps {
  user: any;
}

const NotepadView: React.FC<NotepadViewProps> = ({ user }) => {
  const navigate = useNavigate();
  const { getNotes, getNote, saveNote, updateNote, deleteNote } = require('../utils/api');
  const Logo = require('./ui/Logo').default;
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  
  // Form state
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  
  // Get the auth token
  const [token, setToken] = useState<string>('');
  
  // Fetch notes on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Get user token
        const auth = await chrome.storage.local.get('userAuth');
        if (auth.userAuth?.token) {
          setToken(auth.userAuth.token);
          fetchNotes(auth.userAuth.token);
        }
      } catch (error) {
        console.error('Error initializing Notepad:', error);
      }
    };
    
    init();
  }, []);
  
  const fetchNotes = async (authToken: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getNotes(authToken);
      
      if (response.success && response.data) {
        setNotes(response.data);
      } else {
        setError(response.error || 'Failed to fetch notes');
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('An error occurred while fetching notes');
    } finally {
      setLoading(false);
    }
  };
  
  const selectNote = async (noteId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getNote(noteId, token);
      
      if (response.success && response.data) {
        setSelectedNote(response.data);
        setTitle(response.data.title);
        setContent(response.data.content);
        setEditMode(false);
      } else {
        setError(response.error || 'Failed to fetch note');
      }
    } catch (err) {
      console.error('Error fetching note:', err);
      setError('An error occurred while fetching the note');
    } finally {
      setLoading(false);
    }
  };
  
  const createNewNote = () => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setEditMode(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (selectedNote) {
        // Update existing note
        const response = await updateNote(selectedNote.id, title.trim(), content.trim(), token);
        
        if (response.success && response.data) {
          setSelectedNote(response.data);
          fetchNotes(token);
          setEditMode(false);
        } else {
          setError(response.error || 'Failed to update note');
        }
      } else {
        // Create new note
        const response = await saveNote(title.trim(), content.trim(), token);
        
        if (response.success && response.data) {
          setSelectedNote(response.data);
          fetchNotes(token);
          setEditMode(false);
        } else {
          setError(response.error || 'Failed to create note');
        }
      }
    } catch (err) {
      console.error('Error saving note:', err);
      setError('An error occurred while saving the note');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!selectedNote) return;
    
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await deleteNote(selectedNote.id, token);
      
      if (response.success) {
        setSelectedNote(null);
        setTitle('');
        setContent('');
        fetchNotes(token);
      } else {
        setError(response.error || 'Failed to delete note');
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('An error occurred while deleting the note');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <header className="flex justify-between items-center p-4 border-b">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-primary"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="ml-2">Back</span>
        </button>
        <Logo size="small" variant="icon" />
      </header>
      
      <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
        {/* Notes list (sidebar) */}
        <div className="w-full md:w-1/3 border-r overflow-y-auto" style={{ maxHeight: 'calc(100% - 64px)' }}>
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-medium">My Notes</h2>
            <button 
              onClick={createNewNote}
              className="flex items-center text-primary"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="ml-1 text-sm">New</span>
            </button>
          </div>
          
          {loading && notes.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-2 text-sm text-gray-500">Loading notes...</span>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              <p>No notes found</p>
              <button 
                onClick={createNewNote}
                className="mt-2 text-sm text-primary"
              >
                Create your first note
              </button>
            </div>
          ) : (
            <ul className="divide-y">
              {notes.map((note) => (
                <li 
                  key={note.id}
                  className={`p-3 cursor-pointer hover:bg-gray-100 ${selectedNote?.id === note.id ? 'bg-gray-100' : ''}`}
                  onClick={() => selectNote(note.id)}
                >
                  <h3 className="font-medium truncate">{note.title}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    {new Date(note.updatedAt || note.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Note content */}
        <div className="flex-grow flex flex-col overflow-hidden">
          {!selectedNote && !editMode ? (
            <div className="flex-grow flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium">No note selected</h3>
                <p className="mt-1 text-sm">
                  Select a note from the list or create a new one
                </p>
                <button 
                  onClick={createNewNote}
                  className="mt-4 btn btn-primary text-sm px-3 py-1"
                >
                  Create new note
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col p-4 overflow-hidden">
              {editMode ? (
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                  {error && (
                    <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm mb-4">
                      {error}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Note title"
                      className="w-full font-medium text-lg"
                      required
                    />
                  </div>
                  
                  <div className="flex-grow mb-4">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Note content"
                      className="w-full h-full resize-none"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedNote) {
                          setTitle(selectedNote.title);
                          setContent(selectedNote.content);
                          setEditMode(false);
                        } else {
                          setSelectedNote(null);
                          setTitle('');
                          setContent('');
                        }
                      }}
                      className="text-gray-500"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-medium text-lg">{selectedNote.title}</h2>
                    <div className="flex">
                      <button
                        onClick={() => setEditMode(true)}
                        className="text-primary mr-3"
                        title="Edit note"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={handleDelete}
                        className="text-red-600"
                        title="Delete note"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    Last updated: {new Date(selectedNote.updatedAt || selectedNote.createdAt).toLocaleString()}
                  </div>
                  
                  <div className="flex-grow overflow-y-auto">
                    <p className="whitespace-pre-wrap">{selectedNote.content}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotepadView;
