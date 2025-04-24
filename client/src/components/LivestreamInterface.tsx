import { useState, useEffect } from "react";
import { BrainCircuit, Mic, Video, Monitor, Volume2, X, Clock } from "lucide-react";
import Teleprompter from "./Teleprompter";
import GradientText from "./GradientText";
import Logo from "./Logo";

interface LivestreamInterfaceProps {
  initialText?: string;
}

export default function LivestreamInterface({ initialText = "" }: LivestreamInterfaceProps) {
  const [teleprompterVisible, setTeleprompterVisible] = useState(false);
  const [teleprompterText, setTeleprompterText] = useState(initialText);
  const [streamTime, setStreamTime] = useState("00:00:00");
  const [viewerCount, setViewerCount] = useState(Math.floor(Math.random() * 100) + 100);
  
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
  
  const toggleTeleprompter = () => {
    setTeleprompterVisible(!teleprompterVisible);
  };

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
        {/* This would be replaced with actual video stream */}
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
              text="Your Livestream is Active" 
              preset="warm"
              className="text-3xl font-bold mb-3" 
              typingSpeed={50}
              showCursor={false}
            />
            
            <p className="text-gray-300 max-w-md mx-auto mb-8">
              This content is visible to your audience. Use the teleprompter button to view your script.
            </p>
            
            <div className="inline-block bg-black/30 px-6 py-3 rounded-xl border border-white/10">
              <p className="text-sm text-white/60">Open your streaming software and point it to:</p>
              <p className="text-lg font-mono mt-1 text-[hsl(var(--ai-teal))]">rtmp://vyna.live/stream/your-key</p>
            </div>
          </div>
        </div>
        
        {/* Stream controls */}
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
          <div className="w-28 h-12 bg-gradient-to-r from-[#5D1C34] to-[#A67D44] hover:from-[#6D2C44] hover:to-[#B68D54] rounded-full flex items-center justify-center shadow-lg transition-colors">
            <span className="text-[#EFE9E1] font-medium">END STREAM</span>
          </div>
        </div>
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
                  preset="cool"
                  className="text-xl font-bold" 
                  typingSpeed={50}
                  showCursor={false}
                />
                <div className="mt-1">
                  <span className="text-xs bg-[#5D1C34] text-[#EFE9E1] px-2 py-0.5 rounded-full">
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