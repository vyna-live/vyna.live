import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { 
  ArrowLeft, 
  ChevronDown, 
  MoreVertical, 
  Plus, 
  Sparkles, 
  FileText,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Info,
  Paperclip,
  Mic,
  Image as ImageIcon,
  Upload,
  Loader2,
  Book,
  FileUp,
  X,
  PenLine,
  FilePlus,
  CirclePlus,
  MessageCirclePlus
} from "lucide-react";
import Logo from "@/components/Logo";
import UserAvatar from "@/components/UserAvatar";
import RichContentRenderer from "@/components/RichContentRenderer";
import AdaptiveContentRenderer from "@/components/AdaptiveContentRenderer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Teleprompter from "@/components/Teleprompter";
import "./VynaAIChat.css";

// Types
interface AiChatSession {
  id: number;
  hostId: number;
  title: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AiChatMessage {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant';
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  visualizations?: any[];
}

interface AiChat {
  id: number;
  hostId: number;
  message: string;
  response: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Note {
  id: number;
  hostId: number;
  title: string;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  visualizations?: any[];
}

export default function VynaAIChat() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'vynaai' | 'notepad'>('vynaai');
  const [chatSessions, setChatSessions] = useState<AiChatSession[]>([]);
  const [aiChats, setAiChats] = useState<AiChat[]>([]); // For legacy support
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentTitle, setCurrentTitle] = useState("New Chat");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isLoading3Dots, setIsLoading3Dots] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [teleprompterText, setTeleprompterText] = useState("");
  const [commentaryStyle, setCommentaryStyle] = useState<'color' | 'play-by-play'>('color');
  
  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  
  // File upload and audio recording states
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // Notes state for the add-to-note feature
  const [notes, setNotes] = useState<Note[]>([]);
  const [showNoteDropdown, setShowNoteDropdown] = useState<number | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const noteDropdownRef = useRef<HTMLDivElement>(null);
  
  // Sidebar state for responsive design
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch chat sessions when user logs in
  const fetchChatData = useCallback(async () => {
    if (!user) return;

    // Check if we're being redirected from landing page
    const initialQuestion = sessionStorage.getItem("vynaai_question");
    
    // If we have an initial question, we don't want to load existing sessions yet
    // This will be handled by the second useEffect that manages initial questions
    if (initialQuestion) {
      return;
    }

    try {
      // Fetch AI chat sessions
      const sessionsResponse = await fetch(`/api/ai-chat-sessions/${user.id}`);
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setChatSessions(sessionsData);

        // If there are sessions, select the most recent one
        if (sessionsData.length > 0) {
          setCurrentSessionId(sessionsData[0].id);
          setCurrentTitle(sessionsData[0].title);
        }
      }
      
      // Fetch legacy AI chats for backward compatibility
      const chatResponse = await fetch(`/api/ai-chats/${user.id}`);
      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        setAiChats(chatData);
      }
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
    }
  }, [user]);

  // Fetch messages for the current session
  const fetchMessages = useCallback(async () => {
    if (!currentSessionId) return;
    
    try {
      const response = await fetch(`/api/ai-chat-messages/${currentSessionId}`);
      if (response.ok) {
        const messages: AiChatMessage[] = await response.json();
        setMessages(messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [currentSessionId]);

  // Fetch user notes
  const fetchNotes = useCallback(async () => {
    if (!user) return;
    
    try {
      // Update to use notepads endpoint instead of notes
      const response = await fetch(`/api/notepads/${user.id}`);
      if (response.ok) {
        const notesData: Note[] = await response.json();
        // Ensure all notes have a visualizations property
        const notesWithVisualizations = notesData.map(note => ({
          ...note,
          visualizations: note.visualizations || []
        }));
        setNotes(notesWithVisualizations);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }, [user]);
  
  // Load chat sessions when user logs in
  useEffect(() => {
    fetchChatData();
    fetchNotes(); // Fetch notes when the component loads
  }, [fetchChatData, fetchNotes, user]);

  // Load messages when session changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages, currentSessionId]);
  
  // Check for question in sessionStorage and initialize chat
  useEffect(() => {
    const initialQuestion = sessionStorage.getItem("vynaai_question");
    if (initialQuestion && user) {
      // Clear it so refreshing doesn't re-add the question
      sessionStorage.removeItem("vynaai_question");
      
      // Reset messages and current session before sending the new question
      setMessages([]);
      setCurrentSessionId(null);
      setCurrentTitle("New Chat");
      
      // Send message to AI API
      handleSendMessage(initialQuestion);
    }
  }, [user]);
  
  const handleLogin = () => {
    setLocation("/auth");
  };
  
  const handleTabChange = (tab: 'vynaai' | 'notepad') => {
    setActiveTab(tab);
    
    // If switching to Notepad tab, redirect to the Notepad page
    if (tab === 'notepad') {
      setLocation("/notepad");
    }
  };
  
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setCurrentTitle("New Chat");
  };
  
  const handleSessionClick = (sessionId: number) => {
    setCurrentSessionId(sessionId);
    const selectedSession = chatSessions.find(session => session.id === sessionId);
    if (selectedSession) {
      setCurrentTitle(selectedSession.title);
    }
  };
  
  // Add to teleprompter functionality
  const addToTeleprompter = (text: string) => {
    setTeleprompterText(text);
    setShowTeleprompter(true);
  };
  
  // Handle sending messages to AI
  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputValue;
    if (messageToSend.trim() === "") return;
    
    // Create temporary message objects for UI
    const userMessage: AiChatMessage = {
      id: Date.now(),
      sessionId: currentSessionId || 0,
      role: 'user',
      content: messageToSend,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add messages to UI immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading3Dots(true);
    
    try {
      // Call the API to get a response with session support
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          hostId: user?.id,
          message: messageToSend,
          sessionId: currentSessionId,
          commentaryStyle
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }
      
      const data = await response.json();
      
      // Update messages with the real response
      setIsLoading3Dots(false);
      
      // If this created a new session, update our state
      if (data.isNewSession && data.sessionId) {
        // Fetch the updated session list
        const sessionsResponse = await fetch(`/api/ai-chat-sessions/${user?.id}`);
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          setChatSessions(sessionsData);
          
          // Update current session ID and title
          setCurrentSessionId(data.sessionId);
          
          // Find the session to get its title
          const newSession = sessionsData.find((s: AiChatSession) => s.id === data.sessionId);
          if (newSession) {
            setCurrentTitle(newSession.title);
          }
        }
      }
      
      // Refresh the messages to get the official ones from the database
      fetchMessages();
      
      // Update commentary style if provided
      if (data.commentaryStyle) {
        setCommentaryStyle(data.commentaryStyle);
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading3Dots(false);
      
      // Add error message
      const errorMessage: AiChatMessage = {
        id: Date.now() + 1,
        sessionId: currentSessionId || 0,
        role: 'assistant',
        content: "Sorry, there was an error processing your request. Please try again.",
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
    if (!file || !isAuthenticated) return;
    
    setIsUploading(true);
    try {
      // Create a readable message to send to AI
      let content = '';
      
      if (file.type.startsWith('image/')) {
        content = `[Image uploaded: ${file.name}]`;
      } else {
        content = `[File uploaded: ${file.name}]`;
      }
      
      // For now, we'll just append a note about the file
      // In a full implementation, we would actually upload this file and
      // process it with multimodal AI capabilities
      handleSendMessage(`${content}\n\nPlease analyze this ${file.type.split('/')[0]}.`);
      
      toast({
        title: 'File attached',
        description: `${file.name} has been attached to your message.`,
      });
    } catch (error) {
      console.error('Error attaching file:', error);
      toast({
        title: 'Error attaching file',
        description: 'Failed to attach file to message.',
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
          
          // For now, just tell the AI that audio was recorded
          handleSendMessage("[Audio Recording]\n\nPlease transcribe this audio.");
          
          toast({
            title: 'Audio recorded',
            description: 'Audio recording has been added to your message.',
          });
          
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
  
  // Add to note functionality
  const handleAddToNote = async (messageId: number) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please login to add content to notes',
        variant: 'destructive'
      });
      return;
    }
    
    // Make sure we have the latest notes before showing dropdown
    try {
      await fetchNotes();
      setShowNoteDropdown(messageId);
    } catch (error) {
      console.error("Error loading notes:", error);
      toast({
        title: 'Error loading notes',
        description: 'Failed to load your notes. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Create a new note with AI content and visualizations
  const handleCreateNewNote = async (content: string) => {
    if (!user) return;
    
    try {
      // Find the message to get visualizations
      const message = messages.find(m => m.id === showNoteDropdown);
      const visualizations = message?.visualizations || [];
      
      // Create a new note on the server
      const response = await fetch('/api/notepads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostId: user.id,
          title: newNoteTitle || 'AI Generated Note',
          content,
          visualizations: visualizations // Include visualizations in the new note
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create note');
      }
      
      // Get the created note data
      const noteData = await response.json();
      
      setShowNoteDropdown(null);
      setIsAddingNote(false);
      setNewNoteTitle('');
      
      // Refresh notes list
      await fetchNotes();
      
      toast({
        title: 'Note created',
        description: 'Content has been saved to a new note with visualizations',
      });
      
      // Store the note ID in session storage for Notepad view to open it
      sessionStorage.setItem("open_note_id", noteData.id.toString());
      
      // Redirect to notepad view to see the newly created note
      setLocation("/notepad");
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: 'Error creating note',
        description: 'Failed to create note. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Add content to an existing note with visualizations
  const handleAddToExistingNote = async (noteId: number, content: string) => {
    if (!user) return;
    
    try {
      // Find the note
      const note = notes.find(n => n.id === noteId);
      if (!note) {
        throw new Error('Note not found');
      }
      
      // Find the message to get visualizations
      const message = messages.find(m => m.id === showNoteDropdown);
      const messageVisualizations = message?.visualizations || [];
      
      // Update the note with appended content
      const updatedContent = note.content ? `${note.content}\n\n${content}` : content;
      
      // Combine existing visualizations with new ones
      const existingVisualizations = note.visualizations || [];
      const updatedVisualizations = [...existingVisualizations, ...messageVisualizations];
      
      const response = await fetch(`/api/notepads/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostId: user.id,
          title: note.title,
          content: updatedContent,
          visualizations: updatedVisualizations // Include combined visualizations
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update note');
      }
      
      setShowNoteDropdown(null);
      
      // Refresh notes list
      await fetchNotes();
      
      toast({
        title: 'Note updated',
        description: `Content with visualizations has been added to "${note.title}"`,
      });
      
      // Store the note ID in session storage for Notepad view to open it
      sessionStorage.setItem("open_note_id", noteId.toString());
      
      // Redirect to notepad view to see the updated note
      setLocation("/notepad");
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error updating note',
        description: 'Failed to update note. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (noteDropdownRef.current && !noteDropdownRef.current.contains(event.target as Node)) {
        setShowNoteDropdown(null);
        setIsAddingNote(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };
  
  // Check window size to auto-collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Loading indicator component
  const LoadingIndicator = () => (
    <div className="flex items-center gap-2">
      <Loader2 size={14} className="animate-spin text-[#DCC5A2]" />
      <span>Thinking...</span>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-6 border-b border-[#202020] bg-black z-10">
        <div className="flex items-center">
          <Logo size="sm" />
        </div>
        {isLoading ? (
          <div className="w-24 h-8 bg-[#252525] rounded-full animate-pulse"></div>
        ) : isAuthenticated ? (
          <UserAvatar />
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
      <div className="flex flex-1 p-4 pt-4 overflow-hidden">
        {/* Sidebar with spacing */}
        <aside className={`${sidebarCollapsed ? 'w-[60px]' : 'w-[270px]'} bg-[#1A1A1A] rounded-lg flex flex-col h-full mr-4 overflow-hidden transition-all duration-300`}>
          <div className="p-3 pb-2">
            <div className="flex items-center mb-2.5 px-1">
              {/* Drawer/hamburger menu icon */}
              <div className="p-1 mr-1">
                <button 
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={toggleSidebar}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                    <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              {/* Tabs - hidden when sidebar is collapsed */}
              {!sidebarCollapsed && (
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
                    <FileText size={12} className="mr-1" />
                    <span>Notepad</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* New chat button - adaptive to sidebar state */}
            <button 
              className={`w-full mb-3 flex items-center justify-center gap-1.5 py-2 bg-[#DCC5A2] text-[#121212] font-medium rounded-md hover:bg-[#C6B190] transition-all ${sidebarCollapsed ? 'px-0' : ''}`}
              onClick={handleNewChat}
            >
              <Plus size={16} />
              {!sidebarCollapsed && <span className="text-sm">New chat</span>}
            </button>
          </div>
          
          <div className="px-3 py-2">
            {!sidebarCollapsed && <h3 className="text-xs font-semibold text-[#777777] px-2 mb-1.5">RECENTS</h3>}
            <div className="overflow-y-auto h-full max-h-[calc(100vh-220px)] custom-scrollbar pb-3">
              {chatSessions.length > 0 ? (
                chatSessions.map((session) => (
                  <div 
                    key={session.id}
                    className={`flex items-center justify-between ${sidebarCollapsed ? 'px-1 py-3' : 'px-2 py-2.5'} rounded-md text-sm cursor-pointer ${session.id === currentSessionId ? 'bg-[#252525] text-white' : 'text-[#BBBBBB] hover:bg-[#232323]'}`}
                    onClick={() => handleSessionClick(session.id)}
                    title={sidebarCollapsed ? session.title : ''}
                  >
                    <div className={sidebarCollapsed ? 'w-full text-center' : 'truncate'}>
                      {sidebarCollapsed ? (
                        <Sparkles size={sidebarCollapsed ? 16 : 14} className="mx-auto" />
                      ) : (
                        session.title
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <button className="text-[#777777] hover:text-white p-1">
                        <MoreVertical size={16} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className={`text-xs text-[#777777] text-center ${sidebarCollapsed ? 'p-1' : 'p-3'}`}>
                  {!sidebarCollapsed && "No conversations yet"}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Chat Area with spacing */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-black rounded-lg relative z-[1]">
          {/* Teleprompter overlay */}
          {showTeleprompter && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9000]">
              <div className="relative">
                <Teleprompter text={teleprompterText} />
                <button 
                  className="absolute top-[-40px] right-[-15px] bg-black text-white rounded-full p-1.5 hover:bg-[#252525] transition-colors"
                  onClick={() => setShowTeleprompter(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
          
          {/* Chat Header */}
          <div className="h-[50px] border-b border-[#202020] bg-black flex items-center px-6 rounded-t-lg">
            <h2 className="flex-1 text-center flex items-center justify-center text-white font-medium">
              {currentTitle}
              <button className="p-1 ml-2 text-[#999999] hover:text-white">
                <ChevronDown size={16} />
              </button>
            </h2>
          </div>
          
          {/* Messages Area - Conditional overflow based on whether there are messages */}
          <div className={`flex-1 ${messages.length > 0 ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'} p-6 space-y-6 bg-black`}>
            {messages.length > 0 ? (
              // Display messages when available
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex message-appear ${message.role === 'user' ? 'justify-end' : 'items-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[#DCC5A2] flex items-center justify-center flex-shrink-0 mr-3 ai-avatar">
                      <Sparkles size={16} color="#121212" />
                    </div>
                  )}
                  
                  <div 
                    className={`rounded-xl px-4 py-3.5 ${
                      message.role === 'user' 
                        ? 'bg-[#2A2A2A] text-white max-w-[85%] sm:max-w-[80%]' 
                        : 'bg-[#232323] text-[#DDDDDD] max-w-[90%] sm:max-w-[80%]'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <RichContentRenderer content={message.content} />
                    ) : (
                      <AdaptiveContentRenderer 
                        content={message.content}
                        showAddToNote={true}
                        onAddToNote={() => setShowNoteDropdown(message.id)} 
                      />
                    )}
                    
                    {message.role === 'assistant' && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-[#777777] message-controls">
                        <button 
                          className="hover:text-[#DCC5A2] p-1" 
                          aria-label="Add to teleprompter"
                          onClick={() => addToTeleprompter(message.content)}
                        >
                          <Book size={14} />
                        </button>
                        <button className="hover:text-[#DCC5A2] p-1" aria-label="Regenerate response">
                          <RefreshCw size={14} />
                        </button>
                        <button className="hover:text-[#DCC5A2] p-1" aria-label="Like response">
                          <ThumbsUp size={14} />
                        </button>
                        <button className="hover:text-[#DCC5A2] p-1" aria-label="Dislike response">
                          <ThumbsDown size={14} />
                        </button>
                        <button
                          className="hover:text-[#DCC5A2] p-1 relative"
                          onClick={() => handleAddToNote(message.id)}
                          aria-label="Add to note"
                        >
                          <MessageCirclePlus size={14} />
                        </button>
                        <button className="hover:text-[#DCC5A2] p-1" aria-label="More options">
                          <MoreVertical size={14} />
                        </button>
                        
                        {/* Note dropdown */}
                        {showNoteDropdown === message.id && (
                          <div 
                            ref={noteDropdownRef}
                            className="absolute right-0 mt-2 z-50 bg-[#282828] border border-[#333] rounded-lg shadow-xl py-2 w-[240px]"
                            style={{ top: '25px' }}
                          >
                            <div className="px-3 py-1 text-xs font-semibold text-[#999]">
                              ADD TO NOTE
                            </div>
                            
                            {/* Note list */}
                            <div className="max-h-[200px] overflow-y-auto">
                              {notes.length > 0 ? (
                                notes.map(note => (
                                  <button 
                                    key={note.id}
                                    className="w-full text-left px-3 py-2 text-xs text-white hover:bg-[#333] truncate"
                                    onClick={() => handleAddToExistingNote(note.id, message.content)}
                                  >
                                    {note.title}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-xs text-[#999]">
                                  No notes found
                                </div>
                              )}
                            </div>
                            
                            {/* Create new note */}
                            {isAddingNote ? (
                              <div className="px-3 py-2 border-t border-[#444]">
                                <input
                                  type="text"
                                  value={newNoteTitle}
                                  onChange={(e) => setNewNoteTitle(e.target.value)}
                                  placeholder="Note title"
                                  className="w-full px-2 py-1.5 bg-[#333] border border-[#444] rounded text-white text-xs focus:outline-none focus:border-[#DCC5A2]"
                                />
                                <div className="flex justify-end mt-2 gap-2">
                                  <button 
                                    className="px-2 py-1 text-xs text-[#999] hover:text-white"
                                    onClick={() => setIsAddingNote(false)}
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    className="px-2 py-1 text-xs bg-[#DCC5A2] text-[#121212] rounded hover:bg-[#C6B190]"
                                    onClick={() => handleCreateNewNote(message.content)}
                                  >
                                    Create
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                className="w-full flex items-center px-3 py-2 text-xs text-[#DCC5A2] hover:bg-[#333] border-t border-[#444]"
                                onClick={() => setIsAddingNote(true)}
                              >
                                <FilePlus size={14} className="mr-2" />
                                Create new note
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              // Empty state when no messages
              <div className="h-full flex flex-col items-center justify-center text-center px-4 empty-state-animation">
                <h2 className="text-3xl font-bold text-white mb-3">VynaAI</h2>
                <p className="text-[#BBBBBB] text-sm max-w-[400px]">
                  Ask questions to quickly research topics while streaming
                </p>
              </div>
            )}
            
            {/* Loading indicator */}
            {isLoading3Dots && (
              <div className="flex items-start message-appear">
                <div className="w-8 h-8 rounded-full bg-[#DCC5A2] flex items-center justify-center flex-shrink-0 mr-3 ai-avatar">
                  <Sparkles size={16} color="#121212" />
                </div>
                <div className="rounded-xl px-4 py-3.5 bg-[#232323] text-[#DDDDDD]">
                  <LoadingIndicator />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area - No border */}
          <div className="p-4 bg-black rounded-b-lg">
            <div className="input-area flex flex-col bg-[#1A1A1A] rounded-lg p-3">
              <div className="flex-grow mb-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Ask a question"
                  className="chat-input w-full h-[60px] px-3 py-2 text-sm bg-transparent"
                  disabled={!isAuthenticated || isLoading3Dots}
                />
              </div>
              
              {/* Commentary style selector */}
              <div className="mb-3 flex items-center flex-wrap">
                <span className="text-xs text-[#999999] mr-2 mb-1">Commentary style:</span>
                <div className="flex bg-[#232323] rounded-md p-1">
                  <button
                    className={`text-xs px-2 py-1 rounded ${commentaryStyle === 'color' ? 'bg-[#DCC5A2] text-[#121212]' : 'text-[#999999]'}`}
                    onClick={() => setCommentaryStyle('color')}
                  >
                    Color
                  </button>
                  <button
                    className={`text-xs px-2 py-1 rounded ${commentaryStyle === 'play-by-play' ? 'bg-[#DCC5A2] text-[#121212]' : 'text-[#999999]'}`}
                    onClick={() => setCommentaryStyle('play-by-play')}
                  >
                    Play-by-play
                  </button>
                </div>
              </div>
              
              {/* Input controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-5 text-[#999999]">
                  <button 
                    className="hover:text-[#DCC5A2] transition-colors p-1.5 sm:p-1" 
                    aria-label="Upload file"
                    onClick={handleFileUpload}
                    disabled={isUploading || isLoading3Dots || !isAuthenticated}
                  >
                    <Paperclip size={16} />
                  </button>
                  <button 
                    className={`hover:text-[#DCC5A2] transition-colors p-1.5 sm:p-1 ${isRecording ? 'text-red-500 animate-pulse' : ''}`} 
                    aria-label="Record audio"
                    onClick={toggleAudioRecording}
                    disabled={isUploading || isLoading3Dots || !isAuthenticated}
                  >
                    <Mic size={16} />
                  </button>
                  <button 
                    className="hover:text-[#DCC5A2] transition-colors p-1.5 sm:p-1" 
                    aria-label="Take photo"
                    onClick={handleImageUpload}
                    disabled={isUploading || isLoading3Dots || !isAuthenticated}
                  >
                    <ImageIcon size={16} />
                  </button>
                </div>
                <button 
                  className="button-hover-effect rounded-lg px-4 sm:px-5 py-1.5 bg-[#DCC5A2] text-[#121212] font-medium flex items-center gap-1.5 hover:bg-[#C6B190] transition-all text-xs"
                  aria-label="Send message"
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!isAuthenticated || isLoading3Dots || isUploading || inputValue.trim() === ""}
                >
                  {isLoading3Dots || isUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Upload size={12} className="transform rotate-90" />
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