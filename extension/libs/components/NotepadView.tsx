import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  getNotepadById,
  createNotepad,
  updateNotepad,
  deleteNotepad,
  extractCurrentPageContent,
} from '@libs/utils/api';
import Logo from '@libs/components/ui/Logo';

export interface NotepadViewProps {
  currentPageTitle?: string;
  currentPageUrl?: string;
}

const NotepadView: React.FC<NotepadViewProps> = ({ currentPageTitle, currentPageUrl }) => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [notepadId, setNotepadId] = useState<number | null>(id ? parseInt(id) : null);
  const [title, setTitle] = useState<string>('New Note');
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pageInfo, setPageInfo] = useState<{ title: string; url: string } | null>(null);
  
  // Get notepad data on component mount
  useEffect(() => {
    const initNotepad = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // If notepadId exists, fetch notepad data
        if (notepadId) {
          const notepadData = await getNotepadById(notepadId);
          setTitle(notepadData.title || 'Untitled Note');
          setContent(notepadData.content || '');
          setLastSaved(new Date(notepadData.updatedAt || notepadData.createdAt));
        } else {
          // For a new note, try to extract current page content
          try {
            const extractedContent = await extractCurrentPageContent();
            setPageInfo({
              title: extractedContent.title,
              url: extractedContent.url,
            });
            // Create a title based on the page
            setTitle(`Notes: ${extractedContent.title.substring(0, 50)}`);
          } catch (pageError) {
            console.error('Failed to extract page content:', pageError);
            // Don't set error state here, it's not critical
          }
        }
      } catch (err) {
        console.error('Error initializing notepad:', err);
        setError('Failed to load note data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initNotepad();
    
    // Clean up auto-save timer on unmount
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [notepadId]);
  
  // Auto-focus textarea when loading completes
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);
  
  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    scheduleAutoSave();
  };
  
  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    scheduleAutoSave();
  };
  
  // Schedule auto-save after user stops typing
  const scheduleAutoSave = () => {
    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      handleSave();
    }, 2000); // Auto-save 2 seconds after typing stops
    
    setAutoSaveTimer(timer);
  };
  
  // Save the notepad
  const handleSave = async () => {
    if (isSaving || (!title.trim() && !content.trim())) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      if (notepadId) {
        // Update existing notepad
        await updateNotepad(notepadId, content, title);
      } else {
        // Create new notepad
        const newNotepad = await createNotepad(title, content);
        setNotepadId(newNotepad.id);
        navigate(`/notepad/${newNotepad.id}`, { replace: true });
      }
      
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving notepad:', err);
      setError('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle delete notepad
  const handleDelete = async () => {
    if (!notepadId || !window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await deleteNotepad(notepadId);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting notepad:', err);
      setError('Failed to delete note. Please try again.');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="notepad-view-container flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-3 text-gray-600 hover:text-primary"
          >
            ←
          </button>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="font-medium text-sm border-none focus:outline-none focus:ring-0 w-[200px]"
            placeholder="Untitled Note"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          {lastSaved && (
            <span className="text-xs text-gray-500">
              {isSaving ? 'Saving...' : `Saved ${formatRelativeTime(lastSaved)}`}
            </span>
          )}
          {notepadId && (
            <button
              onClick={handleDelete}
              className="text-xs text-red-600 hover:text-red-800"
              title="Delete note"
            >
              Delete
            </button>
          )}
        </div>
      </header>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 text-sm">
          {error}
        </div>
      )}
      
      {/* Page info */}
      {pageInfo && (
        <div className="bg-gray-50 p-2 text-xs text-gray-600 flex items-center border-b">
          <span className="inline-block mr-1 w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="truncate">
            From: <a href={pageInfo.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{pageInfo.title}</a>
          </span>
        </div>
      )}
      
      {/* Editor area */}
      <div className="editor-area flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          className="w-full h-full p-4 border-none resize-none focus:outline-none focus:ring-0"
          placeholder="Start typing your notes here..."
        />
        
        {content.trim() === '' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center text-gray-500 p-4">
            <Logo size={40} />
            <p className="mt-4 text-sm">Start taking notes or paste content here</p>
            <p className="text-xs mt-2">Notes are automatically saved as you type</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Format relative time (e.g., "2m ago", "Just now")
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  
  // If more than a day, show date
  return date.toLocaleDateString();
}

export default NotepadView;
