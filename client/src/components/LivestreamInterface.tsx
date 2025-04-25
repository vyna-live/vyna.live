import { useState, useEffect, useCallback } from "react";
import { Mic, Camera, Smile, Square, ChevronLeft, MoreVertical } from "lucide-react";
import Teleprompter from "./Teleprompter";
import Logo from "./Logo";
import StreamVideoComponent from "./StreamVideo";
import { useStreamVideoContext } from "../providers/StreamVideoProvider";
import { DeviceSettings } from "@stream-io/video-react-sdk";

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

export default function LivestreamInterface({ initialText = "" }: LivestreamInterfaceProps) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'vynaai' | 'notepad'>('vynaai');
  const [teleprompterText, setTeleprompterText] = useState(initialText);
  const [viewerCount, setViewerCount] = useState("123.5k");
  
  // Get stream client from provider context
  const { client, isInitialized, error: streamError } = useStreamVideoContext();
  
  // Additional GetStream state specific to this component
  const [isStreamActive, setIsStreamActive] = useState<boolean>(true); // Set to true for demo
  const [callId] = useState<string>(`livestream-${Date.now()}`);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
          }
        }
      } catch (err) {
        console.error('Error initializing stream:', err);
        setError('Failed to initialize streaming service');
      }
    };
    
    getStreamCredentials();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Handle any errors from the stream context
  useEffect(() => {
    if (streamError) {
      setError(streamError.message);
    }
  }, [streamError]);
  
  // Toggle the side drawer
  const toggleDrawer = useCallback(() => {
    setDrawerVisible(prev => !prev);
  }, []);

  // Render chat participants
  const renderChatParticipants = () => {
    return (
      <div className="space-y-2 mt-4">
        <div className="flex items-center space-x-2 py-1">
          <div className="w-6 h-6 rounded-full bg-orange-500 overflow-hidden"></div>
          <div className="text-white text-sm">Innocent Dive</div>
          <div className="text-gray-400 text-xs">How far my guys wetin dey happen</div>
        </div>
        
        <div className="flex items-center space-x-2 py-1">
          <div className="w-6 h-6 rounded-full bg-blue-500 overflow-hidden flex items-center justify-center">
            <span className="text-xs text-white font-bold">G</span>
          </div>
          <div className="text-white text-sm">Godknows Ukari</div>
          <div className="text-gray-400 text-xs">How far my guys wetin dey happen</div>
        </div>
        
        <div className="flex items-center space-x-2 py-1">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 overflow-hidden flex items-center justify-center">
            <span className="text-xs text-white font-bold">G</span>
          </div>
          <div className="text-white text-sm">Godknows Ukari</div>
          <div className="text-gray-400 text-xs">How far my guys wetin dey happen</div>
        </div>
        
        <div className="flex items-center space-x-2 py-1">
          <div className="w-6 h-6 rounded-full bg-red-500 overflow-hidden flex items-center justify-center">
            <span className="text-xs text-white">❤️</span>
          </div>
          <div className="text-white text-sm">Goddess</div>
          <div className="text-red-400 text-xs ml-1">joined</div>
        </div>
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
          <div className={`h-full ${drawerVisible ? 'w-[70%]' : 'w-full'} transition-all duration-300 ease-in-out bg-black relative`}>
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
                  className={`w-8 h-8 flex items-center justify-center rounded ${drawerVisible ? 'text-white bg-gray-600' : 'text-white'}`}
                >
                  {drawerVisible ? <ChevronLeft className="w-5 h-5" /> : <MoreVertical className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* Stream content */}
            <div className="w-full h-full">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : error ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <div className="text-white text-center">
                    <div className="text-xl mb-4">Error: {error}</div>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-white text-black rounded-md"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                // Stream video content
                <div className="w-full h-full">
                  {/* Placeholder for StreamVideoComponent - this is where the actual video goes */}
                  <div className="w-full h-full bg-black">
                    {/* In a real implementation, this would be the StreamVideoComponent */}
                    <StreamVideoComponent 
                      apiKey={streamApiKey}
                      token={streamToken}
                      userId={userId}
                      callId={callId}
                      userName={userName}
                    />
                  </div>
                </div>
              )}
              
              {/* Stream controls at bottom */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 z-20">
                <button className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-white">
                  <Mic className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-white">
                  <Camera className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-white">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white">
                  <Square className="w-5 h-5" />
                </button>
              </div>
              
              {/* Chat messages overlay */}
              <div className="absolute left-0 bottom-24 w-72 max-h-64 overflow-hidden px-4">
                {renderChatParticipants()}
              </div>
            </div>
          </div>
          
          {/* Right drawer for AI/Notepad */}
          {drawerVisible && (
            <div className="w-[30%] h-full bg-zinc-900 overflow-hidden flex flex-col">
              {/* Drawer header with tabs */}
              <div className="flex items-center justify-between p-3 border-b border-zinc-800">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('vynaai')}
                    className={`px-3 py-1 text-sm rounded ${
                      activeTab === 'vynaai' 
                        ? 'bg-zinc-800 text-white' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    VynaAI
                  </button>
                  <button
                    onClick={() => setActiveTab('notepad')}
                    className={`px-3 py-1 text-sm rounded ${
                      activeTab === 'notepad' 
                        ? 'bg-zinc-800 text-white' 
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
                          <div className="text-zinc-200 text-sm hover:text-white transition-colors">
                            {question}
                          </div>
                          <button className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <div className="text-zinc-400 text-sm">
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
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-white text-sm flex items-center justify-center"
                >
                  <span>+ New chat</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}