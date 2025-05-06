import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Types for notepads
export interface Note {
  id: number;
  hostId: number;
  title: string;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotepadProps {
  className?: string;
  containerStyle?: React.CSSProperties;
  showBackButton?: boolean;
  onBackClick?: () => void;
  apiBaseUrl?: string; // For extensibility with browser extensions
}

const Notepad: React.FC<NotepadProps> = ({
  className = "",
  containerStyle,
  showBackButton = false,
  onBackClick,
  apiBaseUrl = "", // Default to relative URLs for the main app
}) => {
  const [showNewNote, setShowNewNote] = useState<boolean>(false);
  const [showNoteView, setShowNoteView] = useState<boolean>(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [noteLines, setNoteLines] = useState<string[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Fetch notepads when the component mounts or user changes
  useEffect(() => {
    const fetchNotes = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        // Fetch notepads
        const noteResponse = await fetch(`${apiBaseUrl}/api/notepads/${user.id}`, {
          credentials: 'include',
        });
        if (noteResponse.ok) {
          const noteData = await noteResponse.json();
          setSavedNotes(noteData);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };
    
    fetchNotes();
  }, [isAuthenticated, user, apiBaseUrl]);

  // Handle opening a new note
  const handleNewNote = useCallback(() => {
    setShowNewNote(true);
    setShowNoteView(false);
    setCurrentNote(null);
    setNoteLines([]);
    setNoteInput("");
    setEditingNoteId(null); // Reset the editing state
  }, []);

  // Handle viewing a note
  const handleViewNote = useCallback((note: Note) => {
    setCurrentNote(note);
    setShowNoteView(true);
    setShowNewNote(false);
  }, []);

  // Handle adding a line to the current note
  const handleAddNoteLine = useCallback(() => {
    if (!noteInput.trim()) {
      return;
    }

    // Add the line to the note lines
    setNoteLines((prev) => [...prev, noteInput.trim()]);

    // Reset input
    setNoteInput("");
  }, [noteInput]);

  // Handle saving the note and going back to notes list
  const handleSaveNote = useCallback(async () => {
    if (noteLines.length === 0) {
      toast({
        title: "Error",
        description: "Note content cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to save notes",
        variant: "destructive",
      });
      return;
    }

    const content = noteLines.join("\n");
    const title = noteLines[0].substring(0, 50) + (noteLines[0].length > 50 ? "..." : "");
    
    try {
      let response: Response;
      
      if (editingNoteId) {
        // Update existing note
        response = await fetch(`${apiBaseUrl}/api/notepads/${editingNoteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            hostId: user.id,
            title,
            content,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update note');
        }
        
        const updatedNote: Note = await response.json();
        
        // Update the note in the saved notes list
        setSavedNotes((prev: Note[]) => 
          prev.map(note => note.id === editingNoteId ? updatedNote : note)
        );
        
        toast({
          title: "Note updated",
          description: "Your note has been updated",
        });
      } else {
        // Create new note
        response = await fetch(`${apiBaseUrl}/api/notepads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            hostId: user.id,
            title,
            content,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save note');
        }
        
        const newNote: Note = await response.json();
        
        // Add the new note to the beginning of saved notes
        setSavedNotes((prev: Note[]) => [newNote, ...prev]);
        
        toast({
          title: "Note saved",
          description: "Your note has been saved",
        });
      }

      // Reset state
      setNoteLines([]);
      setNoteInput("");
      setShowNewNote(false);
      setEditingNoteId(null);
      
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "Failed to save your note",
        variant: "destructive",
      });
    }
  }, [noteLines, toast, isAuthenticated, user, editingNoteId, apiBaseUrl]);

  // Handler for editing an existing note
  const handleEditNote = useCallback(async (note: Note) => {
    // Set up the note for editing
    const lines = note.content.split('\n');
    setNoteLines(lines);
    setShowNewNote(true);
    setShowNoteView(false);
    setCurrentNote(null);
    
    // We'll add state to track that we're editing an existing note
    // This way we can update instead of creating a new note
    setEditingNoteId(note.id);
  }, []);

  // Handle keydown events in the input field
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleAddNoteLine();
      }
    },
    [handleAddNoteLine]
  );

  return (
    <div className={`flex flex-col h-full ${className}`} style={containerStyle}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        {showBackButton ? (
          <button
            onClick={onBackClick}
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center space-x-1">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-medium text-white">Notepad</span>
          </div>
        )}
        
        {showNoteView ? (
          <div className="flex space-x-2">
            <button
              onClick={() => handleEditNote(currentNote!)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ) : showNewNote ? (
          <button
            onClick={handleSaveNote}
            className="px-2 py-1 text-xs font-medium bg-[#5D1C34] text-white rounded-full hover:bg-[#4c1629] transition-colors"
          >
            Save
          </button>
        ) : (
          <button
            onClick={handleNewNote}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {showNewNote ? (
          <div className="p-3">
            <div className="space-y-2">
              {noteLines.map((line, index) => (
                <div key={index} className="bg-zinc-800/40 p-2 rounded-lg text-sm text-white">
                  {line}
                </div>
              ))}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Add a new line"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-zinc-800/20 border border-zinc-700 rounded-lg p-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-600"
                />
                <button
                  onClick={handleAddNoteLine}
                  disabled={!noteInput.trim()}
                  className="absolute right-2 top-[50%] transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : showNoteView && currentNote ? (
          <div className="p-3">
            <h3 className="text-md font-medium text-white mb-2">{currentNote.title}</h3>
            <div className="text-sm text-zinc-300 whitespace-pre-wrap">
              {currentNote.content.split('\n').map((line, index) => (
                <p key={index} className="mb-2">{line}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3">
            {savedNotes.length > 0 ? (
              <div className="space-y-2">
                {savedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2 bg-zinc-800/40 hover:bg-zinc-800/60 rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleViewNote(note)}
                  >
                    <h3 className="text-sm font-medium text-white mb-1 line-clamp-1">{note.title}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-2">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <svg
                  className="w-12 h-12 text-zinc-700 mb-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="text-lg font-medium text-white mb-1">No notes yet</h3>
                <p className="text-sm text-zinc-400 mb-4">Create a new note to get started</p>
                <button
                  onClick={handleNewNote}
                  className="px-4 py-2 bg-[#5D1C34] text-white rounded-lg hover:bg-[#4c1629] transition-colors"
                >
                  Create a note
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notepad;
