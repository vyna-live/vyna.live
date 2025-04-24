import { useState } from "react";
import { BrainCircuit } from "lucide-react";
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
    <div className="w-full h-screen relative overflow-hidden bg-black">
      {/* Livestream content */}
      <div 
        className={`transition-all duration-300 ease-in-out h-full ${
          teleprompterVisible ? "w-[70%]" : "w-full"
        }`}
      >
        {/* This would be replaced with actual video stream */}
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-white text-center">
            <h2 className="text-2xl mb-4">Livestream Preview</h2>
            <p className="text-gray-400">Your livestream content will appear here</p>
          </div>
        </div>
        
        {/* Stream controls (example) */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 px-4 py-2 bg-black/60 rounded-full">
          <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
          <div className="w-24 h-10 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">LIVE</span>
          </div>
          <div className="w-16 h-10 flex items-center justify-center">
            <span className="text-white">01:30</span>
          </div>
        </div>
      </div>
      
      {/* AI button (fixed position) */}
      <button 
        onClick={toggleTeleprompter}
        className={`absolute bottom-20 right-6 z-10 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 ${
          teleprompterVisible ? 'right-[32%]' : 'right-6'
        }`}
      >
        <BrainCircuit className="h-6 w-6" />
      </button>
      
      {/* Teleprompter panel */}
      {teleprompterVisible && (
        <div className="absolute top-0 right-0 h-full w-[30%] bg-black/20 backdrop-blur-lg border-l border-white/10 shadow-2xl z-20">
          <div className="h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">AI Teleprompter</h3>
              <button 
                onClick={toggleTeleprompter}
                className="text-white/80 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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