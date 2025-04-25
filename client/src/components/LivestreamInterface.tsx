import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, Camera, Smile, X, ChevronRight, MoreHorizontal, Menu } from "lucide-react";
import Teleprompter from "./Teleprompter";
import Logo from "./Logo";
import StreamVideoComponent from "./StreamVideo";
import { useStreamVideoContext } from "../providers/StreamVideoProvider";
import { DeviceSettings } from "@stream-io/video-react-sdk";
import { useToast } from "@/hooks/use-toast";

// Arena background image
const arenaImage = "/assets/arena.png";

interface LivestreamInterfaceProps {
  initialText?: string;
}

// Mock chat messages for the right sidebar
const MOCK_RECENTS = [
  "Who is the best CODM gamer in Nigeria?",
  "Who is the best CODM gamer in Nigeria?",
  "Who is the best CODM gamer in Nigeria?",
  "Who is the best CODM gamer in Nigeria?",
  "Who is the best CODM gamer in Nigeria?",
  "Who is the best CODM gamer in Nigeria?",
  "Who is the best CODM gamer in Nigeria?",
  "Who is the best CODM gamer in Nigeria?",
  "Who is the best CODM gamer in Nigeria?",
  "Who is the best CODM gamer in Nigeria?",
  "Who is the best CODM gamer in Nigeria?",
];

// Mock incoming chat messages to simulate live chat
const CHAT_MESSAGES = [
  { userId: "user1", name: "Innocent Dive", message: "How far my guys wetin dey happen", color: "bg-orange-500" },
  { userId: "user2", name: "Godknows Ukari", message: "How far my guys wetin dey happen", color: "bg-blue-500" },
  { userId: "user3", name: "Godknows Ukari", message: "How far my guys wetin dey happen", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { userId: "user4", name: "Goddess", message: "joined", color: "bg-red-500", isJoined: true },
  { userId: "user5", name: "Victor Doe", message: "This stream is amazing!", color: "bg-green-500" },
  { userId: "user6", name: "Jane Smith", message: "Let's go!", color: "bg-yellow-500" },
  { userId: "user7", name: "Michael Jordan", message: "Nice game play!", color: "bg-indigo-500" },
  { userId: "user8", name: "Lebron James", message: "That was sick!", color: "bg-pink-500" },
];

export default function LivestreamInterface({ initialText = "" }: LivestreamInterfaceProps) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'vynaai' | 'notepad'>('vynaai');
  const [showNewChat, setShowNewChat] = useState<boolean>(false);
  const [teleprompterText, setTeleprompterText] = useState(initialText);
  const [viewerCount, setViewerCount] = useState("123.5k");
  const [chatMessages, setChatMessages] = useState<typeof CHAT_MESSAGES>(CHAT_MESSAGES.slice(0, 5));
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Get stream client from provider context
  const { client, isInitialized, error: streamError } = useStreamVideoContext();
  
  // Additional GetStream state specific to this component
  const [isStreamActive, setIsStreamActive] = useState<boolean>(true); // Set to true for demo
  const [callId] = useState<string>(`livestream-${Date.now()}`);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Set to true to show loading state
  const [error, setError] = useState<string | null>(null);
  const [streamApiKey, setStreamApiKey] = useState<string>("");
  const [streamToken, setStreamToken] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("Divine Samuel");
  const [streamTitle, setStreamTitle] = useState<string>("Jaja Games");

  // Get credentials that may not be in context
  useEffect(() => {
    const getStreamCredentials = async () => {
      try {
        // Get API key from our backend if not already available
        if (!streamApiKey) {
          const keyResponse = await fetch('/api/stream/key');
          if (keyResponse.ok) {
            const keyData = await keyResponse.json();
            setStreamApiKey(keyData.apiKey);
          } else {
            showErrorToast("Failed to get stream API key");
          }
        }
        
        // Generate a random user ID if not already set
        if (!userId) {
          const randomId = `user-${Math.random().toString(36).substring(2, 9)}`;
          setUserId(randomId);
          
          // Generate a token for this user
          const tokenResponse = await fetch('/api/stream/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: randomId,
              userName: userName,
            }),
          });
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            setStreamToken(tokenData.token);
          } else {
            showErrorToast("Failed to get stream token");
          }
        }

        // Simulate loading for demo purposes
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
        
      } catch (err) {
        console.error('Error initializing stream:', err);
        showErrorToast('Failed to initialize streaming service');
      }
    };
    
    getStreamCredentials();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Handle any errors from the stream context
  useEffect(() => {
    if (streamError) {
      showErrorToast(streamError.message);
    }
  }, [streamError]);
  
  // Function to show error toast
  const showErrorToast = (message: string) => {
    setError(message);
    toast({
      title: "Stream Error",
      description: message,
      variant: "destructive",
    });
  };

  // Toggle the side drawer
  const toggleDrawer = useCallback(() => {
    setDrawerVisible(prev => !prev);
  }, []);

  // Simulate incoming chat messages
  useEffect(() => {
    // Only add chat messages if the chat container is visible
    if (!chatContainerRef.current) return;

    let messageIndex = 4; // Start from the 5th message

    const addMessage = () => {
      if (messageIndex < CHAT_MESSAGES.length) {
        setChatMessages(prev => {
          // Limit to only 5 messages by removing the oldest one if we have 5 already
          const newMessages = [...prev, CHAT_MESSAGES[messageIndex]];
          if (newMessages.length > 5) {
            return newMessages.slice(newMessages.length - 5);
          }
          return newMessages;
        });
        
        messageIndex = (messageIndex + 1) % CHAT_MESSAGES.length;
        
        // Scroll to bottom
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }
    };

    // Add a new message every 3-5 seconds
    const interval = setInterval(() => {
      const randomDelay = Math.floor(Math.random() * 2000) + 3000;
      setTimeout(addMessage, randomDelay);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Render chat participants
  const renderChatParticipants = () => {
    return (
      <div 
        ref={chatContainerRef}
        className="overflow-y-auto max-h-full flex flex-col-reverse pb-2"
      >
        {chatMessages.map((chatMsg, index) => (
          <div key={index} className="animate-slideInUp">
            <div className="flex items-center space-x-1.5 py-1">
              <div className={`w-5 h-5 rounded-full ${chatMsg.color} overflow-hidden flex items-center justify-center text-xs shadow-sm`}>
                {chatMsg.name.charAt(0)}
              </div>
              <div className="text-white text-xs font-medium">{chatMsg.name}</div>
              {chatMsg.isJoined ? (
                <div className="text-red-400 text-xs ml-0.5">joined</div>
              ) : (
                <div className="text-gray-400 text-xs">{chatMsg.message}</div>
              )}
            </div>
            {index > 0 && (
              <div className="border-t border-gray-800/30 my-1"></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-screen relative overflow-hidden bg-black p-4">
      {/* Top Navbar */}
      <div className="absolute top-4 left-4 right-4 h-12 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-between px-4 rounded-lg">
        <div className="flex items-center">
          <Logo variant="light" size="sm" className="h-7" />
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden mr-2">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-full h-full object-cover" />
            </div>
            <span className="text-white text-sm font-medium mr-1">{userName}</span>
            <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path d="M6 9L10 13L14 9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="h-full pt-12">
        <div className="flex h-full gap-3">
          {/* Main livestream view */}
          <div 
            className={`h-full ${drawerVisible ? 'w-[69%]' : 'w-full'} transition-all duration-300 ease-in-out bg-black relative`}
            style={{
              borderTopRightRadius: drawerVisible ? '12px' : '0',
              borderBottomRightRadius: drawerVisible ? '12px' : '0',
              overflow: 'hidden'
            }}
          >
            {/* Streamer header */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden mr-2">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-full h-full object-cover" />
                </div>
                <span className="text-white text-sm font-medium">{userName}</span>
              </div>
              
              <div className="text-white text-lg font-medium">{streamTitle}</div>
              
              <div className="flex items-center">
                <div className="flex items-center bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 mr-2">
                  <div className="w-5 h-5 rounded-full bg-gray-100 mr-1.5 flex items-center justify-center overflow-hidden">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-white text-sm">{viewerCount}</span>
                </div>
                <button 
                  onClick={toggleDrawer} 
                  className={`w-8 h-8 flex items-center justify-center rounded ${drawerVisible ? 'text-white' : 'text-white'}`}
                >
                  {drawerVisible ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 17L11 12L16 7M8 17L3 12L8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 7L13 12L8 17M16 7L21 12L16 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
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
                    <div className="text-white text-lg">Initializing Stream...</div>
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
                    <div className="text-red-400 text-xl mb-4">Stream Error</div>
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
                    <div className="w-full h-full">
                      <img 
                        src={arenaImage} 
                        alt="Arena background" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    /* In a real implementation, this would be the StreamVideoComponent */
                    <img 
                      src={arenaImage} 
                      alt="Stream content" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}
              
              {/* Stream controls at bottom */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 z-20 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
                <button className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors">
                  <Mic className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors">
                  <Smile className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button 
                  className="w-10 h-10 bg-red-500/80 hover:bg-red-600/90 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              {/* Chat messages overlay */}
              <div className="absolute left-0 bottom-24 w-72 max-h-64 overflow-hidden px-4">
                {renderChatParticipants()}
              </div>
            </div>
          </div>
          
          {/* Right drawer for AI/Notepad */}
          <div 
            className={`h-full ${drawerVisible ? 'w-[30%] opacity-100' : 'w-0 opacity-0 pointer-events-none'} 
              transition-all duration-300 ease-in-out bg-zinc-900 overflow-hidden flex flex-col rounded-l-xl border-l border-zinc-800`}
          >
            {/* Drawer header with tabs */}
            <div className="flex items-center justify-between p-2 border-b border-zinc-800">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('vynaai')}
                  className={`px-3 py-1 text-xs font-medium rounded-full flex items-center ${
                    activeTab === 'vynaai' 
                      ? 'bg-zinc-800 text-white' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.93 6 15.5 7.57 15.5 9.5C15.5 11.43 13.93 13 12 13C10.07 13 8.5 11.43 8.5 9.5C8.5 7.57 10.07 6 12 6ZM12 20C9.97 20 8.1 19.33 6.66 18.12C7.55 16.8 9.08 16 12 16C14.92 16 16.45 16.8 17.34 18.12C15.9 19.33 14.03 20 12 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 5L21 8M21 5L18 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  VynaAI
                </button>
                <button
                  onClick={() => setActiveTab('notepad')}
                  className={`px-3 py-1 text-xs font-medium rounded-full flex items-center ${
                    activeTab === 'notepad' 
                      ? 'bg-zinc-800 text-white' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Notepad
                </button>
              </div>
              <button
                onClick={toggleDrawer}
                className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'vynaai' ? (
                <>
                {!showNewChat ? (
                  <div className="p-2">
                    <div className="text-white text-xs font-medium mb-2 uppercase">RECENTS</div>
                    <div>
                      {MOCK_RECENTS.map((question, index) => (
                        <div key={index}>
                          <div 
                            className="flex justify-between items-center p-2 rounded hover:bg-zinc-800/50 group transition-colors"
                          >
                            <div className="text-zinc-200 text-xs hover:text-white transition-colors truncate pr-2">
                              {question}
                            </div>
                            <button className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor"/>
                                <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="currentColor"/>
                                <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="currentColor"/>
                              </svg>
                            </button>
                          </div>
                          {index < MOCK_RECENTS.length - 1 && (
                            <div className="border-t border-zinc-800/40 mx-2"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 flex flex-col h-full">
                    <div className="flex items-center mb-4">
                      <button 
                        onClick={() => setShowNewChat(false)}
                        className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 mr-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <span className="text-white text-sm font-medium">New Chat</span>
                    </div>
                    
                    {/* Chat messages area */}
                    <div className="flex-1 overflow-y-auto mb-4">
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.93 6 15.5 7.57 15.5 9.5C15.5 11.43 13.93 13 12 13C10.07 13 8.5 11.43 8.5 9.5C8.5 7.57 10.07 6 12 6ZM12 20C9.97 20 8.1 19.33 6.66 18.12C7.55 16.8 9.08 16 12 16C14.92 16 16.45 16.8 17.34 18.12C15.9 19.33 14.03 20 12 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="text-white text-sm text-center mb-2">VynaAI Assistant</div>
                        <div className="text-zinc-400 text-xs text-center">Ask a question to get help from VynaAI during your livestream.</div>
                      </div>
                    </div>
                    
                    {/* Chat input */}
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ask a question..."
                        className="w-full px-4 py-2 bg-zinc-800 text-white placeholder-zinc-400 text-sm rounded-lg outline-none"
                      />
                      <button className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-700 text-white">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                </>
              ) : (
                <div className="p-3">
                  <div className="text-zinc-300 text-sm max-h-full overflow-auto">
                    <Teleprompter
                      text={teleprompterText || "Add notes here for your livestream. This is only visible to you."}
                      onClose={() => {}}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat input */}
            <div className="p-3 border-t border-zinc-800">
              {!showNewChat && activeTab === 'vynaai' && (
                <button
                  onClick={() => setShowNewChat(true)}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-xs flex items-center justify-center transition-colors"
                >
                  <span className="font-medium">+ New chat</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}