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
import RichContentCard, { VisualData } from "@/components/RichContentCard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Teleprompter from "@/components/Teleprompter";
import useRichAIResponse from "@/hooks/useRichAIResponse";
import processAIContent from "@/services/visualizationProcessor";
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
  visualizations?: VisualData[]; // Add visualizations
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
  visualizations?: VisualData[]; // Add visualizations
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
  const [teleprompterVisualizations, setTeleprompterVisualizations] = useState<VisualData[]>([]);
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
        
        // Process messages to extract visualizations
        const processedMessages = messages.map(message => {
          if (message.role === 'assistant') {
            const processed = processAIContent(message.content);
            return {
              ...message,
              visualizations: processed.visualizations
            };
          }
          return message;
        });
        
        setMessages(processedMessages);
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
    // Process content for visualizations
    const processedContent = processAIContent(text);
    setTeleprompterText(processedContent.cleanText);
    setTeleprompterVisualizations(processedContent.visualizations);
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
        title: 'Error',
        description: 'Failed to attach file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Audio recording handlers
  const toggleAudioRecording = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please login to record audio',
        variant: 'destructive'
      });
      return;
    }
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      setAudioChunks([]);
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks(prev => [...prev, e.data]);
        }
      };
      
      recorder.onstop = processAudioRecording;
      
      recorder.start();
      
      toast({
        title: 'Recording started',
        description: 'Speak clearly into your microphone...',
      });
    } catch (error) {
      console.error('Error starting audio recording:', error);
      toast({
        title: 'Recording failed',
        description: 'Could not access your microphone. Please check permissions.',
        variant: 'destructive'
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      
      // Stop all audio tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      
      setIsRecording(false);
    }
  };
  
  const processAudioRecording = () => {
    try {
      if (audioChunks.length === 0) return;
      
      // In a full implementation, we'd send this to a speech-to-text service
      // For now, just add a placeholder message
      handleSendMessage("[Audio recording submitted]\n\nPlease transcribe this audio recording.");
      
      toast({
        title: 'Audio submitted',
        description: 'Your audio recording has been submitted for processing.',
      });
    } catch (error) {
      console.error('Error processing audio recording:', error);
      toast({
        title: 'Processing failed',
        description: 'Failed to process your audio. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Handle adding message to note
  const handleAddToNote = (messageId: number) => {
    setShowNoteDropdown(messageId);
    fetchNotes();  // Refresh notes list when dropdown is opened
  };
  
  // Handle creating a new note from a message
  const handleCreateNewNote = async (content: string) => {
    if (!user || !isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please login to create notes',
        variant: 'destructive'
      });
      return;
    }
    
    if (!newNoteTitle.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your note',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Process content to extract visualizations
      const processedContent = processAIContent(content);
      
      const response = await fetch('/api/notepads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostId: user.id,
          title: newNoteTitle,
          content: content,
          visualizations: processedContent.visualizations
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create note');
      }
      
      const newNote = await response.json();
      
      toast({
        title: 'Note created',
        description: 'Your note has been created successfully',
      });
      
      // Reset add note form
      setNewNoteTitle('');
      setIsAddingNote(false);
      setShowNoteDropdown(null);
      
      // Store the note ID in session storage for Notepad view to open it
      sessionStorage.setItem("open_note_id", newNote.id.toString());
      
      // Redirect to notepad view to see the new note
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
  
  // Handle adding content to an existing note
  const handleAddToExistingNote = async (noteId: number, content: string) => {
    if (!user || !isAuthenticated) return;
    
    try {
      // Find the note to update
      const noteToUpdate = notes.find(note => note.id === noteId);
      if (!noteToUpdate) throw new Error('Note not found');
      
      // Process content for visualizations and merge them
      const processedContent = processAIContent(content);
      const existingVisualizations = noteToUpdate.visualizations || [];
      const combinedVisualizations = [
        ...existingVisualizations,
        ...processedContent.visualizations
      ];
      
      // Combine the content
      const combinedContent = `${noteToUpdate.content.trim()}\n\n${content.trim()}`;
      
      // Update the note with PUT request
      const response = await fetch(`/api/notepads/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: combinedContent,
          visualizations: combinedVisualizations
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update note');
      }
      
      toast({
        title: 'Note updated',
        description: `Content added to "${noteToUpdate.title}"`,
      });
      
      // Reset dropdown
      setShowNoteDropdown(null);
      
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

  // Message with visualization component
  const MessageWithVisualization = ({ message }: { message: AiChatMessage }) => {
    // Check if message already has visualizations, or process it
    const visualizations = message.visualizations || [];
    const hasVisualizations = visualizations.length > 0;
    
    // If we have pre-processed visualizations, use them
    if (hasVisualizations) {
      return (
        <RichContentCard 
          content={message.content}
          visualizations={visualizations}
          className="max-w-[80%] bg-[#232323] text-[#DDDDDD]"
        />
      );
    }
    
    // Otherwise process on the fly
    const { cleanText, visualizations: extractedVisualizations } = processAIContent(message.content);
    
    // If we found visualizations by processing
    if (extractedVisualizations.length > 0) {
      return (
        <RichContentCard 
          content={cleanText}
          visualizations={extractedVisualizations}
          className="max-w-[80%] bg-[#232323] text-[#DDDDDD]"
        />
      );
    }
    
    // Standard message container for text-only responses
    return (
      <div className="rounded-xl px-4 py-3.5 max-w-[80%] bg-[#232323] text-[#DDDDDD]">
        <div className="prose prose-invert max-w-none">
          {message.content.split('\n').map((line: string, i: number) => (
            <p key={i} className="m-0 mb-2 last:mb-0">{line}</p>
          ))}
        </div>
      </div>
    );
  };
  
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
        <aside className="w-[270px] bg-[#1A1A1A] rounded-lg flex flex-col h-full mr-4 overflow-hidden">
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
              onClick={handleNewChat}
            >
              <Plus size={16} />
              <span className="text-sm">New chat</span>
            </button>
          </div>
          
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-[#777777] px-2 mb-1.5">RECENTS</h3>
            <div className="overflow-y-auto h-full max-h-[calc(100vh-220px)] custom-scrollbar pb-3">
              {chatSessions.length > 0 ? (
                chatSessions.map((session) => (
                  <div 
                    key={session.id}
                    className={`flex items-center justify-between px-2 py-2.5 rounded-md text-sm cursor-pointer ${session.id === currentSessionId ? 'bg-[#252525] text-white' : 'text-[#BBBBBB] hover:bg-[#232323]'}`}
                    onClick={() => handleSessionClick(session.id)}
                  >
                    <div className="truncate">{session.title}</div>
                    <button className="text-[#777777] hover:text-white p-1">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#777777] text-center p-3">
                  No conversations yet
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
                <Teleprompter 
                  text={teleprompterText} 
                  visualizations={teleprompterVisualizations}
                  onClose={() => setShowTeleprompter(false)}
                />
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
                  
                  {message.role === 'user' ? (
                    // User messages - simple container
                    <div className="rounded-xl px-4 py-3.5 max-w-[80%] bg-[#2A2A2A] text-white">
                      <div className="prose prose-invert max-w-none">
                        {message.content.split('\n').map((line: string, i: number) => (
                          <p key={i} className="m-0 mb-2 last:mb-0">{line}</p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // AI messages - with rich content card
                    <MessageWithVisualization message={message} />
                  )}
                  
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-3 mt-3 text-[#777777] message-controls">
                      <button 
                        className="hover:text-[#DCC5A2] p-1" 
                        aria-label="Add to teleprompter"
                        onClick={() => addToTeleprompter(message.content)}
                      >
                        <Book size={14} />
                      </button>
                      <button className="hover:text-[#DCC5A2] p-1">
                        <RefreshCw size={14} />
                      </button>
                      <button className="hover:text-[#DCC5A2] p-1">
                        <ThumbsUp size={14} />
                      </button>
                      <button className="hover:text-[#DCC5A2] p-1">
                        <ThumbsDown size={14} />
                      </button>
                      <button
                        className="hover:text-[#DCC5A2] p-1 relative"
                        onClick={() => handleAddToNote(message.id)}
                        aria-label="Add to note"
                      >
                        <MessageCirclePlus size={14} />
                      </button>
                      <button className="hover:text-[#DCC5A2] p-1">
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
              <div className="mb-3 flex items-center">
                <span className="text-xs text-[#999999] mr-2">Commentary style:</span>
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
                <div className="flex items-center gap-5 text-[#999999]">
                  <button 
                    className="hover:text-[#DCC5A2] transition-colors" 
                    aria-label="Upload file"
                    onClick={handleFileUpload}
                    disabled={isUploading || isLoading3Dots || !isAuthenticated}
                  >
                    <Paperclip size={16} />
                  </button>
                  <button 
                    className={`hover:text-[#DCC5A2] transition-colors ${isRecording ? 'text-red-500 animate-pulse' : ''}`} 
                    aria-label="Record audio"
                    onClick={toggleAudioRecording}
                    disabled={isUploading || isLoading3Dots || !isAuthenticated}
                  >
                    <Mic size={16} />
                  </button>
                  <button 
                    className="hover:text-[#DCC5A2] transition-colors" 
                    aria-label="Take photo"
                    onClick={handleImageUpload}
                    disabled={isUploading || isLoading3Dots || !isAuthenticated}
                  >
                    <ImageIcon size={16} />
                  </button>
                </div>
                <button 
                  className="button-hover-effect rounded-lg px-5 py-1.5 bg-[#DCC5A2] text-[#121212] font-medium flex items-center gap-1.5 hover:bg-[#C6B190] transition-all text-xs"
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