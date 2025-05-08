import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  ChevronDown, 
  MoreVertical, 
  Plus, 
  Sparkles, 
  FileText,
  Paperclip,
  Mic,
  Image as ImageIcon,
  Upload,
  Loader2,
  X
} from "lucide-react";
import Logo from "@/components/Logo";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import "../pages/VynaAIChat.css";
import { Note } from "@/types";

// Used to track which notes are currently active in the UI
interface NoteWithActive extends Note {
  active: boolean;
}

export default function Notepad() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'vynaai' | 'notepad'>('notepad');
  const [notes, setNotes] = useState<NoteWithActive[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentNote, setCurrentNote] = useState<NoteWithActive | null>(null);
  
  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  
  // File upload and audio recording states
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Load notes when component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotes();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);
  
  // Check for initial note from landing page or from "Add to Note" in AI chat
  useEffect(() => {
    // Check if we have a note from the landing page
    const initialNoteContent = sessionStorage.getItem("notepad_content");
    
    // Check if we have a specific note to open from AI chat "Add to Note" feature
    const openNoteId = sessionStorage.getItem("open_note_id");
    
    // Function to handle opening a specific note by ID
    const openSpecificNote = async (noteId: string) => {
      try {
        // Find note in current notes list
        const noteToOpen = notes.find(note => note.id === parseInt(noteId));
        
        if (noteToOpen) {
          // Note is already loaded, just make it active
          handleNoteClick(noteToOpen.id);
        } else {
          // Need to refresh notes and find the one to open
          await fetchNotes();
          
          // Find the note in the refreshed list
          if (!user) return;
          const refreshedNotes = await fetch(`/api/notepads/${user.id}`);
          const fetchedNotes = await refreshedNotes.json();
          
          const note = fetchedNotes.find((n: Note) => n.id === parseInt(noteId));
          if (note) {
            // Update active state in notes array
            const updatedNotes = fetchedNotes.map((n: Note) => ({
              ...n,
              active: n.id === parseInt(noteId)
            }));
            
            setNotes(updatedNotes);
            setCurrentNote({...note, active: true});
          }
        }
        
        // Clear the session storage
        sessionStorage.removeItem("open_note_id");
      } catch (error) {
        console.error('Error opening note:', error);
        toast({
          title: 'Error opening note',
          description: 'Failed to open the note. Please try again.',
          variant: 'destructive'
        });
      }
    };
    
    // Handle opening a note from AI chat "Add to Note" feature
    if (openNoteId && isAuthenticated && user) {
      openSpecificNote(openNoteId);
    }
    // Handle creating a new note from landing page
    else if (initialNoteContent && isAuthenticated && user) {
      // Remove it from session storage so we don't create duplicate notes on refresh
      sessionStorage.removeItem("notepad_content");
      
      // Create a new note with this content
      (async () => {
        try {
          // Create a new note on the server
          const response = await fetch('/api/notepads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              hostId: user!.id,
              title: initialNoteContent.length > 30 ? initialNoteContent.substring(0, 30) + "..." : initialNoteContent,
              content: initialNoteContent
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to create note');
          }
          
          const newNote = await response.json();
          
          // Add the new note to the local state with active state
          const newNoteWithActive = {
            ...newNote,
            active: true
          };
          
          // Mark all other notes as inactive
          const updatedNotes = notes.map(note => ({
            ...note,
            active: false
          }));
          
          setNotes([newNoteWithActive, ...updatedNotes]);
          setCurrentNote(newNoteWithActive);
          
          toast({
            title: 'Note created',
            description: 'Your note has been created successfully.',
          });
        } catch (error) {
          console.error('Error creating new note:', error);
          toast({
            title: 'Error creating note',
            description: 'Failed to create a new note. Please try again.',
            variant: 'destructive'
          });
        }
      })();
    }
  }, [isAuthenticated, user, notes, toast]);
  
  // Fetch notes from the server
  const fetchNotes = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/notepads/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      
      const fetchedNotes = await response.json();
      
      // Add active state for UI
      const notesWithActive = fetchedNotes.map((note: Note, index: number) => ({
        ...note,
        active: index === 0 // Make the first note active
      }));
      
      setNotes(notesWithActive);
      
      // Set the current note to the most recently updated note if available
      if (notesWithActive.length > 0) {
        setCurrentNote(notesWithActive[0]);
      } else {
        setCurrentNote(null);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error fetching notes',
        description: 'Failed to load your notes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogin = () => {
    setLocation("/auth");
  };
  
  const handleTabChange = (tab: 'vynaai' | 'notepad') => {
    setActiveTab(tab);
    if (tab === 'vynaai') {
      setLocation("/ai-chat");
    }
  };
  
  const handleNewNote = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: 'Authentication required',
        description: 'Please login to create notes',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // Create a new note on the server
      const response = await fetch('/api/notepads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostId: user!.id,
          title: 'New note',
          content: ''
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create note');
      }
      
      const newNote: Note = await response.json();
      
      // Add the new note to the local state with active state
      const newNoteWithActive: NoteWithActive = {
        ...newNote,
        active: true
      };
      
      // Mark all other notes as inactive
      const updatedNotes = notes.map(note => ({
        ...note,
        active: false
      }));
      
      setNotes([newNoteWithActive, ...updatedNotes]);
      setCurrentNote(newNoteWithActive);
      
    } catch (error) {
      console.error('Error creating new note:', error);
      toast({
        title: 'Error creating note',
        description: 'Failed to create a new note. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleNoteClick = (noteId: number) => {
    // Find the clicked note
    const clickedNote = notes.find(note => note.id === noteId);
    if (!clickedNote) return;

    // Update active state in notes array
    const updatedNotes = notes.map(note => ({
      ...note,
      active: note.id === noteId
    }));
    
    setNotes(updatedNotes);
    setCurrentNote(clickedNote);
  };
  
  const updateNote = async (noteId: number, title: string, content: string) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/notepads/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostId: user!.id,
          title,
          content
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update note');
      }
      
      const updatedNote: Note = await response.json();
      
      // Update both the current note and the notes list
      const updatedWithActive: NoteWithActive = {
        ...updatedNote,
        active: true
      };
      
      setCurrentNote(updatedWithActive);
      setNotes(notes.map(note => note.id === updatedNote.id 
        ? { ...updatedNote, active: true } 
        : { ...note, active: false }
      ));
      
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error updating note',
        description: 'Failed to save your note. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAddNote = async () => {
    if (inputValue.trim() === "") return;
    if (!isAuthenticated || !user) {
      toast({
        title: 'Authentication required',
        description: 'Please login to create notes',
        variant: 'destructive'
      });
      return;
    }
    
    if (!currentNote) {
      try {
        // Create a new note on the server
        const response = await fetch('/api/notepads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            hostId: user!.id,
            title: inputValue.length > 30 ? inputValue.substring(0, 30) + "..." : inputValue,
            content: inputValue
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create note');
        }
        
        const newNote = await response.json();
        
        // Add the new note to the local state with active state
        const newNoteWithActive = {
          ...newNote,
          active: true
        };
        
        // Mark all other notes as inactive
        const updatedNotes = notes.map(note => ({
          ...note,
          active: false
        }));
        
        setNotes([newNoteWithActive, ...updatedNotes]);
        setCurrentNote(newNoteWithActive);
        
        toast({
          title: 'Note created',
          description: 'Your note has been created successfully.',
        });
      } catch (error) {
        console.error('Error creating new note:', error);
        toast({
          title: 'Error creating note',
          description: 'Failed to create a new note. Please try again.',
          variant: 'destructive'
        });
      }
    } else {
      // Update the current note
      const newContent = currentNote.content 
        ? `${currentNote.content}\n\n${inputValue}` 
        : inputValue;
      
      // If it's a new note with a default title, derive title from input
      const newTitle = currentNote.title === "New note" && !currentNote.content
        ? (inputValue.length > 30 ? inputValue.substring(0, 30) + "..." : inputValue)
        : currentNote.title;
        
      await updateNote(currentNote.id, newTitle, newContent);
    }
    
    // Clear input
    setInputValue("");
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };
  
  // File upload handlers
  const handleFileUpload = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please login to upload files',
        variant: 'destructive'
      });
      return;
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleImageUpload = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please login to upload images',
        variant: 'destructive'
      });
      return;
    }
    
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };
  
  const processFileUpload = async (file: File) => {
    if (!file || !currentNote) return;
    
    setIsUploading(true);
    // TODO: Implement file upload to server
    // For now, just append the filename to the note
    
    try {
      const newContent = currentNote.content 
        ? `${currentNote.content}\n\n[File: ${file.name}]` 
        : `[File: ${file.name}]`;
      
      await updateNote(currentNote.id, currentNote.title, newContent);
      
      toast({
        title: 'File attached',
        description: `${file.name} has been attached to your note.`,
      });
    } catch (error) {
      console.error('Error attaching file:', error);
      toast({
        title: 'Error attaching file',
        description: 'Failed to attach file to note.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Toggle audio recording
  const toggleAudioRecording = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please login to record audio',
        variant: 'destructive'
      });
      return;
    }
    
    if (isRecording) {
      // Stop recording
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        recorder.onstop = () => {
          // Process the recorded audio
          setAudioChunks(chunks);
          // Add a placeholder for the audio in the note
          if (currentNote) {
            const newContent = currentNote.content 
              ? `${currentNote.content}\n\n[Audio Recording]` 
              : `[Audio Recording]`;
            
            updateNote(currentNote.id, currentNote.title, newContent);
            
            toast({
              title: 'Audio recorded',
              description: 'Audio recording has been added to your note.',
            });
          }
          
          setIsRecording(false);
          
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting audio recording:', error);
        toast({
          title: 'Recording error',
          description: 'Failed to start audio recording. Please check your microphone permissions.',
          variant: 'destructive'
        });
      }
    }
  };
  
  // Get a preview of the note content (first 60 characters)
  const getNotePreview = (content: string) => {
    return content.length > 60 
      ? content.substring(0, 60) + "..." 
      : content;
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-6 border-b border-[#202020] bg-black z-[2]">
        <div className="flex items-center">
          <Logo size="sm" />
        </div>
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button className="rounded-lg px-5 py-1.5 border border-[#222222] text-white hover:bg-[#222222] transition-all text-sm font-medium">
              Go Live
            </button>
            <UserAvatar />
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="rounded-full px-4 py-1.5 text-white bg-[#252525] hover:bg-[#303030] transition-all text-sm font-medium"
          >
            Login
          </button>
        )}
      </header>

      {/* Main content with spacing from navbar */}
      <div className="flex flex-1 p-4 pt-4 overflow-hidden z-[1]">
        {/* Sidebar with spacing */}
        <aside className="w-[270px] bg-[#1A1A1A] rounded-lg flex flex-col h-full mr-4 overflow-hidden z-[1]">
          <div className="p-3 pb-2">
            <div className="flex items-center mb-2.5 px-1">
              <div className="p-1 mr-1">
                <FileText size={18} className="text-gray-400" />
              </div>
              <div className="flex p-1 bg-[#202020] rounded-lg">
                <button 
                  className={`flex items-center gap-1 mr-1 px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === 'vynaai' ? 'bg-[#DCC5A2] text-[#121212] font-medium' : 'bg-transparent text-[#999999] hover:bg-[#333333] hover:text-white'}`}
                  onClick={() => handleTabChange('vynaai')}
                >
                  <Sparkles size={12} />
                  <span>VynaAI</span>
                </button>
                <button 
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === 'notepad' ? 'bg-[#DCC5A2] text-[#121212] font-medium' : 'bg-transparent text-[#999999] hover:bg-[#333333] hover:text-white'}`}
                  onClick={() => handleTabChange('notepad')}
                >
                  <span>Notepad</span>
                </button>
              </div>
            </div>
            <button 
              className="w-full mb-3 flex items-center justify-center gap-1.5 py-2 bg-[#DCC5A2] text-[#121212] font-medium rounded-md hover:bg-[#C6B190] transition-all"
              onClick={handleNewNote}
              disabled={isSaving || !isAuthenticated}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus size={16} />
                  <span className="text-sm">New note</span>
                </>
              )}
            </button>
          </div>
          
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-[#777777] px-2 mb-1.5">RECENTS</h3>
            <div className="overflow-y-auto h-full max-h-[calc(100vh-220px)] custom-scrollbar pb-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-[#DCC5A2]" />
                </div>
              ) : notes.length > 0 ? (
                notes.map((note) => (
                  <div 
                    key={note.id}
                    className={`flex flex-col px-2 py-2.5 rounded-md text-sm cursor-pointer mb-1 ${note.active ? 'bg-[#252525]' : 'hover:bg-[#232323]'}`}
                    onClick={() => handleNoteClick(note.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`truncate font-medium ${note.active ? 'text-white' : 'text-[#BBBBBB]'}`}>
                        {note.title}
                      </div>
                      <button className="text-[#777777] hover:text-white p-1">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <div className="text-[#777777] text-xs mt-1 line-clamp-2">
                      {getNotePreview(note.content)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-[#999999] text-sm">
                  {isAuthenticated ? "No notes yet. Create your first note!" : "Please login to see your notes."}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Note Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-black rounded-lg z-[1]">
          {/* Note Header */}
          <div className="h-[50px] border-b border-[#202020] bg-black flex items-center px-6 rounded-t-lg">
            <h2 className="flex-1 text-center flex items-center justify-center text-white font-medium">
              {currentNote ? currentNote.title : "Notepad"}
              <button className="p-1 ml-2 text-[#999999] hover:text-white">
                <ChevronDown size={16} />
              </button>
            </h2>
          </div>
          
          {/* Note Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#DCC5A2]" />
                <p className="text-[#BBBBBB] text-sm mt-4">Loading notes...</p>
              </div>
            ) : currentNote ? (
              <div 
                ref={contentRef}
                className="text-[#DDDDDD] text-sm leading-relaxed whitespace-pre-line"
              >
                {currentNote.content}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 empty-state-animation">
                <h2 className="text-3xl font-bold text-white mb-3">Notepad</h2>
                <p className="text-[#BBBBBB] text-sm max-w-[400px]">
                  Take notes while streaming or researching
                </p>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="p-4 bg-black rounded-b-lg">
            <div className="input-area flex flex-col bg-[#1A1A1A] rounded-lg p-3">
              <div className="flex-grow mb-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Type your note"
                  className="chat-input w-full h-[60px] px-3 py-2 text-sm bg-transparent"
                  disabled={isSaving || !isAuthenticated}
                />
              </div>
              
              {/* Input controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5 text-[#999999]">
                  <button 
                    className="hover:text-[#DCC5A2] transition-colors" 
                    aria-label="Upload file"
                    onClick={handleFileUpload}
                    disabled={isSaving || !isAuthenticated}
                  >
                    <Paperclip size={16} />
                  </button>
                  <button 
                    className={`hover:text-[#DCC5A2] transition-colors ${isRecording ? 'text-red-500 animate-pulse' : ''}`} 
                    aria-label="Record audio"
                    onClick={toggleAudioRecording}
                    disabled={isSaving || !isAuthenticated}
                  >
                    <Mic size={16} />
                  </button>
                  <button 
                    className="hover:text-[#DCC5A2] transition-colors" 
                    aria-label="Take photo"
                    onClick={handleImageUpload}
                    disabled={isSaving || !isAuthenticated}
                  >
                    <ImageIcon size={16} />
                  </button>
                </div>
                <button 
                  className="button-hover-effect rounded-lg px-5 py-1.5 bg-[#DCC5A2] text-[#121212] font-medium flex items-center gap-1.5 hover:bg-[#C6B190] transition-all text-xs"
                  aria-label="Add note"
                  onClick={handleAddNote}
                  disabled={isSaving || !isAuthenticated || inputValue.trim() === ""}
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <span>Add note</span>
                      <Plus size={12} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Hidden file inputs */}
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFileUpload(e.target.files[0]);
              }
            }}
          />
          <input 
            type="file" 
            accept="image/*" 
            ref={imageInputRef} 
            style={{ display: 'none' }} 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFileUpload(e.target.files[0]);
              }
            }}
          />
          <input 
            type="file" 
            accept="audio/*" 
            ref={audioInputRef} 
            style={{ display: 'none' }} 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFileUpload(e.target.files[0]);
              }
            }}
          />
        </main>
      </div>
    </div>
  );
}