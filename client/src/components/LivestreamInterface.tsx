import { useState, useEffect, useCallback } from "react";
import { BrainCircuit, Mic, Video, Monitor, Volume2, X, Clock, Loader2 } from "lucide-react";
import Teleprompter from "./Teleprompter";
import GradientText from "./GradientText";
import Logo from "./Logo";
import StreamVideo from "./StreamVideo";
import "./StreamStyles.css";

interface LivestreamInterfaceProps {
  initialText?: string;
}

export default function LivestreamInterface({ initialText = "" }: LivestreamInterfaceProps) {
  const [teleprompterVisible, setTeleprompterVisible] = useState(false);
  const [teleprompterText, setTeleprompterText] = useState(initialText);
  const [streamTime, setStreamTime] = useState("00:00:00");
  const [viewerCount, setViewerCount] = useState(Math.floor(Math.random() * 100) + 100);
  
  // GetStream state
  const [streamApiKey, setStreamApiKey] = useState<string>("");
  const [streamToken, setStreamToken] = useState<string>("");
  const [isStreamActive, setIsStreamActive] = useState<boolean>(false);
  const [userId] = useState<string>(`user-${Math.random().toString(36).substring(2, 9)}`);
  const [callId] = useState<string>(`livestream-${Date.now()}`);
  const [userName] = useState<string>("Livestreamer");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch the Stream API key and generate a token
  useEffect(() => {
    const initializeStream = async () => {
      try {
        setIsLoading(true);
        
        // Get API key from our backend
        const keyResponse = await fetch('/api/stream/key');
        if (!keyResponse.ok) {
          throw new Error('Failed to get Stream API key');
        }
        
        const keyData = await keyResponse.json();
        setStreamApiKey(keyData.apiKey);
        
        // Generate a token
        const tokenResponse = await fetch('/api/stream/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            userName,
          }),
        });
        
        if (!tokenResponse.ok) {
          throw new Error('Failed to generate Stream token');
        }
        
        const tokenData = await tokenResponse.json();
        setStreamToken(tokenData.token);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing stream:', err);
        setError('Failed to initialize streaming service');
        setIsLoading(false);
      }
    };
    
    initializeStream();
  }, [userId, userName]);
  
  // Simulate streaming time counter
  useEffect(() => {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    
    const interval = setInterval(() => {
      seconds++;
      if (seconds >= 60) {
        seconds = 0;
        minutes++;
        if (minutes >= 60) {
          minutes = 0;
          hours++;
        }
      }
      
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setStreamTime(formattedTime);
      
      // Randomly update viewer count occasionally
      if (Math.random() < 0.1) {
        setViewerCount(prev => prev + Math.floor(Math.random() * 5) - 2);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const toggleTeleprompter = useCallback(() => {
    setTeleprompterVisible(prev => !prev);
  }, []);
  
  // Start the livestream
  const startLivestream = useCallback(async () => {
    try {
      if (!streamApiKey || !streamToken) {
        throw new Error('Stream credentials not available');
      }
      
      // Create a livestream call
      const response = await fetch('/api/stream/livestream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId,
          userId,
          token: streamToken,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create livestream');
      }
      
      setIsStreamActive(true);
    } catch (err) {
      console.error('Error starting livestream:', err);
      setError('Failed to start the livestream');
    }
  }, [streamApiKey, streamToken, callId, userId]);
  
  // End the livestream
  const endLivestream = useCallback(() => {
    setIsStreamActive(false);
  }, []);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-gradient-to-br from-[#15162c] to-[#1a1b33]">
      {/* Livestream header */}
      <div className="absolute top-0 left-0 right-0 h-16 glassmorphic flex items-center justify-between px-6 z-10">
        <div className="flex items-center">
          <Logo size="sm" variant="light" />
          <div className="h-6 mx-3 border-r border-white/20"></div>
          <GradientText 
            text="LIVE STREAM" 
            preset="earthy"
            className="text-base font-bold" 
            typingSpeed={70}
            showCursor={false}
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-black/30 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
            <span className="text-white text-sm">{viewerCount} viewers</span>
          </div>
          
          <div className="flex items-center bg-black/30 px-3 py-1 rounded-full">
            <Clock className="w-4 h-4 text-white mr-2" />
            <span className="text-white text-sm">{streamTime}</span>
          </div>
        </div>
      </div>
    
      {/* Livestream content */}
      <div 
        className={`transition-all duration-300 ease-in-out h-full ${
          teleprompterVisible ? "w-[70%]" : "w-full"
        }`}
      >
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-10 w-10 text-[#A67D44] animate-spin mx-auto mb-3" />
              <p className="text-[#CDBCAB] text-lg">Initializing stream...</p>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mx-auto mb-4">
                <span className="text-[#EFE9E1] text-2xl">!</span>
              </div>
              <h3 className="text-xl font-medium text-[#CDBCAB] mb-2">Stream Error</h3>
              <p className="text-[hsl(var(--ai-text-secondary))] mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] rounded-lg text-[#EFE9E1] hover:shadow-md transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : isStreamActive ? (
          <div className="w-full h-full p-0 md:p-4 flex items-center justify-center">
            <div className="relative w-full h-full rounded-lg overflow-hidden">
              <StreamVideo 
                apiKey={streamApiKey}
                token={streamToken}
                userId={userId}
                callId={callId}
                userName={userName}
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#5D1C34] via-[#A67D44] to-[#899481] flex items-center justify-center animate-pulse mb-2 mx-auto">
                  <Video className="h-10 w-10 text-[#EFE9E1]" />
                </div>
                <div className="absolute -bottom-1 right-1/2 transform translate-x-1/2 bg-[#5D1C34] px-3 py-0.5 rounded-full text-xs font-medium animate-pulse">
                  LIVE
                </div>
              </div>
              
              <GradientText 
                text="Ready to Start Streaming" 
                preset="warm"
                className="text-3xl font-bold mb-3" 
                typingSpeed={50}
                showCursor={false}
              />
              
              <p className="text-gray-300 max-w-md mx-auto mb-8">
                Click the Start Stream button below to begin. Use the teleprompter button to view your script.
              </p>
              
              <button 
                onClick={startLivestream}
                className="px-6 py-3 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] hover:from-[#B68D54] hover:to-[#6D2C44] rounded-full text-[#EFE9E1] shadow-lg hover:shadow-xl transition-all"
              >
                START STREAM
              </button>
            </div>
          </div>
        )}
        
        {/* Stream controls (only show when not streaming through GetStream) */}
        {!isStreamActive && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 glassmorphic p-3 rounded-full flex items-center space-x-4 shadow-lg">
            <button className="w-12 h-12 bg-[#11100F]/80 hover:bg-[#11100F] rounded-full flex items-center justify-center transition-colors border border-[#CDBCAB]/20">
              <Mic className="w-5 h-5 text-[#CDBCAB]" />
            </button>
            <button className="w-12 h-12 bg-[#11100F]/80 hover:bg-[#11100F] rounded-full flex items-center justify-center transition-colors border border-[#CDBCAB]/20">
              <Video className="w-5 h-5 text-[#CDBCAB]" />
            </button>
            <button className="w-12 h-12 bg-[#11100F]/80 hover:bg-[#11100F] rounded-full flex items-center justify-center transition-colors border border-[#CDBCAB]/20">
              <Monitor className="w-5 h-5 text-[#CDBCAB]" />
            </button>
            <button className="w-12 h-12 bg-[#11100F]/80 hover:bg-[#11100F] rounded-full flex items-center justify-center transition-colors border border-[#CDBCAB]/20">
              <Volume2 className="w-5 h-5 text-[#CDBCAB]" />
            </button>
            {isStreamActive ? (
              <button 
                onClick={endLivestream}
                className="w-28 h-12 bg-gradient-to-r from-[#5D1C34] to-[#A67D44] hover:from-[#6D2C44] hover:to-[#B68D54] rounded-full flex items-center justify-center shadow-lg transition-colors"
              >
                <span className="text-[#EFE9E1] font-medium">END STREAM</span>
              </button>
            ) : (
              <button 
                onClick={startLivestream}
                className="w-28 h-12 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] hover:from-[#B68D54] hover:to-[#6D2C44] rounded-full flex items-center justify-center shadow-lg transition-colors"
              >
                <span className="text-[#EFE9E1] font-medium">START STREAM</span>
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* AI button (fixed position) */}
      <button 
        onClick={toggleTeleprompter}
        className={`absolute bottom-24 right-6 z-10 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] hover:from-[#B68D54] hover:to-[#6D2C44] transition-all shadow-lg p-3 rounded-full ${
          teleprompterVisible ? 'right-[32%]' : 'right-6'
        }`}
      >
        <BrainCircuit className="h-6 w-6 text-[#EFE9E1]" />
      </button>
      
      {/* Teleprompter panel */}
      {teleprompterVisible && (
        <div className="absolute top-0 right-0 h-full w-[30%] bg-[#16171d]/90 backdrop-blur-md shadow-2xl z-20">
          <div className="h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <GradientText 
                  text="AI Teleprompter" 
                  preset="earthy"
                  className="text-xl font-bold" 
                  typingSpeed={50}
                  showCursor={false}
                />
                <div className="mt-1">
                  <span className="text-xs bg-gradient-to-r from-[#5D1C34] to-[#A67D44] text-[#EFE9E1] px-2 py-0.5 rounded-full">
                    STREAMER ONLY VIEW
                  </span>
                </div>
              </div>
              
              <button 
                onClick={toggleTeleprompter}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-[#A67D44] to-[#5D1C34] text-[#EFE9E1] transition-all hover:shadow-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-[#0f1015] rounded-lg p-4">
              <Teleprompter 
                text={teleprompterText || "No teleprompter text available. Try asking the AI assistant for help with creating a script for your livestream."} 
                onClose={() => setTeleprompterVisible(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}