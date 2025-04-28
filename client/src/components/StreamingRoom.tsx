import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AgoraVideo from './AgoraVideo';
import ChatInterface from './ChatInterface';
import InputArea from './InputArea';
import GradientText from './GradientText';
import { MessageType } from '../types/chat';
import vpwwLogo from '@/assets/vpww.png';

interface StreamingRoomProps {
  channelName: string;
  title?: string;
  description?: string;
  rtmpDestinations?: string[];
  initialText?: string;
  onEnd?: () => void;
}

export default function StreamingRoom({
  channelName,
  title,
  description,
  rtmpDestinations = [],
  initialText = '',
  onEnd
}: StreamingRoomProps) {
  // State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<'chat' | 'teleprompter'>('chat');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [teleprompterText, setTeleprompterText] = useState(initialText);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Message handlers
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage: MessageType = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Send to AI and get response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage: MessageType = {
        id: Date.now().toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        hasInfoGraphic: !!data.infoGraphic,
        infoGraphicData: data.infoGraphic
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Teleprompter handlers
  const handleTeleprompterClick = (text: string) => {
    setTeleprompterText(text);
    setDrawerContent('teleprompter');
    
    toast({
      title: 'Added to teleprompter',
      description: 'The text has been added to your teleprompter',
    });
  };
  
  const handleCopyTeleprompter = () => {
    navigator.clipboard.writeText(teleprompterText);
    
    toast({
      title: 'Copied to clipboard',
      description: 'Teleprompter text has been copied to clipboard',
    });
  };
  
  const handleClearTeleprompter = () => {
    setTeleprompterText('');
    
    toast({
      title: 'Teleprompter cleared',
      description: 'Teleprompter text has been cleared',
    });
  };
  
  // Add streaming-mode class to body when component mounts
  useEffect(() => {
    document.body.classList.add('streaming-mode');
    
    return () => {
      // Remove streaming-mode class from body when component unmounts
      document.body.classList.remove('streaming-mode');
    };
  }, []);

  return (
    <div style={{margin: '8px'}} className="h-[calc(100vh-16px)] w-[calc(100vw-16px)] overflow-hidden bg-black relative rounded-2xl">
      {/* Top header row with Vyna logo and user with blur effect - transparent background */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 py-2 flex items-center justify-between bg-transparent rounded-t-2xl">
        <div className="flex items-center">
          <img src={vpwwLogo} alt="Vyna.live" className="h-9" />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full overflow-hidden">
            <img src="https://i.pravatar.cc/100" alt="Divine Samuel" className="h-full w-full object-cover" />
          </div>
          <span className="text-white text-xs font-normal">Divine Samuel</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 6L8 10L12 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      
      {/* Second row with user info, channel name and viewer count - transparent background */}
      <div className="absolute top-[48px] left-0 right-0 z-30 px-4 py-2 flex items-center justify-between bg-transparent">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full overflow-hidden">
              <img src="https://i.pravatar.cc/100" alt="Divine Samuel" className="h-full w-full object-cover" />
            </div>
            <span className="text-white text-xs font-normal">Divine Samuel</span>
          </div>
          
          <div className="flex items-center mx-2">
            <span className="text-white/40 text-xs">•</span>
          </div>
        </div>

        {/* Center title - exactly as shown in the design */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <span className="text-white text-xs font-medium">Jaja Games</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 20.25C3 16.6587 7.02944 13.75 12 13.75C16.9706 13.75 21 16.6587 21 20.25V20.5C21 20.7761 20.7761 21 20.5 21H3.5C3.22386 21 3 20.7761 3 20.5V20.25Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-white text-[11px]">123.5k</span>
          </div>
          
          {!isDrawerOpen && (
            <button 
              className="flex items-center justify-center hover:bg-white/10 p-1 rounded-md"
              onClick={() => setIsDrawerOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 6L9 12L15 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 6L3 12L9 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main content area with video */}
      <div className="flex h-full gap-4">
        {/* Main video area */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out relative overflow-hidden rounded-2xl",
            isDrawerOpen 
              ? "w-[calc(100%-336px)]" // 320px width + 16px gap
              : "w-full"
          )}
        >
          {/* Video stream - full screen */}
          <div className="absolute inset-0 overflow-hidden">
            <AgoraVideo 
              channelName={channelName}
              mode="livestream"
              showControls={false}
              enableMultiplatform={rtmpDestinations.length > 0}
              rtmpDestinations={rtmpDestinations}
              onError={(error) => {
                toast({
                  title: 'Streaming Error',
                  description: error,
                  variant: 'destructive',
                });
                
                if (onEnd) {
                  onEnd();
                }
              }}
              className="h-full w-full object-cover"
            />
          </div>
          
          {/* Chat messages bottom left - exactly matching bottom.png */}
          <div className="absolute left-4 bottom-24 flex flex-col gap-2 z-10 max-w-xs">
            <div className="flex items-start gap-2 animate-slide-up">
              <div className="h-6 w-6 rounded-full overflow-hidden bg-orange-500">
                <img src="https://i.pravatar.cc/100?img=20" alt="User" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">Innocent Dive</span>
                <span className="text-xs text-white/90">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2 animate-slide-up animation-delay-100">
              <div className="h-6 w-6 rounded-full overflow-hidden bg-gray-600">
                <img src="https://i.pravatar.cc/100?img=30" alt="User" className="h-full w-full object-cover opacity-80" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">Godknows Ukari</span>
                <span className="text-xs text-white/90">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2 animate-slide-up animation-delay-200">
              <div className="h-6 w-6 rounded-full overflow-hidden bg-gradient-to-r from-yellow-500 to-pink-500">
                <img src="https://i.pravatar.cc/100?img=40" alt="User" className="h-full w-full object-cover opacity-90" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">Godknows Ukari</span>
                <span className="text-xs text-white/90">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-center mt-1 animate-slide-up animation-delay-300">
              <span className="text-red-500 mr-1 text-xs">●</span>
              <span className="text-xs text-white font-medium">Goddess</span>
              <span className="text-xs text-white/70 ml-1">joined</span>
            </div>
          </div>
          
          {/* Control panel at bottom - exactly matching bottom.png */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex items-center gap-1 bg-[#333333]/80 backdrop-blur-md rounded-full px-1 py-1">
              {/* Microphone icon - outlined */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z" stroke="white" strokeWidth="1.5"/>
                  <path d="M8 11C8 13.2091 9.79086 15 12 15C14.2091 15 16 13.2091 16 11M6 11H18M12 15V19M8 23H16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              
              {/* Camera icon - outlined */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="6" width="15" height="12" rx="2" stroke="white" strokeWidth="1.5"/>
                  <path d="M17 12L22 9V15L17 12Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {/* Emoji icon - outlined */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
                  <path d="M7 14C8.5 16 9.5 17 12 17C14.5 17 15.5 16 17 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="9" cy="10" r="1" fill="white"/>
                  <circle cx="15" cy="10" r="1" fill="white"/>
                </svg>
              </button>
              
              {/* Screen sharing icon - outlined */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="white" strokeWidth="1.5"/>
                  <path d="M8 12L12 8M12 8L16 12M12 8V16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {/* Text/Info icon (T) - outlined */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
                  <path d="M8 8H16M12 8V16M8 16H16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              
              {/* End call button - X icon in red */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Sidebar drawer - matching exactly with the design images */}
        {isDrawerOpen && (
          <div className="w-[320px] h-full bg-[#121212] text-white rounded-2xl overflow-hidden">
            {/* Tabs header - exactly matching design */}
            <div className="flex items-center px-2 py-3 border-b border-white/10 bg-[#191919]">
              <div className="flex gap-2 w-full items-center">
                {/* Double arrow expand icon - exactly as in the image */}
                <button 
                  className="px-2"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <svg className="mr-1" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6M3 18L9 12L3 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                
                {/* VynaAI button - exactly matching the designs */}
                <button
                  className={`px-3 py-1 rounded-md text-sm flex items-center ${
                    drawerContent === 'chat' 
                      ? 'bg-white text-black' 
                      : 'bg-transparent text-white/80'
                  }`}
                  onClick={() => setDrawerContent('chat')}
                >
                  <svg className="mr-1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={drawerContent === 'chat' ? 'black' : 'white'} strokeWidth="1.5"/>
                  </svg>
                  VynaAI
                </button>
                
                {/* Notepad button - exactly matching the designs */}
                <button
                  className={`px-3 py-1 rounded-md text-sm flex items-center ${
                    drawerContent === 'teleprompter' 
                      ? 'bg-white text-black' 
                      : 'bg-transparent text-white/80'
                  }`}
                  onClick={() => setDrawerContent('teleprompter')}
                >
                  <svg className="mr-1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 4h12v16H6zm0 0h12v16H6z" stroke={drawerContent === 'teleprompter' ? 'black' : 'white'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 8h6M9 12h6M9 16h4" stroke={drawerContent === 'teleprompter' ? 'black' : 'white'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Notepad
                </button>
              </div>
            </div>
            
            {/* Drawer content */}
            <div className="h-[calc(100%-48px)]">
              {drawerContent === 'chat' ? (
                messages.length > 0 ? (
                  // Chat history view - EXACTLY matching the provided design image
                  <div className="flex flex-col h-full bg-[#121212]">
                    {/* RECENTS header */}
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-medium text-neutral-400 uppercase">RECENTS</h3>
                    </div>
                    
                    {/* Chat history items - exactly matching design image */}
                    <div className="flex-1 overflow-y-auto bg-[#121212]">
                      <div className="space-y-0">
                        {Array.from({ length: 11 }).map((_, i) => (
                          <div key={i} className="px-4 py-3 hover:bg-[#1A1A1A] flex justify-between items-center bg-[#121212]">
                            <p className="text-sm text-white truncate">Who is the best CODM gamer in Nigeria...</p>
                            <button className="text-white/60 p-1">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                                <circle cx="6" cy="12" r="1.5" fill="currentColor"/>
                                <circle cx="18" cy="12" r="1.5" fill="currentColor"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* New chat button - exactly matching design image */}
                    <div className="p-4 bg-[#121212]">
                      <button 
                        className="w-full py-2 px-4 bg-[#1E1E1C] hover:bg-[#252525] rounded-lg text-sm text-white flex items-center justify-center"
                        onClick={() => setMessages([])}
                      >
                        <span className="mr-1">+</span>
                        New chat
                      </button>
                    </div>
                  </div>
                ) : (
                  // Empty state - exactly matching ainew.png
                  <div className="flex flex-col h-full bg-[#121212]">
                    {/* Empty state content */}
                    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
                      <div className="w-12 h-12 rounded-full bg-[#333333] flex items-center justify-center mb-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" strokeWidth="1.5"/>
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-white mb-1">VynaAI</h3>
                      <p className="text-sm text-neutral-400 text-center">
                        Ask questions to quickly<br/>research topics while streaming
                      </p>
                    </div>
                    
                    {/* Example question - exactly as shown in the design */}
                    <div className="w-full px-4 pb-10">
                      <div className="py-2 px-4 rounded-md bg-[#1A1A1A] text-sm text-white">
                        Who is the best gamer in Nigeria as of April 2025?
                      </div>
                      
                      {/* Input icons - exactly as in the image */}
                      <div className="flex mt-4 gap-6 items-center justify-center">
                        <button className="text-neutral-400 hover:text-white">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 11H3M21 3H3M21 19H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                        <button className="text-neutral-400 hover:text-white">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M4 4V20M20 4V20" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col h-full">
                  {/* Teleprompter content */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    {teleprompterText ? (
                      <div className="text-xl font-medium leading-relaxed">
                        <GradientText 
                          text={teleprompterText} 
                          preset="warm" 
                          showCursor={true}
                          typingSpeed={0}
                        />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                            <svg width="28" height="28" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.6667 4.66667V12.25H2.33333V4.66667" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12.8333 1.75H1.16667V4.66667H12.8333V1.75Z" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M5.83333 7H8.16667" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <h4 className="text-lg font-medium mb-2">No content yet</h4>
                          <p className="text-sm text-neutral-500">
                            Click the "Add to Teleprompter" button in a chat to add content here.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Teleprompter actions */}
                  {teleprompterText && (
                    <div className="p-4 border-t border-white/10 flex justify-end">
                      <button 
                        className="px-3 py-1.5 rounded-md border border-white/20 text-white text-sm mr-2 flex items-center"
                        onClick={handleClearTeleprompter}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Clear
                      </button>
                      <button 
                        className="px-3 py-1.5 rounded-md border border-white/20 text-white text-sm flex items-center"
                        onClick={handleCopyTeleprompter}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}