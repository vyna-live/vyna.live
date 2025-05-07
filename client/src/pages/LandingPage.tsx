import { useState } from "react";
import { useLocation } from "wouter";
import { Download, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";
import "./landing.css";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    setLocation("/auth");
  };

  const handleExtensionDownload = () => {
    // Link to the extension download
    window.open("/browser-extension.zip", "_blank");
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
              <button className="flex items-center gap-1.5 mr-2 px-4 py-1.5 text-sm font-medium rounded-md bg-[#DCC5A2] text-[#121212]">
                <Sparkles size={14} />
                <span>VynaAI</span>
              </button>
              <button className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md bg-transparent text-[#999999] hover:bg-[#333333] hover:text-white transition-colors">
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
            
            {/* Chat area */}
            <div className="p-4">
              <div className="mb-3">
                <input 
                  type="text"
                  placeholder="Ask your question"
                  className="w-full bg-[#262626] text-[#CCCCCC] rounded-lg px-4 py-3 outline-none text-sm border border-[#333333] focus:border-[#DCC5A2] focus:ring-1 focus:ring-[#DCC5A2]/20 transition-all"
                />
              </div>
              
              {/* Input controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[#777777]">
                  <button className="hover:text-[#DCC5A2] p-1 transition-colors" aria-label="Upload file">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </button>
                  <button className="hover:text-[#DCC5A2] p-1 transition-colors" aria-label="Take photo">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </button>
                  <button className="hover:text-[#DCC5A2] p-1 transition-colors" aria-label="Record audio">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  </button>
                </div>
                <button 
                  className="button-hover-effect rounded-md px-4 py-1.5 bg-[#DCC5A2] text-[#121212] font-medium flex items-center gap-1 hover:bg-[#C6B190] transition-all shadow-sm"
                  aria-label="Send message"
                >
                  <span>Send</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}