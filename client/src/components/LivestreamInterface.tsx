import { useState, useEffect, useCallback, useRef } from "react";
import {
  Mic,
  Camera,
  Smile,
  X,
  ChevronRight,
  MoreHorizontal,
  Menu,
  User,
  Settings,
  LogOut,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import Teleprompter from "./Teleprompter";
import Logo from "./Logo";
import AgoraVideo from "./AgoraVideo";
import useAgoraTokens from "@/hooks/useAgoraTokens";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

// Arena background image
const arenaImage = "/assets/arena.png";

interface LivestreamInterfaceProps {
  initialText?: string;
  streamInfo?: {
    appId: string | null;
    token: string | null;
    channelName: string | null;
    uid: number | null;
    streamTitle: string | null;
  };
}

// Types for notes and AI chats
interface Note {
  id: number;
  hostId: number;
  title: string;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AiChat {
  id: number;
  hostId: number;
  message: string;
  response: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

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
}

interface UIMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

// Empty initial arrays - we'll fetch from API
const EMPTY_CHATS: AiChat[] = [];
const EMPTY_NOTES: Note[] = [];
const EMPTY_CHAT_SESSIONS: AiChatSession[] = [];
const EMPTY_CHAT_MESSAGES: AiChatMessage[] = [];

// RTM chat messages will be handled by AgoraVideo component now

export default function LivestreamInterface({
  initialText = "",
  streamInfo,
}: LivestreamInterfaceProps) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"vynaai" | "notepad">("vynaai");
  const [showNewChat, setShowNewChat] = useState<boolean>(false);
  const [showChatHistory, setShowChatHistory] = useState<boolean>(false);
  const [commentaryStyle, setCommentaryStyle] = useState<'color' | 'play-by-play'>('color'); // Default to color commentary
  const [teleprompterText, setTeleprompterText] = useState(
    initialText || 
    "Welcome to my Vyna.live stream!\n\nToday we'll be discussing the latest advancements in AI technology and how it's transforming content creation.\n\nI'll cover three main topics:\n1. The evolution of AI models\n2. How AI is helping content creators\n3. Practical applications for livestreamers\n\nFeel free to ask questions in the chat as we go along!"
  );
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [viewerCount, setViewerCount] = useState("123.5k");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<
    Array<{ id: string; content: string; role: "user" | "assistant" }>
  >([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const isMobile = useIsMobile();
  const { user, isAuthenticated, logout } = useAuth();

  // Notepad functionality
  const [showNewNote, setShowNewNote] = useState<boolean>(false);
  const [showNoteView, setShowNoteView] = useState<boolean>(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [savedNotes, setSavedNotes] = useState<Note[]>(EMPTY_NOTES);
  const [noteLines, setNoteLines] = useState<string[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  
  // AI Chat state
  const [aiChats, setAiChats] = useState<AiChat[]>(EMPTY_CHATS);
  const [chatSessions, setChatSessions] = useState<AiChatSession[]>(EMPTY_CHAT_SESSIONS);
  const [currentChatMessages, setCurrentChatMessages] = useState<AiChatMessage[]>(EMPTY_CHAT_MESSAGES);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  
  // Refs for file upload inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Use Agora hooks to manage tokens and stream state
  const {
    isLoading: agoraLoading,
    error: agoraError,
    appId,
    token,
    channelName,
    uid,
    role,
    fetchHostToken,
    fetchAudienceToken,
    createLivestream,
  } = useAgoraTokens(streamInfo?.channelName ?? `channel-${Date.now()}`);

  // State specific to this component
  const [isStreamActive, setIsStreamActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>(isAuthenticated && user ? user.displayName || user.username : "Anonymous");
  const [streamTitle, setStreamTitle] = useState<string>("Vyna.live Stream");
  const [streamId, setStreamId] = useState<string>("");
  const [shareableLink, setShareableLink] = useState<string>("");
  const [showShareLink, setShowShareLink] = useState<boolean>(false);

  // Initialize livestream
  useEffect(() => {
    const initLivestream = async () => {
      try {
        if (
          streamInfo &&
          streamInfo.appId &&
          streamInfo.token &&
          streamInfo.channelName
        ) {
          console.log("Using provided stream info:", streamInfo);

          // Set the stream title if it's provided
          if (streamInfo.streamTitle) {
            setStreamTitle(streamInfo.streamTitle);
          }

          // We already have all the info needed to connect, set stream as active
          setIsStreamActive(true);

          // Set loading to false
          setIsLoading(false);
        } else {
          // No stream info provided, need to create a new session
          console.log("No stream info provided, creating new session");
          await fetchHostToken(channelName);

          // Set loading to false when everything is ready
          // In a production app, this would happen automatically in the hook
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        }
      } catch (err) {
        console.error("Error initializing Agora stream:", err);
        showErrorToast("Failed to initialize streaming service");
      }
    };

    initLivestream();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamInfo]);

  // Handle any errors from Agora
  useEffect(() => {
    if (agoraError) {
      showErrorToast(agoraError.message);
    }
  }, [agoraError]);
  
  // Update username when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserName(user.displayName || user.username);
    }
  }, [isAuthenticated, user]);

  // Handler for going live
  const handleGoLive = useCallback(async () => {
    try {
      // Create a new livestream with the current title and username
      const result = await createLivestream(streamTitle, userName);

      if (result) {
        setIsStreamActive(true);

        // Generate unique stream ID for the stream
        const generatedStreamId = result.id || `stream_${Date.now()}`;
        setStreamId(generatedStreamId);

        // Generate shareable link
        const hostUrl = window.location.origin;
        const link = `${hostUrl}/view-stream/${generatedStreamId}`;
        setShareableLink(link);
        setShowShareLink(true);

        toast({
          title: "You're Live!",
          description: "Your stream is now available to viewers",
        });
      }
    } catch (err) {
      showErrorToast("Failed to go live");
    }
  }, [createLivestream, streamTitle, userName, toast]);

  // Function to show error toast
  const showErrorToast = (message: string) => {
    setError(message);
    toast({
      title: "Stream Error",
      description: message,
      variant: "destructive",
    });
  };

  // Handle opening a new note
  const handleNewNote = useCallback(() => {
    setShowNewNote(true);
    setShowNoteView(false);
    setCurrentNote(null);
    setNoteLines([]);
    setNoteInput("");
    setEditingNoteId(null); // Reset the editing state
  }, []);

  // Fetch AI chats and notepads when the component mounts or user changes
  useEffect(() => {
    const fetchAiChatsAndNotes = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        // Fetch AI chat sessions
        const sessionsResponse = await fetch(`/api/ai-chat-sessions/${user.id}`);
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          setChatSessions(sessionsData);
        }
        
        // Fetch legacy AI chats for backward compatibility
        const chatResponse = await fetch(`/api/ai-chats/${user.id}`);
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          setAiChats(chatData);
        }
        
        // Fetch notepads
        const noteResponse = await fetch(`/api/notepads/${user.id}`);
        if (noteResponse.ok) {
          const noteData = await noteResponse.json();
          setSavedNotes(noteData);
        }
      } catch (error) {
        console.error('Error fetching AI chats and notes:', error);
      }
    };
    
    fetchAiChatsAndNotes();
  }, [isAuthenticated, user]);
  
  // Fetch messages for a specific session when currentSessionId changes
  useEffect(() => {
    const fetchSessionMessages = async () => {
      if (!currentSessionId) return;
      
      try {
        const response = await fetch(`/api/ai-chat-messages/${currentSessionId}`);
        if (response.ok) {
          const messages: AiChatMessage[] = await response.json();
          setCurrentChatMessages(messages);
          
          // Update the UI messages
          setMessages(
            messages.map((msg: AiChatMessage) => ({
              id: `${msg.id}`,
              content: msg.content,
              role: msg.role
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching session messages:', error);
      }
    };
    
    fetchSessionMessages();
  }, [currentSessionId]);

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
        response = await fetch(`/api/notepads/${editingNoteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
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
        response = await fetch('/api/notepads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
  }, [noteLines, toast, isAuthenticated, user, editingNoteId]);

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

  // Toggle the side drawer
  const toggleDrawer = useCallback(() => {
    setDrawerVisible((prev) => !prev);
  }, []);

  // Toggle the teleprompter
  const toggleTeleprompter = useCallback(() => {
    setShowTeleprompter((prev) => !prev);
  }, []);

  // Handle sending a message
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to use AI chat",
        variant: "destructive",
      });
      return;
    }

    // Create user message
    const userMessageId = Date.now().toString();
    const userMessage = {
      id: userMessageId,
      content: inputValue,
      role: "user" as const,
    };

    // Add user message to the chat
    setMessages((prev) => [...prev, userMessage]);

    // Show the chat history view after sending a message
    setShowChatHistory(true);

    // Clear the input
    setInputValue("");

    // Set loading state
    setIsAiLoading(true);

    try {
      // Call the API to get a response with session support
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId: user.id,
          message: userMessage.content,
          sessionId: currentSessionId, // Include current session ID if continuing a conversation
          commentaryStyle: commentaryStyle // Include the selected commentary style
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add AI response message
      const aiMessage = {
        id: Date.now().toString(),
        content: data.aiMessage?.content || data.response, // Support both new and old response formats
        role: "assistant" as const,
      };

      setMessages((prev) => [...prev, aiMessage]);
      
      // If this is a new session, update our session state
      if (data.isNewSession && data.sessionId) {
        // Fetch the updated session list
        const sessionsResponse = await fetch(`/api/ai-chat-sessions/${user.id}`);
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          setChatSessions(sessionsData);
          // Set the current session ID to the new one
          setCurrentSessionId(data.sessionId);
        }
      } else if (data.sessionId && !currentSessionId) {
        // If we got a session ID back but didn't have one before, set it
        setCurrentSessionId(data.sessionId);
      }
      
      // For backward compatibility - update legacy chats
      setAiChats((prev: AiChat[]) => [
        { ...data, message: userMessage.content, response: aiMessage.content, id: data.id }, 
        ...prev
      ]);
      
    } catch (error) {
      console.error("Error getting AI response:", error);

      // Add error message as AI response
      const errorMessage = {
        id: Date.now().toString(),
        content:
          "Sorry, I couldn't process your request at the moment. Please try again later.",
        role: "assistant" as const,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  }, [inputValue, isAuthenticated, user, toast, currentSessionId]);

  // No more chat simulation - chat is now handled by the AgoraVideo component with RTM

  return (
    <div className="w-full h-screen relative overflow-hidden bg-black p-4">
      {/* Top Navbar */}
      <div className="absolute top-4 left-4 right-4 h-12 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-between px-4 rounded-lg">
        <div className="flex items-center">
          <a href="/" className="transition-opacity hover:opacity-80">
            <Logo variant="light" size="sm" className="h-7" />
          </a>
        </div>

        <div className="flex items-center">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 bg-zinc-900/50 backdrop-blur-sm px-2 py-1 rounded-sm cursor-pointer hover:bg-zinc-800/60 transition-colors">
                  <div className="w-[24px] h-[24px] rounded-full overflow-hidden">
                    <img 
                      src={user.avatarUrl || "https://randomuser.me/api/portraits/men/32.jpg"} 
                      alt={user.displayName || user.username} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-white text-sm font-medium">{user.displayName || user.username}</span>
                  <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-white shadow-lg">
                <DropdownMenuLabel className="text-zinc-400 border-b border-zinc-800 pb-2">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuItem className="text-white hover:bg-zinc-800 cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-zinc-800 cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem 
                  className="text-red-500 hover:bg-zinc-800 hover:text-red-500 cursor-pointer"
                  onClick={() => {
                    logout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden mr-2">
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white text-sm font-medium mr-1">
                {userName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="h-full pt-12">
        <div className="flex h-full gap-3 rounded-[14px] overflow-hidden">
          {/* Main livestream view */}
          <div
            className={`h-full ${!isMobile && drawerVisible ? "w-[69%]" : "w-full"} transition-all duration-300 ease-in-out bg-black relative rounded-lg`}
            style={{
              borderTopRightRadius:
                !isMobile && drawerVisible ? "12px" : "12px",
              borderBottomRightRadius:
                !isMobile && drawerVisible ? "12px" : "12px",
              overflow: "hidden",
            }}
          >
            {/* Drawer is now controlled by button in AgoraVideo component */}

            {/* Stream content */}
            <div className="w-full h-full">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-black relative">
                  <img
                    src={arenaImage}
                    alt="Arena background"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                  <div className="z-10 flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
                    <div className="text-white text-lg">
                      Initializing Stream...
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <img
                    src={arenaImage}
                    alt="Arena background"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                  <div className="z-10 bg-black/70 backdrop-blur-sm p-6 rounded-lg border border-red-500/30">
                    <div className="text-red-400 text-xl mb-4">
                      Stream Error
                    </div>
                    <div className="text-white mb-4">{error}</div>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                // Stream video content
                <div className="w-full h-full">
                  {/* Show background image when not streaming */}
                  {!isStreamActive ? (
                    <div className="w-full h-full relative">
                      <img
                        src={arenaImage}
                        alt="Arena background"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <h2 className="text-white text-xl font-medium mb-4">
                          Ready to go live?
                        </h2>
                        <button
                          onClick={handleGoLive}
                          className="px-6 py-3 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] hover:from-[#B68D54] hover:to-[#6D2C44] rounded-lg text-[#EFE9E1] hover:shadow-md transition-all mb-4"
                        >
                          Start Streaming
                        </button>
                      </div>
                    </div>
                  ) : /* Use Agora for video streaming */
                  streamInfo?.appId &&
                    streamInfo?.token &&
                    streamInfo?.channelName ? (
                    <AgoraVideo
                      appId={streamInfo.appId}
                      channelName={streamInfo.channelName}
                      token={streamInfo.token}
                      uid={streamInfo.uid || undefined}
                      role={"host"}
                      userName={userName}
                      onToggleDrawer={toggleDrawer}
                      onToggleTeleprompter={toggleTeleprompter}
                    />
                  ) : appId && token ? (
                    <AgoraVideo
                      appId={appId}
                      channelName={channelName}
                      token={token}
                      uid={uid || undefined}
                      role={role}
                      userName={userName}
                      onToggleDrawer={toggleDrawer}
                      onToggleTeleprompter={toggleTeleprompter}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-white">Connecting to stream...</div>
                    </div>
                  )}
                </div>
              )}

              {/* Teleprompter controls now integrated into AgoraVideo bottom controls */}
              
              {/* Teleprompter overlay - centered in view */}
              {showTeleprompter && role === 'host' && (
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
                  <Teleprompter text={teleprompterText} />
                </div>
              )}

              {/* Chat is now handled by AgoraVideo component through RTM */}

              {/* Share Link Toggle Button */}
              {isStreamActive && !showShareLink && shareableLink && (
                <button
                  onClick={() => setShowShareLink(true)}
                  className="absolute top-4 right-4 z-30 bg-[#A67D44] hover:bg-[#B68D54] text-white px-3 py-2 rounded-md flex items-center shadow-lg transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    className="mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.59 13.51L15.42 17.49"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.41 6.51L8.59 10.49"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Share Link
                </button>
              )}

              {/* Shareable Link Floating Container */}
              {isStreamActive && showShareLink && shareableLink && (
                <div className="absolute bottom-4 left-4 z-30 bg-black/80 backdrop-blur-sm p-4 rounded-lg border border-[#A67D44]/30 max-w-md shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white text-base font-medium">
                      Share your stream
                    </h3>
                    <button
                      onClick={() => setShowShareLink(false)}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18M6 6L18 18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center bg-zinc-900 rounded overflow-hidden border border-zinc-700 mb-2">
                    <input
                      type="text"
                      value={shareableLink}
                      readOnly
                      className="w-full py-2 px-3 bg-transparent text-white text-sm outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareableLink);
                        toast({
                          title: "Link copied!",
                          description: "Share it with your audience",
                        });
                      }}
                      className="shrink-0 px-3 py-2 bg-[#A67D44] text-white font-medium hover:bg-opacity-90 transition-colors"
                    >
                      Copy
                    </button>
                  </div>

                  <p className="text-zinc-400 text-xs">
                    Copy this link to invite viewers to your livestream
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right drawer for AI/Notepad */}
          <div
            className={`h-full ${
              isMobile
                ? drawerVisible
                  ? "fixed inset-0 z-50 w-full opacity-100"
                  : "fixed -right-full opacity-0 pointer-events-none"
                : drawerVisible
                  ? "w-[30%] opacity-100"
                  : "w-0 opacity-0 pointer-events-none"
            } transition-all duration-300 ease-in-out bg-zinc-900 overflow-hidden flex flex-col ${!isMobile ? "rounded-l-xl border-l border-zinc-800" : ""}`}
          >
            {/* Drawer header with tabs */}
            <div className="flex items-center justify-between p-2 border-b border-zinc-800">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab("vynaai")}
                  className={`px-3 py-1 text-xs font-medium rounded-full flex items-center ${
                    activeTab === "vynaai"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5 mr-1"
                    viewBox="0 0 36 36"
                    fill="none"
                  >
                    <path
                      d="M18.0002 0L23.6784 6.69459H12.3219L18.0002 0Z"
                      fill="currentColor"
                    />
                    <path
                      d="M12.3219 6.69458L18.0002 0L18.0002 6.69458H12.3219Z"
                      fill="currentColor"
                    />
                    <path
                      d="M23.6781 6.69458L18 0L18 6.69458H23.6781Z"
                      fill="currentColor"
                    />
                    <path
                      d="M0 18.0002L6.69459 12.3219V23.6784L0 18.0002Z"
                      fill="currentColor"
                    />
                    <path
                      d="M6.69458 23.6781L0 18L6.69458 18L6.69458 23.6781Z"
                      fill="currentColor"
                    />
                    <path
                      d="M6.69458 12.3219L0 18L6.69458 18L6.69458 12.3219Z"
                      fill="currentColor"
                    />
                    <path
                      d="M36.0002 18.0002L29.3056 23.6784V12.3219L36.0002 18.0002Z"
                      fill="currentColor"
                    />
                    <path
                      d="M29.3054 12.3219L36 18L29.3054 18L29.3054 12.3219Z"
                      fill="currentColor"
                    />
                    <path
                      d="M29.3054 23.6781L36 18L29.3054 18L29.3054 23.6781Z"
                      fill="currentColor"
                    />
                    <path
                      d="M18.0002 36.0002L12.3219 29.3056H23.6784L18.0002 36.0002Z"
                      fill="currentColor"
                    />
                    <path
                      d="M23.6781 29.3054L18 36L18 29.3054H23.6781Z"
                      fill="currentColor"
                    />
                    <path
                      d="M12.3219 29.3054L18 36L18 29.3054H12.3219Z"
                      fill="currentColor"
                    />
                    <path
                      d="M18 11.6393L11.6393 18L18 24.3607L24.3607 18L18 11.6393Z"
                      fill="currentColor"
                      opacity="0.5"
                    />
                  </svg>
                  VynaAI
                </button>
                <button
                  onClick={() => setActiveTab("notepad")}
                  className={`px-3 py-1 text-xs font-medium rounded-full flex items-center ${
                    activeTab === "notepad"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5 mr-1"
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
                  Notepad
                </button>
              </div>
              <button
                onClick={toggleDrawer}
                className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "vynaai" ? (
                <>
                  {!showNewChat ? (
                    <div className="p-3">
                      <div className="text-white text-xs font-medium mb-2 uppercase">
                        RECENTS
                      </div>
                      {/* Show chat sessions */}
                      <div className="space-y-1">
                        {chatSessions.length > 0 ? (
                          chatSessions.map((session, index) => (
                            <div key={session.id}>
                              <div 
                                className={`flex justify-between items-center p-2 rounded-[8px] hover:bg-zinc-800/50 group transition-colors cursor-pointer ${currentSessionId === session.id ? 'bg-zinc-800/60' : ''}`}
                                onClick={() => {
                                  // Set the current session ID to fetch messages
                                  setCurrentSessionId(session.id);
                                  setShowNewChat(true);
                                  setShowChatHistory(true);
                                }}
                              >
                                <div className="text-zinc-200 text-xs hover:text-white transition-colors truncate pr-2">
                                  {session.title || `Chat from ${new Date(session.createdAt).toLocaleString()}`}
                                </div>
                                <button 
                                  className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent the parent onClick from firing
                                    // Add delete functionality later
                                  }}
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
                                      fill="currentColor"
                                    />
                                    <path
                                      d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z"
                                      fill="currentColor"
                                    />
                                    <path
                                      d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                </button>
                              </div>
                              {index < chatSessions.length - 1 && (
                                <div className="border-t border-zinc-800/40 mx-2 mt-1"></div>
                              )}
                            </div>
                          ))
                        ) : aiChats.length > 0 ? (
                          // Legacy chats for backward compatibility
                          aiChats.map((chat, index) => (
                            <div key={chat.id}>
                              <div 
                                className="flex justify-between items-center p-2 rounded-[8px] hover:bg-zinc-800/50 group transition-colors cursor-pointer"
                                onClick={() => {
                                  // Set the message and response in the chat
                                  setMessages([
                                    { id: `user-${chat.id}`, content: chat.message, role: 'user' as const },
                                    { id: `ai-${chat.id}`, content: chat.response, role: 'assistant' as const }
                                  ]);
                                  setCurrentSessionId(null); // Reset current session
                                  setShowNewChat(true);
                                  setShowChatHistory(true);
                                }}
                              >
                                <div className="text-zinc-200 text-xs hover:text-white transition-colors truncate pr-2">
                                  {chat.message}
                                </div>
                              </div>
                              {index < aiChats.length - 1 && (
                                <div className="border-t border-zinc-800/40 mx-2 mt-1"></div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-zinc-500 text-xs p-2">No recent AI chats found</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="flex items-center p-2 border-b border-zinc-800">
                        <button
                          onClick={() => setShowNewChat(false)}
                          className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 mr-2"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M15 18L9 12L15 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <span className="text-white text-sm font-medium truncate pr-6">
                          Who is the best CODM gamer in Nigeria as of March
                          2025?
                        </span>
                        <button className="ml-auto text-zinc-400 hover:text-white">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M6 9L12 15L18 9"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Chat messages area */}
                      <div className="flex-1 overflow-y-auto px-2 py-4">
                        {/* Empty state with star icon */}
                        {!showChatHistory ? (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-14 h-14 rounded-[14px] bg-zinc-800 flex items-center justify-center mb-4">
                              <svg
                                width="32"
                                height="32"
                                viewBox="0 0 36 36"
                                fill="none"
                              >
                                <path
                                  d="M18.0002 0L23.6784 6.69459H12.3219L18.0002 0Z"
                                  fill="#40C4D0"
                                />
                                <path
                                  d="M12.3219 6.69458L18.0002 0L18.0002 6.69458H12.3219Z"
                                  fill="#65D3DC"
                                />
                                <path
                                  d="M23.6781 6.69458L18 0L18 6.69458H23.6781Z"
                                  fill="#1AA7B3"
                                />
                                <path
                                  d="M0 18.0002L6.69459 12.3219V23.6784L0 18.0002Z"
                                  fill="#65D3DC"
                                />
                                <path
                                  d="M6.69458 23.6781L0 18L6.69458 18L6.69458 23.6781Z"
                                  fill="#1AA7B3"
                                />
                                <path
                                  d="M6.69458 12.3219L0 18L6.69458 18L6.69458 12.3219Z"
                                  fill="#40C4D0"
                                />
                                <path
                                  d="M36.0002 18.0002L29.3056 23.6784V12.3219L36.0002 18.0002Z"
                                  fill="#40C4D0"
                                />
                                <path
                                  d="M29.3054 12.3219L36 18L29.3054 18L29.3054 12.3219Z"
                                  fill="#1AA7B3"
                                />
                                <path
                                  d="M29.3054 23.6781L36 18L29.3054 18L29.3054 23.6781Z"
                                  fill="#65D3DC"
                                />
                                <path
                                  d="M18.0002 36.0002L12.3219 29.3056H23.6784L18.0002 36.0002Z"
                                  fill="#40C4D0"
                                />
                                <path
                                  d="M23.6781 29.3054L18 36L18 29.3054H23.6781Z"
                                  fill="#65D3DC"
                                />
                                <path
                                  d="M12.3219 29.3054L18 36L18 29.3054H12.3219Z"
                                  fill="#1AA7B3"
                                />
                                <path
                                  d="M18 11.6393L11.6393 18L18 24.3607L24.3607 18L18 11.6393Z"
                                  fill="#133C40"
                                />
                              </svg>
                            </div>
                            <div className="text-white text-xl font-medium mb-2">
                              VynaAI
                            </div>
                            <div className="text-zinc-400 text-sm max-w-xs">
                              Ask questions to quickly research topics while
                              streaming
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-4">
                            {messages.map((msg) => (
                              <div key={msg.id}>
                                {msg.role === "user" ? (
                                  /* User message */
                                  <div className="flex flex-col items-end">
                                    <div className="max-w-[85%] rounded-[14px] bg-zinc-800 text-white px-3 py-2.5 text-xs">
                                      {msg.content}
                                    </div>
                                  </div>
                                ) : (
                                  /* AI response */
                                  <div className="flex items-start space-x-2">
                                    <div className="w-6 h-6 rounded-[6px] bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 36 36"
                                        fill="none"
                                      >
                                        <path
                                          d="M18.0002 0L23.6784 6.69459H12.3219L18.0002 0Z"
                                          fill="#40C4D0"
                                        />
                                        <path
                                          d="M12.3219 6.69458L18.0002 0L18.0002 6.69458H12.3219Z"
                                          fill="#65D3DC"
                                        />
                                        <path
                                          d="M23.6781 6.69458L18 0L18 6.69458H23.6781Z"
                                          fill="#1AA7B3"
                                        />
                                        <path
                                          d="M0 18.0002L6.69459 12.3219V23.6784L0 18.0002Z"
                                          fill="#65D3DC"
                                        />
                                        <path
                                          d="M6.69458 23.6781L0 18L6.69458 18L6.69458 23.6781Z"
                                          fill="#1AA7B3"
                                        />
                                        <path
                                          d="M6.69458 12.3219L0 18L6.69458 18L6.69458 12.3219Z"
                                          fill="#40C4D0"
                                        />
                                        <path
                                          d="M36.0002 18.0002L29.3056 23.6784V12.3219L36.0002 18.0002Z"
                                          fill="#40C4D0"
                                        />
                                        <path
                                          d="M29.3054 12.3219L36 18L29.3054 18L29.3054 12.3219Z"
                                          fill="#1AA7B3"
                                        />
                                        <path
                                          d="M29.3054 23.6781L36 18L29.3054 18L29.3054 23.6781Z"
                                          fill="#65D3DC"
                                        />
                                        <path
                                          d="M18.0002 36.0002L12.3219 29.3056H23.6784L18.0002 36.0002Z"
                                          fill="#40C4D0"
                                        />
                                        <path
                                          d="M23.6781 29.3054L18 36L18 29.3054H23.6781Z"
                                          fill="#65D3DC"
                                        />
                                        <path
                                          d="M12.3219 29.3054L18 36L18 29.3054H12.3219Z"
                                          fill="#1AA7B3"
                                        />
                                        <path
                                          d="M18 11.6393L11.6393 18L18 24.3607L24.3607 18L18 11.6393Z"
                                          fill="#133C40"
                                        />
                                      </svg>
                                    </div>
                                    <div className="max-w-[85%] flex flex-col">
                                      <div className="rounded-[14px] bg-[#2A2A2D] text-white px-3 py-2.5 text-xs">
                                        {msg.content}
                                      </div>
                                      <div className="flex space-x-4 mt-2">
                                        {/* Reload button */}
                                        <button className="flex items-center justify-center text-zinc-400 hover:text-white">
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path d="M21 12a9 9 0 01-9 9"></path>
                                            <path d="M3 12a9 9 0 019-9"></path>
                                            <path d="M12 21a9 9 0 01-9-9"></path>
                                            <path d="M12 3a9 9 0 019 9"></path>
                                            <path d="M14 15l-3-3 3-3"></path>
                                          </svg>
                                        </button>

                                        {/* Like button */}
                                        <button className="flex items-center justify-center text-zinc-400 hover:text-white">
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                          </svg>
                                        </button>

                                        {/* Dislike button */}
                                        <button className="flex items-center justify-center text-zinc-400 hover:text-white">
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm10-13h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
                                          </svg>
                                        </button>

                                        {/* Teleprompter button */}
                                        <button 
                                          onClick={() => {
                                            // Set the teleprompter text to the AI message content
                                            setTeleprompterText(msg.content);
                                            // Show the teleprompter
                                            setShowTeleprompter(true);
                                            toast({
                                              title: "Sent to teleprompter",
                                              description: "The AI response has been sent to the teleprompter",
                                            });
                                          }}
                                          className="flex items-center justify-center text-zinc-400 hover:text-white font-medium"
                                        >
                                          <span className="text-xs">T</span>
                                        </button>

                                        {/* Add note button with dropdown */}
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button 
                                              className="flex items-center justify-center text-zinc-400 hover:text-white"
                                            >
                                              <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              >
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                              </svg>
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-white shadow-lg">
                                            <DropdownMenuLabel className="text-zinc-400 border-b border-zinc-800 pb-2">
                                              Add to Notes
                                            </DropdownMenuLabel>
                                            <DropdownMenuItem 
                                              className="text-white hover:bg-zinc-800 cursor-pointer"
                                              onClick={() => {
                                                // Add AI message to note lines for a new note
                                                const lines = msg.content.split('\n');
                                                setNoteLines(lines);
                                                // Switch to notepad tab and show new note
                                                setActiveTab("notepad");
                                                setShowNewNote(true);
                                                setEditingNoteId(null);
                                                toast({
                                                  title: "Added to notes",
                                                  description: "The AI response has been added to a new note",
                                                });
                                              }}
                                            >
                                              <svg
                                                className="mr-2 h-4 w-4"
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              >
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                              </svg>
                                              Create New Note
                                            </DropdownMenuItem>
                                            
                                            {savedNotes.length > 0 && <DropdownMenuSeparator className="bg-zinc-800" />}
                                            
                                            {savedNotes.map((note) => (
                                              <DropdownMenuItem 
                                                key={note.id}
                                                className="text-white hover:bg-zinc-800 cursor-pointer"
                                                onClick={() => {
                                                  // Get existing content and add new content
                                                  const existingLines = note.content.split('\n');
                                                  const newLines = msg.content.split('\n');
                                                  const combinedLines = [...existingLines, "", ...newLines];
                                                  
                                                  // Set up for editing the existing note
                                                  setNoteLines(combinedLines);
                                                  setActiveTab("notepad");
                                                  setShowNewNote(true);
                                                  setEditingNoteId(note.id);
                                                  
                                                  toast({
                                                    title: "Added to existing note",
                                                    description: `The AI response has been appended to "${note.title}"`
                                                  });
                                                }}
                                              >
                                                <svg
                                                  className="mr-2 h-4 w-4"
                                                  width="14"
                                                  height="14"
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                >
                                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                                {note.title || "Untitled Note"}
                                              </DropdownMenuItem>
                                            ))}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}

                            {isAiLoading && (
                              <div className="flex items-start space-x-2">
                                <div className="w-6 h-6 rounded-[6px] bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 36 36"
                                    fill="none"
                                    className="animate-pulse"
                                  >
                                    <path
                                      d="M18.0002 0L23.6784 6.69459H12.3219L18.0002 0Z"
                                      fill="#40C4D0"
                                    />
                                    <path
                                      d="M12.3219 6.69458L18.0002 0L18.0002 6.69458H12.3219Z"
                                      fill="#65D3DC"
                                    />
                                    <path
                                      d="M23.6781 6.69458L18 0L18 6.69458H23.6781Z"
                                      fill="#1AA7B3"
                                    />
                                    <path
                                      d="M0 18.0002L6.69459 12.3219V23.6784L0 18.0002Z"
                                      fill="#65D3DC"
                                    />
                                    <path
                                      d="M6.69458 23.6781L0 18L6.69458 18L6.69458 23.6781Z"
                                      fill="#1AA7B3"
                                    />
                                    <path
                                      d="M6.69458 12.3219L0 18L6.69458 18L6.69458 12.3219Z"
                                      fill="#40C4D0"
                                    />
                                    <path
                                      d="M36.0002 18.0002L29.3056 23.6784V12.3219L36.0002 18.0002Z"
                                      fill="#40C4D0"
                                    />
                                    <path
                                      d="M29.3054 12.3219L36 18L29.3054 18L29.3054 12.3219Z"
                                      fill="#1AA7B3"
                                    />
                                    <path
                                      d="M29.3054 23.6781L36 18L29.3054 18L29.3054 23.6781Z"
                                      fill="#65D3DC"
                                    />
                                    <path
                                      d="M18.0002 36.0002L12.3219 29.3056H23.6784L18.0002 36.0002Z"
                                      fill="#40C4D0"
                                    />
                                    <path
                                      d="M23.6781 29.3054L18 36L18 29.3054H23.6781Z"
                                      fill="#65D3DC"
                                    />
                                    <path
                                      d="M12.3219 29.3054L18 36L18 29.3054H12.3219Z"
                                      fill="#1AA7B3"
                                    />
                                    <path
                                      d="M18 11.6393L11.6393 18L18 24.3607L24.3607 18L18 11.6393Z"
                                      fill="#133C40"
                                    />
                                  </svg>
                                </div>
                                <div className="max-w-[85%] flex flex-col">
                                  <div className="rounded-[14px] bg-[#2A2A2D] text-zinc-400 px-3 py-2.5 text-xs flex items-center space-x-2">
                                    <span className="animate-pulse">
                                      Thinking
                                    </span>
                                    <span className="animate-ellipsis">
                                      ...
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Chat input */}
                      <div className="px-2 py-3">
                        <div className="relative">
                          <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              !e.shiftKey &&
                              (e.preventDefault(), sendMessage())
                            }
                            placeholder=""
                            className="w-full px-3 py-3 bg-[#2A2A2D] text-white placeholder-zinc-500 text-[11px] rounded-[14px] outline-none resize-none min-h-[40px] max-h-[120px] overflow-auto"
                            rows={1}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-3 text-zinc-400">
                            {/* Commentary style selector */}
                            <div className="flex space-x-2 mr-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => setCommentaryStyle('color')}
                                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${commentaryStyle === 'color' 
                                      ? 'bg-[#5D1C34] text-white' 
                                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                                  >
                                    CC
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="text-xs">Color Commentary - detailed, insightful analysis</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => setCommentaryStyle('play-by-play')}
                                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${commentaryStyle === 'play-by-play' 
                                      ? 'bg-[#A67D44] text-white' 
                                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                                  >
                                    PP
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="text-xs">Play-by-Play - quick, action-oriented commentary</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <button 
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
                              onClick={() => fileInputRef.current?.click()}
                              title="Upload document"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
                              </svg>
                            </button>
                            <button 
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
                              onClick={() => audioInputRef.current?.click()}
                              title="Record audio"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                              </svg>
                            </button>
                            <button 
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
                              onClick={() => imageInputRef.current?.click()}
                              title="Upload image"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect
                                  x="3"
                                  y="3"
                                  width="18"
                                  height="18"
                                  rx="2"
                                  ry="2"
                                ></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                              </svg>
                            </button>
                          </div>
                          <button
                            onClick={sendMessage}
                            className="flex items-center justify-center text-zinc-200 hover:text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-zinc-800/50 transition-colors"
                          >
                            Send
                            <svg
                              className="ml-1"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="22" y1="2" x2="11" y2="13"></line>
                              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {!showNewNote && !showNoteView && (
                    /* Notes list view - first mockup */
                    <div className="p-3">
                      <div className="text-white text-xs font-medium mb-2 uppercase">
                        NOTES
                      </div>
                      <div className="space-y-1">
                        {savedNotes.length > 0 ? (
                          savedNotes.map((note, index) => (
                            <div key={note.id}>
                              <div
                                onClick={() => handleViewNote(note)}
                                className="flex justify-between items-center p-2 rounded-[8px] hover:bg-zinc-800/50 group transition-colors cursor-pointer overflow-hidden"
                              >
                                <div className="flex-1 min-w-0 mr-2">
                                  <div className="text-zinc-200 text-xs hover:text-white transition-colors truncate">
                                    {note.title}
                                  </div>
                                  <div className="text-zinc-500 text-xs truncate">
                                    {note.content}
                                  </div>
                                </div>
                                <button className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-8 h-8 flex items-center justify-center">
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
                                      fill="currentColor"
                                    />
                                    <path
                                      d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z"
                                      fill="currentColor"
                                    />
                                    <path
                                      d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                </button>
                              </div>
                              {index < savedNotes.length - 1 && (
                                <div className="border-t border-zinc-800/40 mx-2 mt-1"></div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-zinc-500 text-xs p-2">No notes found</div>
                        )}
                      </div>
                    </div>
                  )}

                  {showNewNote && (
                    /* New note view with back arrow and paragraphs */
                    <div className="flex flex-col h-full">
                      {/* Header with back arrow */}
                      <div className="flex items-center p-2 border-b border-zinc-800">
                        <button
                          onClick={() => {
                            // Go back to the notes list without saving
                            setShowNewNote(false);
                            setEditingNoteId(null); // Reset editing state
                            setNoteLines([]);
                          }}
                          className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 mr-2"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M15 18L9 12L15 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <span className="text-white text-sm font-medium flex-1">
                          {editingNoteId ? "Edit Note" : "New Note"}
                        </span>
                        <button
                          onClick={handleSaveNote}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                          disabled={noteLines.length === 0}
                        >
                          {editingNoteId ? "Update" : "Save"}
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col h-full">
                        <div className="flex-1">
                          {/* Saved note lines */}
                          {noteLines.length > 0 && (
                            <div className="mb-4 mt-2">
                              <div className="text-zinc-200 text-[10px] whitespace-pre-line">
                                {noteLines.map((line, index) => (
                                  <p key={index} className="mb-2">
                                    {line}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Placeholder text when no lines have been added */}
                          {noteLines.length === 0 && (
                            <div className="text-center my-6">
                              <div className="text-white text-sm font-medium mb-2">
                                Research Notes
                              </div>
                              <div className="text-zinc-400 text-xs max-w-xs mx-auto">
                                Type and press Enter to add paragraphs to your
                                note
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Note input */}
                        <div className="mt-2">
                          <div className="relative">
                            <textarea
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddNoteLine();
                                }
                              }}
                              placeholder="Type and press Enter to add a paragraph"
                              className="w-full px-3 py-2 bg-[#2A2A2D] text-white placeholder-zinc-500 text-[10px] rounded-[14px] outline-none resize-none min-h-[40px] max-h-[80px] overflow-auto"
                              rows={2}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex space-x-3 text-zinc-400">
                              <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
                                </svg>
                              </button>
                              <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                  ></rect>
                                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                  <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                              </button>
                            </div>
                            <button
                              onClick={handleAddNoteLine}
                              className="flex items-center justify-center text-zinc-200 hover:text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-zinc-800/50 transition-colors"
                            >
                              Add
                              <svg
                                className="ml-1"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {showNoteView && currentNote && (
                    /* View note content - third mockup */
                    <div className="flex flex-col h-full">
                      <div className="flex items-center p-2 border-b border-zinc-800">
                        <button
                          onClick={() => {
                            setShowNoteView(false);
                            setCurrentNote(null);
                          }}
                          className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 mr-2"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M15 18L9 12L15 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <span className="text-white text-sm font-medium truncate flex-1 max-w-[70%]">
                          {currentNote.title}
                        </span>
                        <button 
                          onClick={() => {
                            // Call the edit function with the current note
                            if (currentNote) {
                              handleEditNote(currentNote);
                            }
                          }}
                          className="ml-auto text-zinc-400 hover:text-white"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 20H21"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M16.5 3.5C16.8978 3.10217 17.4374 2.87868 18 2.87868C18.5626 2.87868 19.1022 3.10217 19.5 3.5C19.8978 3.89783 20.1213 4.43739 20.1213 5C20.1213 5.56261 19.8978 6.10217 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Note content */}
                      <div className="flex-1 overflow-y-auto px-3 py-4">
                        <div className="text-zinc-200 text-xs whitespace-pre-line">
                          {currentNote.content}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Chat input */}
            <div className="p-3">
              {!showNewChat && activeTab === "vynaai" && (
                <button
                  onClick={() => {
                    setShowNewChat(true);
                    setShowChatHistory(false); // Show the empty star state when opening a new chat
                    setCurrentSessionId(null); // Reset current session to force creation of a new one
                    setMessages([]); // Clear any existing messages
                  }}
                  className="w-full py-2 bg-[#2A2A2D] hover:bg-zinc-700 rounded-[14px] text-white text-xs flex items-center justify-center transition-colors"
                >
                  <span className="font-medium">+ New chat</span>
                </button>
              )}

              {!showNewNote && !showNoteView && activeTab === "notepad" && (
                <button
                  onClick={handleNewNote}
                  className="w-full py-2 bg-[#2A2A2D] hover:bg-zinc-700 rounded-[14px] text-white text-xs flex items-center justify-center transition-colors"
                >
                  <span className="font-medium">+ New note</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
