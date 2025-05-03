import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Types for AI chats
export interface AiChatSession {
  id: number;
  hostId: number;
  title: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatMessage {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant';
  content: string;
  isDeleted: boolean;
  createdAt: string;
}

export interface AiChat {
  id: number;
  hostId: number;
  message: string;
  response: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UIMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

interface VynaAIChatProps {
  className?: string;
  onTeleprompterText?: (text: string) => void;
  containerStyle?: React.CSSProperties;
  showBackButton?: boolean;
  onBackClick?: () => void;
  apiBaseUrl?: string; // For extensibility with browser extensions
}

const VynaAIChat: React.FC<VynaAIChatProps> = ({
  className = "",
  onTeleprompterText,
  containerStyle,
  showBackButton = false,
  onBackClick,
  apiBaseUrl = "", // Default to relative URLs for the main app
}) => {
  const [showNewChat, setShowNewChat] = useState<boolean>(false);
  const [showChatHistory, setShowChatHistory] = useState<boolean>(false);
  const [commentaryStyle, setCommentaryStyle] = useState<'color' | 'play-by-play'>('color'); // Default to color commentary
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Array<UIMessage>>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // AI Chat state
  const [chatSessions, setChatSessions] = useState<AiChatSession[]>([]);
  const [currentChatMessages, setCurrentChatMessages] = useState<AiChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  
  // For backward compatibility
  const [aiChats, setAiChats] = useState<AiChat[]>([]); 
  
  // Refs for file upload inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  
  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Fetch AI chats when the component mounts or user changes
  useEffect(() => {
    const fetchAiChats = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        // Fetch AI chat sessions
        const sessionsResponse = await fetch(`${apiBaseUrl}/api/ai-chat-sessions/${user.id}`);
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          setChatSessions(sessionsData);
        }
        
        // Fetch legacy AI chats for backward compatibility
        const chatResponse = await fetch(`${apiBaseUrl}/api/ai-chats/${user.id}`);
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          setAiChats(chatData);
        }
      } catch (error) {
        console.error('Error fetching AI chats:', error);
      }
    };
    
    fetchAiChats();
  }, [isAuthenticated, user, apiBaseUrl]);
  
  // Fetch messages for a specific session when currentSessionId changes
  useEffect(() => {
    const fetchSessionMessages = async () => {
      if (!currentSessionId) return;
      
      try {
        const response = await fetch(`${apiBaseUrl}/api/ai-chat-messages/${currentSessionId}`);
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
  }, [currentSessionId, apiBaseUrl]);

  // Handler for creating a new chat session
  const handleCreateNewChat = useCallback(() => {
    setShowNewChat(true);
    setShowChatHistory(false); // Show the empty state when opening a new chat
    setCurrentSessionId(null); // Reset current session to force creation of a new one
    setMessages([]); // Clear any existing messages
    // Clear the input value as well
    setInputValue("");
    
    // Set commentary style to default
    setCommentaryStyle("color"); // Default to color commentary
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
      const response = await fetch(`${apiBaseUrl}/api/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // For browser extension support
          ...(apiBaseUrl ? { 'Origin': window.location.origin } : {}),
        },
        // Important for browser extension to maintain session
        credentials: 'include',
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
        const sessionsResponse = await fetch(`${apiBaseUrl}/api/ai-chat-sessions/${user.id}`);
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
  }, [inputValue, isAuthenticated, user, toast, currentSessionId, apiBaseUrl, commentaryStyle]);

  // File upload handlers
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    if (!user || !isAuthenticated) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload files",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('hostId', user.id.toString());
      
      const response = await fetch(`${apiBaseUrl}/api/files/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const data = await response.json();
      
      // Add file info to the chat input
      setInputValue(prev => `${prev} [Uploaded file: ${file.name}] ${data.url ? data.url : ''}`);
      
      toast({
        title: "File Uploaded",
        description: `${file.name} has been uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [user, isAuthenticated, toast, apiBaseUrl]);
  
  const handleImageChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    if (!user || !isAuthenticated) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload images",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const file = event.target.files[0];
      
      // Check if file is an image
      if (!file.type.includes('image/')) {
        throw new Error('File must be an image');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('hostId', user.id.toString());
      formData.append('fileType', 'image');
      
      const response = await fetch(`${apiBaseUrl}/api/files/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      // Add image info to the chat input
      setInputValue(prev => `${prev} [Uploaded image: ${file.name}] ${data.url ? data.url : ''}`);
      
      toast({
        title: "Image Uploaded",
        description: `${file.name} has been uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  }, [user, isAuthenticated, toast, apiBaseUrl]);

  // Handle triggering the file input click
  const handleAttachmentClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  // Handle triggering the image input click
  const handleImageClick = useCallback(() => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  }, []);

  // Handle Enter key press for sending messages
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // Toggle commentary style
  const toggleCommentaryStyle = useCallback(() => {
    setCommentaryStyle(prev => prev === 'color' ? 'play-by-play' : 'color');
  }, []);

  return (
    <div className={`flex flex-col h-full ${className}`} style={containerStyle}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
      />
      
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleImageChange}
      />
      
      <input
        ref={audioInputRef}
        type="file"
        className="hidden"
        accept="audio/*"
        capture
      />

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
            <div className="w-5 h-5 flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
                <path d="M18.0002 0L23.6784 6.69459H12.3219L18.0002 0Z" fill="#40C4D0"/>
                <path d="M12.3219 6.69458L18.0002 0L18.0002 6.69458H12.3219Z" fill="#65D3DC"/>
                <path d="M23.6781 6.69458L18 0L18 6.69458H23.6781Z" fill="#1AA7B3"/>
                <path d="M0 18.0002L6.69459 12.3219V23.6784L0 18.0002Z" fill="#65D3DC"/>
                <path d="M6.69458 23.6781L0 18L6.69458 18L6.69458 23.6781Z" fill="#1AA7B3"/>
                <path d="M6.69458 12.3219L0 18L6.69458 18L6.69458 12.3219Z" fill="#40C4D0"/>
                <path d="M36.0002 18.0002L29.3056 23.6784V12.3219L36.0002 18.0002Z" fill="#40C4D0"/>
                <path d="M29.3054 12.3219L36 18L29.3054 18L29.3054 12.3219Z" fill="#1AA7B3"/>
                <path d="M29.3054 23.6781L36 18L29.3054 18L29.3054 23.6781Z" fill="#65D3DC"/>
                <path d="M18.0002 36.0002L12.3219 29.3056H23.6784L18.0002 36.0002Z" fill="#40C4D0"/>
                <path d="M23.6781 29.3054L18 36L18 29.3054H23.6781Z" fill="#65D3DC"/>
                <path d="M12.3219 29.3054L18 36L18 29.3054H12.3219Z" fill="#1AA7B3"/>
                <path d="M18 11.6393L11.6393 18L18 24.3607L24.3607 18L18 11.6393Z" fill="#133C40"/>
              </svg>
            </div>
            <span className="font-medium text-white">VynaAI</span>
          </div>
        )}
        
        {!showChatHistory && (
          <button
            onClick={handleCreateNewChat}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Chat View */}
      <div className="flex-1 overflow-y-auto">
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
                        setShowNewChat(true);
                        setShowChatHistory(true);
                      }}
                    >
                      <div className="text-zinc-200 text-xs hover:text-white transition-colors truncate pr-2">
                        {chat.message.length > 60 ? chat.message.substring(0, 57) + '...' : chat.message}
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
                    {index < aiChats.length - 1 && (
                      <div className="border-t border-zinc-800/40 mx-2 mt-1"></div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 text-xs text-center p-4">
                  No recent chats. Start a new conversation.
                </div>
              )}
            </div>
            
            <button 
              onClick={handleCreateNewChat}
              className="w-full mt-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-sm flex items-center justify-center transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              New chat
            </button>
          </div>
        ) : !showChatHistory ? (
          // Empty state - no messages yet
          <div className="flex flex-col items-center justify-center p-6 h-full text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                <path d="M18.0002 0L23.6784 6.69459H12.3219L18.0002 0Z" fill="#40C4D0"/>
                <path d="M12.3219 6.69458L18.0002 0L18.0002 6.69458H12.3219Z" fill="#65D3DC"/>
                <path d="M23.6781 6.69458L18 0L18 6.69458H23.6781Z" fill="#1AA7B3"/>
                <path d="M0 18.0002L6.69459 12.3219V23.6784L0 18.0002Z" fill="#65D3DC"/>
                <path d="M6.69458 23.6781L0 18L6.69458 18L6.69458 23.6781Z" fill="#1AA7B3"/>
                <path d="M6.69458 12.3219L0 18L6.69458 18L6.69458 12.3219Z" fill="#40C4D0"/>
                <path d="M36.0002 18.0002L29.3056 23.6784V12.3219L36.0002 18.0002Z" fill="#40C4D0"/>
                <path d="M29.3054 12.3219L36 18L29.3054 18L29.3054 12.3219Z" fill="#1AA7B3"/>
                <path d="M29.3054 23.6781L36 18L29.3054 18L29.3054 23.6781Z" fill="#65D3DC"/>
                <path d="M18.0002 36.0002L12.3219 29.3056H23.6784L18.0002 36.0002Z" fill="#40C4D0"/>
                <path d="M23.6781 29.3054L18 36L18 29.3054H23.6781Z" fill="#65D3DC"/>
                <path d="M12.3219 29.3054L18 36L18 29.3054H12.3219Z" fill="#1AA7B3"/>
                <path d="M18 11.6393L11.6393 18L18 24.3607L24.3607 18L18 11.6393Z" fill="#133C40"/>
              </svg>
            </div>
            <h2 className="text-xl font-medium text-white mb-2">VynaAI</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Ask questions to quickly<br />
              research topics while streaming
            </p>
          </div>
        ) : (
          // Show messages
          <div className="p-3 space-y-3">
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "user" ? (
                  <div className="bg-zinc-800/50 p-2 px-3 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-1 text-sm text-white">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-800/30 p-2 px-3 rounded-lg">
                    <div className="flex items-start">
                      <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                        <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
                          <path d="M18.0002 0L23.6784 6.69459H12.3219L18.0002 0Z" fill="#40C4D0"/>
                          <path d="M12.3219 6.69458L18.0002 0L18.0002 6.69458H12.3219Z" fill="#65D3DC"/>
                          <path d="M23.6781 6.69458L18 0L18 6.69458H23.6781Z" fill="#1AA7B3"/>
                          <path d="M0 18.0002L6.69459 12.3219V23.6784L0 18.0002Z" fill="#65D3DC"/>
                          <path d="M6.69458 23.6781L0 18L6.69458 18L6.69458 23.6781Z" fill="#1AA7B3"/>
                          <path d="M6.69458 12.3219L0 18L6.69458 18L6.69458 12.3219Z" fill="#40C4D0"/>
                          <path d="M36.0002 18.0002L29.3056 23.6784V12.3219L36.0002 18.0002Z" fill="#40C4D0"/>
                          <path d="M29.3054 12.3219L36 18L29.3054 18L29.3054 12.3219Z" fill="#1AA7B3"/>
                          <path d="M29.3054 23.6781L36 18L29.3054 18L29.3054 23.6781Z" fill="#65D3DC"/>
                          <path d="M18.0002 36.0002L12.3219 29.3056H23.6784L18.0002 36.0002Z" fill="#40C4D0"/>
                          <path d="M23.6781 29.3054L18 36L18 29.3054H23.6781Z" fill="#65D3DC"/>
                          <path d="M12.3219 29.3054L18 36L18 29.3054H12.3219Z" fill="#1AA7B3"/>
                          <path d="M18 11.6393L11.6393 18L18 24.3607L24.3607 18L18 11.6393Z" fill="#133C40"/>
                        </svg>
                      </div>
                      <div className="ml-2 flex-1">
                        <div className="text-sm text-zinc-200 whitespace-pre-wrap">
                          {message.content.split('\n').map((line, i) => {
                            // Check if the line starts with a bullet or number
                            const isList = line.trim().match(/^(-|\d+\.)\s.+/);
                            
                            // For bullet points, add more spacing
                            if (isList) {
                              return <p key={i} className="my-1 ml-2">{line}</p>;
                            }
                            
                            // Check if line is a heading (all caps or ends with colon)
                            const isHeading = line.trim() === line.trim().toUpperCase() && line.trim().length > 3 || 
                                           line.trim().endsWith(':');
                            
                            if (isHeading && line.trim().length > 0) {
                              return <h4 key={i} className="font-bold mt-3 mb-1">{line}</h4>;
                            }
                            
                            // Regular text line
                            return line.trim().length > 0 ? (
                              <p key={i} className="my-1.5">{line}</p>
                            ) : (
                              <br key={i} />
                            );
                          })}
                        </div>
                        
                        <div className="mt-2 flex items-center justify-end space-x-2">
                          {onTeleprompterText && (
                            <button
                              className="inline-flex items-center justify-center p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                              onClick={() => onTeleprompterText(message.content)}
                              title="Send to teleprompter"
                            >
                              <span className="font-bold text-xs">T</span>
                            </button>
                          )}
                          <button
                            className="inline-flex items-center justify-center p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                            title="Copy to clipboard"
                            onClick={() => {
                              navigator.clipboard.writeText(message.content);
                              toast({
                                title: "Copied",
                                description: "Text copied to clipboard",
                              });
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V17M16 3H10C8.89543 3 8 3.89543 8 5V15C8 16.1046 8.89543 17 10 17H20C21.1046 17 22 16.1046 22 15V9L16 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isAiLoading && (
              <div className="bg-zinc-800/30 p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="w-5 h-5 flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 36 36" fill="none" className="animate-pulse">
                      <path d="M18.0002 0L23.6784 6.69459H12.3219L18.0002 0Z" fill="#40C4D0"/>
                      <path d="M12.3219 6.69458L18.0002 0L18.0002 6.69458H12.3219Z" fill="#65D3DC"/>
                      <path d="M23.6781 6.69458L18 0L18 6.69458H23.6781Z" fill="#1AA7B3"/>
                      <path d="M0 18.0002L6.69459 12.3219V23.6784L0 18.0002Z" fill="#65D3DC"/>
                      <path d="M6.69458 23.6781L0 18L6.69458 18L6.69458 23.6781Z" fill="#1AA7B3"/>
                      <path d="M6.69458 12.3219L0 18L6.69458 18L6.69458 12.3219Z" fill="#40C4D0"/>
                      <path d="M36.0002 18.0002L29.3056 23.6784V12.3219L36.0002 18.0002Z" fill="#40C4D0"/>
                      <path d="M29.3054 12.3219L36 18L29.3054 18L29.3054 12.3219Z" fill="#1AA7B3"/>
                      <path d="M29.3054 23.6781L36 18L29.3054 18L29.3054 23.6781Z" fill="#65D3DC"/>
                      <path d="M18.0002 36.0002L12.3219 29.3056H23.6784L18.0002 36.0002Z" fill="#40C4D0"/>
                      <path d="M23.6781 29.3054L18 36L18 29.3054H23.6781Z" fill="#65D3DC"/>
                      <path d="M12.3219 29.3054L18 36L18 29.3054H12.3219Z" fill="#1AA7B3"/>
                      <path d="M18 11.6393L11.6393 18L18 24.3607L24.3607 18L18 11.6393Z" fill="#133C40"/>
                    </svg>
                  </div>
                  <div className="ml-2 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-[#40C4D0] mr-2" />
                    <span className="text-zinc-300 text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-zinc-800 relative">
        {/* Commentary style toggle */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-1">
          <button
            onClick={() => setCommentaryStyle('color')}
            className={`text-xs px-2 py-0.5 rounded-full ${commentaryStyle === 'color' 
              ? 'bg-[#5D1C34] text-white' 
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'} 
              transition-colors flex items-center gap-0.5`}
            title="Color Commentary - More detailed and insightful"
          >
            <span>CC</span>
          </button>
          <button
            onClick={() => setCommentaryStyle('play-by-play')}
            className={`text-xs px-2 py-0.5 rounded-full ${commentaryStyle === 'play-by-play' 
              ? 'bg-[#5D1C34] text-white' 
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'} 
              transition-colors flex items-center gap-0.5`}
            title="Play-by-Play Commentary - Quick, action-oriented"
          >
            <span>PP</span>
          </button>
        </div>
        <div className="relative rounded-lg border border-zinc-700 bg-zinc-800/50 flex items-center overflow-hidden">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            className="flex-1 bg-transparent border-none outline-none p-2 text-white text-sm placeholder-zinc-500"
            disabled={isAiLoading}
          />
          <div className="flex items-center px-2 space-x-1.5">
            <button
              onClick={handleAttachmentClick}
              disabled={isAiLoading || isUploading}
              className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              title="Attach file"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={handleImageClick}
              disabled={isAiLoading || isUploading}
              className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              title="Attach image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={sendMessage}
              disabled={isAiLoading || isUploading || !inputValue.trim()}
              className="text-white p-1.5 rounded-full bg-[#5D1C34] hover:bg-[#4c1629] transition-colors disabled:opacity-50 disabled:bg-zinc-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VynaAIChat;
