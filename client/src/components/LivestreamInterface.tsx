import { useState } from "react";
import { BrainCircuit, Mic, Video, Monitor, Volume2, X } from "lucide-react";
import Teleprompter from "./Teleprompter";

interface LivestreamInterfaceProps {
  initialText?: string;
}

export default function LivestreamInterface({ initialText = "" }: LivestreamInterfaceProps) {
  const [teleprompterVisible, setTeleprompterVisible] = useState(false);
  const [teleprompterText, setTeleprompterText] = useState(initialText);
  
  const toggleTeleprompter = () => {
    setTeleprompterVisible(!teleprompterVisible);
  };

  return (
    <div className="w-full h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 to-blue-900">
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
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center animate-pulse-subtle mb-2 mx-auto">
                <Video className="h-10 w-10" />
              </div>
              <div className="absolute -bottom-1 right-1/2 transform translate-x-1/2 bg-red-600 px-3 py-0.5 rounded-full text-xs font-medium">
                LIVE
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">Your Livestream</h2>
            <p className="text-gray-300 max-w-md mx-auto">Your livestream content is displayed here for viewers. This screen is visible to your audience.</p>
          </div>
        </div>
        
        {/* Stream controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 glassmorphic p-2 rounded-full flex items-center space-x-3">
          <button className="w-10 h-10 bg-[hsl(var(--ai-card))] rounded-full flex items-center justify-center">
            <Mic className="w-5 h-5 text-[hsl(var(--ai-text-primary))]" />
          </button>
          <button className="w-10 h-10 bg-[hsl(var(--ai-card))] rounded-full flex items-center justify-center">
            <Video className="w-5 h-5 text-[hsl(var(--ai-text-primary))]" />
          </button>
          <button className="w-10 h-10 bg-[hsl(var(--ai-card))] rounded-full flex items-center justify-center">
            <Monitor className="w-5 h-5 text-[hsl(var(--ai-text-primary))]" />
          </button>
          <button className="w-10 h-10 bg-[hsl(var(--ai-card))] rounded-full flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-[hsl(var(--ai-text-primary))]" />
          </button>
          <div className="w-24 h-10 bg-red-600 rounded-full flex items-center justify-center ai-glow">
            <span className="text-white font-medium">LIVE</span>
          </div>
          <div className="w-16 h-10 flex items-center justify-center">
            <span className="text-white">01:30:45</span>
          </div>
        </div>
      </div>
      
      {/* AI button (fixed position) */}
      <button 
        onClick={toggleTeleprompter}
        className={`absolute bottom-20 right-6 z-10 ai-primary-button ai-glow p-3 shadow-lg transition-all duration-300 ${
          teleprompterVisible ? 'right-[32%]' : 'right-6'
        }`}
      >
        <BrainCircuit className="h-6 w-6" />
      </button>
      
      {/* Teleprompter panel */}
      {teleprompterVisible && (
        <div className="absolute top-0 right-0 h-full w-[30%] glassmorphic shadow-2xl z-20">
          <div className="h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[hsl(var(--ai-text-primary))]">
                AI Teleprompter
                <span className="ml-2 text-xs bg-[hsl(var(--ai-accent))] text-white px-2 py-0.5 rounded-full">
                  STREAMER ONLY
                </span>
              </h3>
              <button 
                onClick={toggleTeleprompter}
                className="ai-action-button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <Teleprompter 
                text={teleprompterText || "No teleprompter text available. Try asking the AI assistant for help."} 
                onClose={() => setTeleprompterVisible(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}