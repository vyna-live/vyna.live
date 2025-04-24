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
            gradientFrom="from-red-500" 
            gradientTo="to-pink-500" 
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
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center animate-pulse mb-2 mx-auto">
                <Video className="h-10 w-10" />
              </div>
              <div className="absolute -bottom-1 right-1/2 transform translate-x-1/2 bg-red-600 px-3 py-0.5 rounded-full text-xs font-medium animate-pulse">
                LIVE
              </div>
            </div>
            
            <GradientText 
              text="Your Livestream is Active" 
              gradientFrom="from-blue-400" 
              gradientTo="to-purple-500" 
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
          <button className="w-12 h-12 bg-[hsl(var(--ai-card))] hover:bg-[hsl(var(--ai-card-glass))] rounded-full flex items-center justify-center transition-colors">
            <Mic className="w-5 h-5 text-[hsl(var(--ai-text-primary))]" />
          </button>
          <button className="w-12 h-12 bg-[hsl(var(--ai-card))] hover:bg-[hsl(var(--ai-card-glass))] rounded-full flex items-center justify-center transition-colors">
            <Video className="w-5 h-5 text-[hsl(var(--ai-text-primary))]" />
          </button>
          <button className="w-12 h-12 bg-[hsl(var(--ai-card))] hover:bg-[hsl(var(--ai-card-glass))] rounded-full flex items-center justify-center transition-colors">
            <Monitor className="w-5 h-5 text-[hsl(var(--ai-text-primary))]" />
          </button>
          <button className="w-12 h-12 bg-[hsl(var(--ai-card))] hover:bg-[hsl(var(--ai-card-glass))] rounded-full flex items-center justify-center transition-colors">
            <Volume2 className="w-5 h-5 text-[hsl(var(--ai-text-primary))]" />
          </button>
          <div className="w-28 h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors">
            <span className="text-white font-medium">END STREAM</span>
          </div>
        </div>
      </div>
      
      {/* AI button (fixed position) */}
      <button 
        onClick={toggleTeleprompter}
        className={`absolute bottom-24 right-6 z-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 transition-all shadow-lg p-3 rounded-full ${
          teleprompterVisible ? 'right-[32%]' : 'right-6'
        }`}
      >
        <BrainCircuit className="h-6 w-6 text-white" />
      </button>
      
      {/* Teleprompter panel */}
      {teleprompterVisible && (
        <div className="absolute top-0 right-0 h-full w-[30%] bg-[#16171d]/90 backdrop-blur-md shadow-2xl z-20">
          <div className="h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <GradientText 
                  text="AI Teleprompter" 
                  gradientFrom="from-blue-400" 
                  gradientTo="to-teal-400" 
                  className="text-xl font-bold" 
                  typingSpeed={50}
                  showCursor={false}
                />
                <div className="mt-1">
                  <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                    STREAMER ONLY VIEW
                  </span>
                </div>
              </div>
              
              <button 
                onClick={toggleTeleprompter}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[hsl(var(--ai-card))] hover:bg-[hsl(var(--ai-card-glass))] text-[hsl(var(--ai-text-secondary))] transition-colors"
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