import React, { useState, useEffect } from 'react';

interface Notepad {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NotepadViewProps {
  userId?: number;
}

const NotepadView: React.FC<NotepadViewProps> = ({ userId }) => {
  const [notepads, setNotepads] = useState<Notepad[]>([]);
  const [currentNotepad, setCurrentNotepad] = useState<Notepad | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<number | null>(null);

  // Fetch user's notepads
  useEffect(() => {
    if (userId) {
      fetchNotepads();
    }
    
    return () => {
      // Clean up timeout on unmount
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [userId]);

  // Auto-save content when it changes
  useEffect(() => {
    if (currentNotepad && content !== currentNotepad.content) {
      // Clear previous timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      // Set new timeout for auto-save
      const timeout = setTimeout(() => {
        saveNotepad();
      }, 1000); // 1 second delay
      
      setSaveTimeout(timeout);
    }
  }, [content]);

  const fetchNotepads = async () => {
    try {
      setIsLoading(true);
      // Get token from storage
      chrome.storage.local.get(['token'], async (result) => {
        if (result.token) {
          const response = await fetch(`https://vyna.live/api/notepads/${userId}`, {
            headers: {
              'Authorization': `Bearer ${result.token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setNotepads(data);
            
            // Select the most recent notepad if available
            if (data.length > 0) {
              const latestNotepad = data[0]; // Assuming sorted by latest
              setCurrentNotepad(latestNotepad);
              setContent(latestNotepad.content);
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to fetch notepads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewNotepad = async () => {
    try {
      setIsLoading(true);
      // Get token from storage
      chrome.storage.local.get(['token'], async (result) => {
        if (result.token) {
          const response = await fetch('https://vyna.live/api/notepads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${result.token}`
            },
            body: JSON.stringify({
              hostId: userId,
              title: 'New Note',
              content: ''
            })
          });
          
          if (response.ok) {
            const newNotepad = await response.json();
            setNotepads(prev => [newNotepad, ...prev]);
            setCurrentNotepad(newNotepad);
            setContent('');
          }
        }
      });
    } catch (error) {
      console.error('Failed to create new notepad:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotepad = async () => {
    if (!currentNotepad || !userId) return;
    
    setIsSaving(true);
    
    try {
      // Get token from storage
      chrome.storage.local.get(['token'], async (result) => {
        if (result.token) {
          const response = await fetch(`https://vyna.live/api/notepads/${currentNotepad.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${result.token}`
            },
            body: JSON.stringify({
              content
            })
          });
          
          if (response.ok) {
            const updatedNotepad = await response.json();
            setCurrentNotepad(updatedNotepad);
            setNotepads(prev => prev.map(n => 
              n.id === updatedNotepad.id ? updatedNotepad : n
            ));
          }
        }
      });
    } catch (error) {
      console.error('Failed to save notepad:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectNotepad = (notepad: Notepad) => {
    // Save current notepad first if needed
    if (currentNotepad && content !== currentNotepad.content) {
      saveNotepad();
    }
    
    setCurrentNotepad(notepad);
    setContent(notepad.content);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar - Notepad List */}
      <div className="w-1/3 bg-zinc-900 border-r border-zinc-800 overflow-y-auto">
        <div className="p-2">
          <button
            onClick={createNewNotepad}
            className="w-full py-2 bg-primary/10 text-primary text-sm rounded flex items-center justify-center"
          >
            <span>New Note</span>
          </button>
        </div>
        
        <div className="mt-2">
          {notepads.map(notepad => (
            <div 
              key={notepad.id}
              className={`p-2 text-sm cursor-pointer hover:bg-zinc-800 ${currentNotepad?.id === notepad.id ? 'bg-zinc-800' : ''}`}
              onClick={() => selectNotepad(notepad)}
            >
              <div className="truncate">{notepad.title}</div>
              <div className="text-xs text-zinc-500">
                {new Date(notepad.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main Notepad Area */}
      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {currentNotepad ? (
              <>
                <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                  <input
                    type="text"
                    value={currentNotepad?.title || ''}
                    onChange={(e) => {
                      if (currentNotepad) {
                        setCurrentNotepad({ ...currentNotepad, title: e.target.value });
                      }
                    }}
                    onBlur={saveNotepad}
                    className="bg-transparent border-none text-white text-sm font-medium w-full"
                  />
                  <div className="text-xs text-zinc-500">
                    {isSaving ? 'Saving...' : 'Saved'}
                  </div>
                </div>
                <textarea
                  className="flex-1 p-4 bg-zinc-950 text-white resize-none border-none w-full h-full focus:outline-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start typing your note here..."
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                No notes yet. Create one to get started.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotepadView;