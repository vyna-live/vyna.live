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
  const [teleprompterText, setTeleprompterText] = useState(initialText);
  const [viewerCount, setViewerCount] = useState("123.5k");
  const [chatMessages, setChatMessages] = useState<typeof CHAT_MESSAGES>(CHAT_MESSAGES.slice(0, 4));
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
        setChatMessages(prev => [...prev, CHAT_MESSAGES[messageIndex]]);
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
        className="space-y-2 overflow-y-auto max-h-full flex flex-col-reverse pb-2"
      >
        {chatMessages.map((chatMsg, index) => (
          <div key={index} className="flex items-center space-x-2 py-1 animate-slideInUp">
            <div className={`w-6 h-6 rounded-full ${chatMsg.color} overflow-hidden flex items-center justify-center`}>
              {chatMsg.name.charAt(0)}
            </div>
            <div className="text-white text-sm">{chatMsg.name}</div>
            {chatMsg.isJoined ? (
              <div className="text-red-400 text-xs ml-1">joined</div>
            ) : (
              <div className="text-gray-400 text-xs">{chatMsg.message}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-screen relative overflow-hidden bg-black">
      {/* Top Navbar */}
      <div className="absolute top-0 left-0 right-0 h-12 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-between px-4">
        <div className="flex items-center">
          <Logo variant="light" size="sm" className="h-7" />
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden mr-2"></div>
            <span className="text-white font-medium mr-1">{userName}</span>
            <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="h-full pt-12">
        <div className="flex h-full">
          {/* Main livestream view */}
          <div 
            className={`h-full ${drawerVisible ? 'w-[70%]' : 'w-full'} transition-all duration-300 ease-in-out bg-black relative`}
            style={{
              borderTopRightRadius: drawerVisible ? '12px' : '0',
              borderBottomRightRadius: drawerVisible ? '12px' : '0',
              overflow: 'hidden'
            }}
          >
            {/* Streamer header */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden mr-2"></div>
                <span className="text-white font-medium">{userName}</span>
              </div>
              
              <div className="text-white text-lg font-medium">{streamTitle}</div>
              
              <div className="flex items-center">
                <div className="flex items-center bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 mr-2">
                  <span className="text-white">{viewerCount}</span>
                </div>
                <button 
                  onClick={toggleDrawer} 
                  className={`w-8 h-8 flex items-center justify-center rounded ${drawerVisible ? 'text-white bg-gray-700' : 'text-white'}`}
                >
                  {drawerVisible ? (
                    <ChevronRight className="w-5 h-5" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 11C10.5523 11 11 10.5523 11 10C11 9.44772 10.5523 9 10 9C9.44772 9 9 9.44772 9 10C9 10.5523 9.44772 11 10 11Z" fill="currentColor"/>
                      <path d="M3 11C3.55228 11 4 10.5523 4 10C4 9.44772 3.55228 9 3 9C2.44772 9 2 9.44772 2 10C2 10.5523 2.44772 11 3 11Z" fill="currentColor"/>
                      <path d="M17 11C17.5523 11 18 10.5523 18 10C18 9.44772 17.5523 9 17 9C16.4477 9 16 9.44772 16 10C16 10.5523 16.4477 11 17 11Z" fill="currentColor"/>
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
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 z-20">
                <button className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors">
                  <Camera className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button 
                  className="w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <div className="flex items-center justify-between p-3 border-b border-zinc-800">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('vynaai')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    activeTab === 'vynaai' 
                      ? 'bg-zinc-800 text-white font-medium' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  VynaAI
                </button>
                <button
                  onClick={() => setActiveTab('notepad')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    activeTab === 'notepad' 
                      ? 'bg-zinc-800 text-white font-medium' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Notepad
                </button>
              </div>
            </div>
            
            {/* Drawer content */}
            <div className="flex-1 overflow-auto">
              {activeTab === 'vynaai' ? (
                <div className="p-3">
                  <div className="text-white text-sm font-medium mb-2">RECENTS</div>
                  <div className="space-y-2">
                    {MOCK_RECENTS.map((question, index) => (
                      <div key={index} className="flex justify-between group">
                        <div className="text-zinc-200 text-sm hover:text-white transition-colors truncate pr-2">
                          {question}
                        </div>
                        <button className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
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
              <button
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-sm flex items-center justify-center transition-colors"
              >
                <span>+ New chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}