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
        className="space-y-1.5 overflow-y-auto max-h-full flex flex-col-reverse pb-2"
      >
        {chatMessages.map((chatMsg, index) => (
          <div key={index} className="flex items-center space-x-1.5 py-0.5 animate-slideInUp">
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
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden mr-2">
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
                <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden mr-2">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-full h-full object-cover" />
                </div>
                <span className="text-white font-medium">{userName}</span>
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
                      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
            </div>
            
            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'vynaai' ? (
                <div className="p-2">
                  <div className="text-white text-xs font-medium mb-2 uppercase">RECENTS</div>
                  <div className="space-y-1">
                    {MOCK_RECENTS.map((question, index) => (
                      <div 
                        key={index} 
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
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-xs flex items-center justify-center transition-colors"
              >
                <span className="font-medium">+ New chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}