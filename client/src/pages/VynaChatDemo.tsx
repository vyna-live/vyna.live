import React, { useState } from 'react';
import VynaChat from '../components/VynaChat';

const VynaChatDemo: React.FC = () => {
  const [showChat, setShowChat] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggleChat = () => {
    setShowChat(!showChat);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      {/* Background video or image */}
      <div className="absolute inset-0 bg-gradient-to-br from-black to-neutral-900">
        <img 
          src="https://images.unsplash.com/photo-1636488747424-16c9a03baeaf?q=80&w=1912&auto=format&fit=crop"
          alt="Streaming Background" 
          className="w-full h-full object-cover opacity-40"
        />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-white text-xl font-bold">Vyna<span className="text-purple-400">.live</span></h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 rounded-full overflow-hidden">
            <img src="https://i.pravatar.cc/100" alt="Divine Samuel" className="h-full w-full object-cover" />
          </div>
          <span className="text-white text-sm">Divine Samuel</span>
        </div>
      </div>

      {/* Streaming Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-3xl font-bold mb-8">Live Streaming Demo</h2>
          <button 
            onClick={handleToggleChat}
            className="px-4 py-2 bg-purple-600 rounded-lg text-white"
          >
            {showChat ? 'Hide VynaAI Chat' : 'Show VynaAI Chat'}
          </button>
        </div>
      </div>
      
      {/* Viewers count */}
      <div className="absolute left-4 bottom-4 z-10 flex items-center bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full text-white">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
          <path d="M12 5.25C4.5 5.25 1.5 12 1.5 12C1.5 12 4.5 18.75 12 18.75C19.5 18.75 22.5 12 22.5 12C22.5 12 19.5 5.25 12 5.25Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-white text-sm font-medium">123.5k</span>
      </div>

      {/* Chat interface */}
      {showChat && (
        <div 
          className={`absolute right-4 top-16 bottom-4 z-20 transition-all duration-300 ${
            isMinimized 
              ? 'w-12' 
              : 'w-[320px]'
          }`}
        >
          {isMinimized ? (
            <button 
              className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg"
              onClick={handleToggleMinimize}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2L16 12L8 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : (
            <div className="w-full h-full rounded-xl overflow-hidden shadow-xl">
              <VynaChat 
                onClose={handleToggleChat} 
                onToggleMinimize={handleToggleMinimize}
                isMinimized={isMinimized}
              />
            </div>
          )}
        </div>
      )}

      {/* Stream controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center gap-1 bg-[#333333]/80 backdrop-blur-md rounded-full px-1 py-1">
          <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z" stroke="white" strokeWidth="1.5"/>
              <path d="M8 11C8 13.2091 9.79086 15 12 15C14.2091 15 16 13.2091 16 11M6 11H18M12 15V19M8 23H16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          
          <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="6" width="15" height="12" rx="2" stroke="white" strokeWidth="1.5"/>
              <path d="M17 12L22 9V15L17 12Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
              <path d="M7 14C8.5 16 9.5 17 12 17C14.5 17 15.5 16 17 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="10" r="1" fill="white"/>
              <circle cx="15" cy="10" r="1" fill="white"/>
            </svg>
          </button>
          
          <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="white" strokeWidth="1.5"/>
              <path d="M8 12L12 8M12 8L16 12M12 8V16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
              <path d="M8 8H16M12 8V16M8 16H16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          
          <button className="h-10 w-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VynaChatDemo;