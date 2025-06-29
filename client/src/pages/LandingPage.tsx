import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Download, Sparkles, Paperclip, Mic, Image, Upload, Plus } from "lucide-react";
import Logo from "@/components/Logo";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLoginNotification } from "@/hooks/useLoginNotification";
import "./landing.css";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { showLoginRequiredNotification } = useLoginNotification();
  const [activeTab, setActiveTab] = useState<'vynaai' | 'notepad'>('vynaai');
  const [inputValue, setInputValue] = useState("");
  
  // No need for useEffect with direct image badge

  const handleLogin = () => {
    setLocation("/auth");
  };

  const handleExtensionDownload = (e: React.MouseEvent) => {
    // Prevent the default behavior
    e.preventDefault();
    
    // Show a toast notification that the feature is coming soon
    toast({
      title: "Coming Soon",
      description: "Browser extension download will be available soon.",
    });
  };
  
  const switchTab = (tab: 'vynaai' | 'notepad') => {
    setActiveTab(tab);
    
    // If the user clicks on the notepad tab, we'll store an empty note in sessionStorage
    // and redirect to the notepad page when they submit
  };
  
  const handleExpandView = () => {
    // Check if user is logged in
    if (!isAuthenticated && !isLoading) {
      showLoginRequiredNotification("Please log in to access the full features. Create an account to get started.");
      return;
    }
    
    // Navigate to the appropriate expanded view based on the active tab
    if (activeTab === 'vynaai') {
      setLocation('/ai-chat');
    } else {
      // For notepad, store the current input if any
      if (inputValue.trim() !== "") {
        sessionStorage.setItem("notepad_content", inputValue);
      }
      setLocation('/notepad');
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;
    
    // Check if user is logged in
    if (!isAuthenticated && !isLoading) {
      showLoginRequiredNotification("Please log in to use VynaAI. Create an account to access all features.");
      return;
    }
    
    // Store the question in sessionStorage
    sessionStorage.setItem("vynaai_question", inputValue);
    
    // Redirect to AI chat page
    setLocation("/ai-chat");
  };
  
  const handleAddNote = () => {
    if (inputValue.trim() === "") return;
    
    // Check if user is logged in
    if (!isAuthenticated && !isLoading) {
      showLoginRequiredNotification("Please log in to save your notes. Create an account to access all features.");
      return;
    }
    
    // Store the note in sessionStorage
    sessionStorage.setItem("notepad_content", inputValue);
    
    // Redirect to notepad page
    setLocation("/notepad");
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleNoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  return (
    <div className="landing-page flex flex-col min-h-screen bg-[#121212]">
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-[#121212] z-0 grid-background" />

      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between h-[70px] px-6 md:px-8 z-[2] relative">
        <div className="flex items-center">
          <Logo size="md" />
        </div>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-24 h-8 bg-[#252525] rounded-full animate-pulse"></div>
          ) : isAuthenticated ? (
            <UserAvatar />
          ) : (
            <button 
              onClick={handleLogin}
              className="rounded-full px-4 py-1.5 text-white bg-[#252525] hover:bg-[#303030] transition-all text-sm font-medium"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-4 py-6 md:py-10 text-center z-[1] relative">
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
        <div className="w-[660px] max-w-full mx-auto z-[1] animate-fadeInUp delay-200 px-2 sm:px-4">
          <div className="bg-[#1E1E1E] rounded-2xl border border-[#333333] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm h-auto sm:h-[204px]">
            {/* Tabs */}
            <div className="flex flex-wrap items-center px-2 py-1.5 bg-[#252525] border-b border-[#333333]">
              <button 
                className={`flex items-center gap-1 mr-2 px-2 py-0.5 text-xs rounded-md transition-colors ${activeTab === 'vynaai' ? 'bg-[#DCC5A2] text-[#121212] font-medium' : 'bg-transparent text-[#999999] hover:bg-[#333333] hover:text-white'}`}
                onClick={() => switchTab('vynaai')}
              >
                <Sparkles size={12} />
                <span>VynaAI</span>
              </button>
              <button 
                className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-md transition-colors ${activeTab === 'notepad' ? 'bg-[#DCC5A2] text-[#121212] font-medium' : 'bg-transparent text-[#999999] hover:bg-[#333333] hover:text-white'}`}
                onClick={() => switchTab('notepad')}
              >
                <span>Notepad</span>
              </button>
              <div className="flex-1"></div>
              <div className="flex items-center">
                <div className="hidden sm:block mr-2">
                  <a 
                    href="/subscription" 
                    className="inline-flex items-center h-5 px-1.5 py-0 rounded-md bg-[#121212] hover:bg-[#1a1a1a] transition-colors"
                  >
                    <span className="text-xs text-white font-normal">Free plan</span>
                    <span className="text-xs mx-1 text-gray-400">·</span>
                    <span className="text-xs text-[#4C9EFF] hover:underline">Upgrade</span>
                  </a>
                </div>
                <button 
                  onClick={handleExpandView}
                  className="text-[#999999] hover:text-white p-1 min-w-[44px] min-h-[44px] flex items-center justify-center" 
                  aria-label="Expand"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content area - VynaAI */}
            {activeTab === 'vynaai' && (
              <div className="px-2 pt-2 pb-2 input-area flex flex-col">
                <div className="flex-grow mb-1">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Ask your question"
                    className="w-full h-20 px-3 py-2 text-sm rounded-lg"
                  />
                </div>
                
                {/* Input controls */}
                <div className="flex items-center justify-between input-toolbar">
                  <div className="flex items-center gap-1 sm:gap-2 text-white opacity-70">
                    <input 
                      type="file"
                      id="vynaai-file-upload"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setInputValue(prev => `${prev}\n\n[File: ${file.name}]`);
                          // Reset input so the same file can be selected again
                          e.target.value = '';
                        }
                      }}
                    />
                    <button 
                      className="hover:text-[#DCC5A2] transition-colors action-button flex items-center justify-center w-7 h-7" 
                      aria-label="Upload file"
                      onClick={() => document.getElementById('vynaai-file-upload')?.click()}
                    >
                      <Paperclip size={16} />
                    </button>
                    
                    <button 
                      className="hover:text-[#DCC5A2] transition-colors action-button flex items-center justify-center w-7 h-7" 
                      aria-label="Record audio"
                      onClick={() => {
                        setInputValue(prev => `${prev}\n\n[Audio Recording]`);
                        toast({
                          title: 'Audio recording',
                          description: 'Audio recording is available in the full chat view.',
                        });
                      }}
                    >
                      <Mic size={16} />
                    </button>
                    
                    <input 
                      type="file"
                      id="vynaai-image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setInputValue(prev => `${prev}\n\n[Image: ${file.name}]`);
                          // Reset input so the same file can be selected again
                          e.target.value = '';
                        }
                      }}
                    />
                    <button 
                      className="hover:text-[#DCC5A2] transition-colors action-button flex items-center justify-center w-7 h-7" 
                      aria-label="Take photo"
                      onClick={() => document.getElementById('vynaai-image-upload')?.click()}
                    >
                      <Image size={16} />
                    </button>
                  </div>
                  <button 
                    onClick={handleSendMessage}
                    className="button-hover-effect rounded-lg px-3 py-1 flex items-center justify-center bg-[#DCC5A2] text-[#121212] font-medium gap-1 hover:bg-[#C6B190] transition-all text-xs min-w-[50px]"
                    style={{ height: '28px' }}
                    aria-label="Send message"
                  >
                    <span>Send</span>
                    <Upload size={12} className="transform rotate-90" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Content area - Notepad */}
            {activeTab === 'notepad' && (
              <div className="px-2 pt-2 pb-2 input-area flex flex-col">
                <div className="flex-grow mb-1">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleNoteKeyDown}
                    placeholder="Type a note"
                    className="w-full h-20 px-3 py-2 text-sm rounded-lg"
                  />
                </div>
                
                {/* Input controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 sm:gap-2 text-white opacity-70">
                    <input 
                      type="file"
                      id="notepad-file-upload"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setInputValue(prev => `${prev}\n\n[File: ${file.name}]`);
                          // Reset input so the same file can be selected again
                          e.target.value = '';
                        }
                      }}
                    />
                    <button 
                      className="hover:text-[#DCC5A2] transition-colors flex items-center justify-center w-7 h-7" 
                      aria-label="Upload file"
                      onClick={() => document.getElementById('notepad-file-upload')?.click()}
                    >
                      <Paperclip size={16} />
                    </button>
                    
                    <button 
                      className="hover:text-[#DCC5A2] transition-colors flex items-center justify-center w-7 h-7" 
                      aria-label="Record audio"
                      onClick={() => {
                        setInputValue(prev => `${prev}\n\n[Audio Recording]`);
                        toast({
                          title: 'Audio recording',
                          description: 'Audio recording is available in the full notepad view.',
                        });
                      }}
                    >
                      <Mic size={16} />
                    </button>
                    
                    <input 
                      type="file"
                      id="notepad-image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setInputValue(prev => `${prev}\n\n[Image: ${file.name}]`);
                          // Reset input so the same file can be selected again
                          e.target.value = '';
                        }
                      }}
                    />
                    <button 
                      className="hover:text-[#DCC5A2] transition-colors flex items-center justify-center w-7 h-7" 
                      aria-label="Take photo"
                      onClick={() => document.getElementById('notepad-image-upload')?.click()}
                    >
                      <Image size={16} />
                    </button>
                  </div>
                  <button 
                    className="button-hover-effect rounded-lg px-3 py-1 flex items-center justify-center bg-[#DCC5A2] text-[#121212] font-medium gap-1 hover:bg-[#C6B190] transition-all text-xs min-w-[50px]"
                    style={{ height: '28px' }}
                    aria-label="Add note"
                    onClick={handleAddNote}
                  >
                    <span>Add note</span>
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Replit Badge - Bottom Right */}
      <div 
        className="replit-badge-container" 
        style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px',
          zIndex: 50 
        }}
      >
        <a href="https://replit.com" target="_blank" rel="noopener noreferrer">
          <img
            src="https://replit.com/badge?caption=Built%20With%20Replit"
            alt="Built with Replit"
            className="replit-badge"
            style={{ display: 'block' }}
          />
        </a>
      </div>
    </div>
  );
}