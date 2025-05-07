import { useState } from "react";
import { useLocation } from "wouter";
import { Download, Sparkles, Paperclip, Mic, Image, Upload, Plus } from "lucide-react";
import Logo from "@/components/Logo";
import "./landing.css";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'vynaai' | 'notepad'>('vynaai');

  const handleLogin = () => {
    setLocation("/auth");
  };

  const handleExtensionDownload = () => {
    // Link to the extension download
    window.open("/browser-extension.zip", "_blank");
  };
  
  const switchTab = (tab: 'vynaai' | 'notepad') => {
    setActiveTab(tab);
  };

  return (
    <div className="landing-page flex flex-col min-h-screen bg-[#121212]">
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-[#121212] z-0 grid-background" />

      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between h-[70px] px-6 md:px-8 z-10 relative">
        <div className="flex items-center">
          <Logo size="md" />
        </div>
        <button 
          onClick={handleLogin}
          className="rounded-full px-4 py-1.5 text-white bg-[#252525] hover:bg-[#303030] transition-all text-sm font-medium"
        >
          Login
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-4 py-6 md:py-10 text-center z-10 relative">
        <h1 className="hero-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 max-w-4xl animate-fadeInUp">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#E5E5E5] to-[#FFFFFF]">Research first,</span>{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#DCC5A2] via-[#E5D5C2] to-[#FFFFFF]">go live next!</span>
        </h1>
        
        <p className="hero-text text-[#A5A5A5] max-w-lg mx-auto mb-8 text-base md:text-lg animate-fadeInUp delay-100">
          Start your own live stream with AI-powered research tools or join other creators' streams to learn and engage.
        </p>
        
        <button 
          onClick={handleExtensionDownload}
          className="button-hover-effect flex items-center gap-2 rounded-full px-7 py-3.5 bg-[#DCC5A2] text-[#121212] font-medium hover:bg-[#C6B190] transition-all shadow-md animate-fadeInUp delay-200 mb-12"
        >
          <Download size={18} />
          <span className="text-base">Download extension</span>
        </button>

        {/* AI Chat Panel */}
        <div className="max-w-2xl w-[95%] md:w-[85%] lg:w-[75%] xl:w-[65%] mx-auto z-10 animate-fadeInUp delay-200">
          <div className="bg-[#1E1E1E] rounded-2xl border border-[#333333] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm">
            {/* Tabs */}
            <div className="flex items-center px-4 py-3 bg-[#252525] border-b border-[#333333]">
              <button 
                className={`flex items-center gap-1.5 mr-2 px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'vynaai' ? 'bg-[#DCC5A2] text-[#121212] font-medium' : 'bg-transparent text-[#999999] hover:bg-[#333333] hover:text-white'}`}
                onClick={() => switchTab('vynaai')}
              >
                <Sparkles size={14} />
                <span>VynaAI</span>
              </button>
              <button 
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'notepad' ? 'bg-[#DCC5A2] text-[#121212] font-medium' : 'bg-transparent text-[#999999] hover:bg-[#333333] hover:text-white'}`}
                onClick={() => switchTab('notepad')}
              >
                <span>Notepad</span>
              </button>
              <div className="flex-1"></div>
              <button className="text-[#999999] hover:text-white p-1" aria-label="Expand">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>
            </div>
            
            {/* Content area - VynaAI */}
            {activeTab === 'vynaai' && (
              <div className="p-4 input-area">
                <div className="mb-4">
                  <textarea
                    placeholder="Ask your question"
                    className="w-full h-24 px-4 py-3 text-sm"
                  />
                </div>
                
                {/* Input controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-white opacity-70">
                    <button className="hover:text-[#DCC5A2] transition-colors" aria-label="Upload file">
                      <Paperclip size={18} />
                    </button>
                    <button className="hover:text-[#DCC5A2] transition-colors" aria-label="Record audio">
                      <Mic size={18} />
                    </button>
                    <button className="hover:text-[#DCC5A2] transition-colors" aria-label="Take photo">
                      <Image size={18} />
                    </button>
                  </div>
                  <button 
                    className="button-hover-effect rounded-full px-6 py-2 bg-[#DCC5A2] text-[#121212] font-medium flex items-center gap-1.5 hover:bg-[#C6B190] transition-all"
                    aria-label="Send message"
                  >
                    <span>Send</span>
                    <Upload size={14} className="transform rotate-90" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Content area - Notepad */}
            {activeTab === 'notepad' && (
              <div className="p-4 input-area">
                <div className="mb-4">
                  <textarea
                    placeholder="Type a note"
                    className="w-full h-24 px-4 py-3 text-sm"
                  />
                </div>
                
                {/* Input controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-white opacity-70">
                    <button className="hover:text-[#DCC5A2] transition-colors" aria-label="Upload file">
                      <Paperclip size={18} />
                    </button>
                    <button className="hover:text-[#DCC5A2] transition-colors" aria-label="Record audio">
                      <Mic size={18} />
                    </button>
                    <button className="hover:text-[#DCC5A2] transition-colors" aria-label="Take photo">
                      <Image size={18} />
                    </button>
                  </div>
                  <button 
                    className="button-hover-effect rounded-full px-6 py-2 bg-[#DCC5A2] text-[#121212] font-medium flex items-center gap-1.5 hover:bg-[#C6B190] transition-all"
                    aria-label="Add note"
                  >
                    <span>Add note</span>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}