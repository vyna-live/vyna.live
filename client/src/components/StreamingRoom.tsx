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
        
        {/* Sidebar drawer */}
        {isDrawerOpen && (
          <div className="w-[320px] h-full bg-black/90 backdrop-blur-sm text-white border border-white/10 rounded-2xl overflow-hidden">
            {/* Tabs header - exactly matching design */}
            <div className="flex items-center justify-between px-2 py-3 border-b border-white/10 bg-transparent">
              <div className="flex gap-2 w-full items-center">
                {/* Double arrow expand icon - clickable to close drawer */}
                <button 
                  className="px-2 hover:bg-white/5 rounded-md"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <svg className="mr-1" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6M3 18L9 12L3 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                
                {/* VynaAI button */}
                <button
                  className={`px-3 py-1 rounded-md text-sm flex items-center ${
                    drawerContent === 'chat' 
                      ? 'bg-white text-black' 
                      : 'bg-transparent text-white/80'
                  }`}
                  onClick={() => setDrawerContent('chat')}
                >
                  <svg className="mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={drawerContent === 'chat' ? 'black' : 'white'} strokeWidth="1.5"/>
                  </svg>
                  VynaAI
                </button>
                
                {/* Notepad button */}
                <button
                  className={`px-3 py-1 rounded-md text-sm flex items-center ${
                    drawerContent === 'teleprompter' 
                      ? 'bg-white text-black' 
                      : 'bg-transparent text-white/80'
                  }`}
                  onClick={() => setDrawerContent('teleprompter')}
                >
                  <svg className="mr-1.5" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.6667 4.66667V12.25H2.33333V4.66667" stroke={drawerContent === 'teleprompter' ? 'black' : 'white'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12.8333 1.75H1.16667V4.66667H12.8333V1.75Z" stroke={drawerContent === 'teleprompter' ? 'black' : 'white'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5.83333 7H8.16667" stroke={drawerContent === 'teleprompter' ? 'black' : 'white'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Notepad
                </button>
              </div>
            </div>
            
            {/* Drawer content */}
            <div className="h-[calc(100%-48px)]">
              {drawerContent === 'chat' ? (
                messages.length > 0 ? (
                  // Chat history view - exactly matching design
                  <div className="flex flex-col h-full">
                    {/* RECENTS header */}
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-medium text-neutral-400 uppercase">RECENTS</h3>
                    </div>
                    
                    {/* Chat history items - exactly matching design */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="space-y-0">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="px-4 py-3 hover:bg-white/5 flex justify-between items-center border-b border-white/5">
                            <p className="text-sm text-white truncate">Who is the best CODM gamer in Nigeria...</p>
                            <button className="text-white/60 p-1">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="1" fill="currentColor"/>
                                <circle cx="6" cy="12" r="1" fill="currentColor"/>
                                <circle cx="18" cy="12" r="1" fill="currentColor"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* New chat button - exactly matching design */}
                    <div className="p-4">
                      <button 
                        className="w-full py-2 px-4 bg-white/10 hover:bg-white/15 rounded-lg text-sm flex items-center justify-center"
                        onClick={() => setMessages([])}
                      >
                        <svg className="mr-2" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 2.91666V11.0833" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2.91666 7H11.0833" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        New chat
                      </button>
                    </div>
                  </div>
                ) : (
                  // Empty state - exactly matching ainew.png
                  <div className="flex flex-col h-full">
                    {/* Empty state content */}
                    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
                      <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center mb-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" strokeWidth="1.5"/>
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-white mb-1">VynaAI</h3>
                      <p className="text-sm text-neutral-400 text-center">
                        Ask questions to quickly<br/>research topics while streaming
                      </p>
                    </div>
                    
                    {/* Example question */}
                    <div className="w-full px-4 pb-20">
                      <div className="py-2 px-4 rounded-lg bg-neutral-800/50 border border-neutral-700 text-sm text-white">
                        Who is the best gamer in Nigeria as of April 2025?
                      </div>
                      
                      {/* Input icons */}
                      <div className="flex mt-4 gap-4 items-center justify-center">
                        <button className="text-neutral-400 hover:text-white">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21.44 11.05L12.25 2.50001C12.1893 2.44582 12.1176 2.40281 12.0391 2.37372C11.9605 2.34463 11.8766 2.32999 11.7921 2.33062C11.7076 2.33125 11.624 2.34711 11.5459 2.37736C11.4678 2.40761 11.3968 2.45165 11.337 2.50661L9.89 3.95001C9.83323 4.00705 9.78834 4.07538 9.75815 4.15049C9.72796 4.2256 9.71317 4.30599 9.71458 4.38701C9.716 4.46803 9.73359 4.54773 9.76635 4.62158C9.79911 4.69544 9.84627 4.76194 9.905 4.81701L14.05 8.96001H4.01C3.87052 8.96001 3.73652 9.01589 3.63775 9.11466C3.53897 9.21344 3.48309 9.34744 3.48309 9.48692V11.5131C3.48309 11.6526 3.53897 11.7866 3.63775 11.8854C3.73652 11.9841 3.87052 12.04 4.01 12.04H14.05L9.91 16.19C9.85354 16.2458 9.80874 16.3128 9.77861 16.3873C9.74849 16.4619 9.73356 16.5424 9.73459 16.6235C9.73562 16.7045 9.75258 16.7846 9.78462 16.8583C9.81665 16.932 9.86323 16.9979 9.92116 17.0524L11.367 18.4983C11.4267 18.5533 11.4977 18.5973 11.5758 18.6276C11.6539 18.6578 11.7375 18.6737 11.822 18.6743C11.9065 18.6749 11.9904 18.6603 12.069 18.6312C12.1475 18.6021 12.2193 18.5591 12.28 18.505L21.45 9.95001C21.5689 9.85093 21.6572 9.72166 21.7054 9.57557C21.7537 9.42948 21.7603 9.27278 21.7246 9.12305C21.6889 8.97332 21.6121 8.83724 21.5026 8.73037C21.393 8.6235 21.2547 8.55003 21.105 8.52001C20.9525 8.48869 20.7938 8.50515 20.65 8.57001L21.44 11.05Z" fill="currentColor"/>
                          </svg>
                        </button>
                        <button className="text-neutral-400 hover:text-white">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 1C9.82441 1 7.69767 1.64514 5.88873 2.85384C4.07979 4.06253 2.66989 5.78049 1.83733 7.79048C1.00477 9.80047 0.786929 12.0122 1.21137 14.146C1.6358 16.2798 2.68345 18.2398 4.22183 19.7782C5.76021 21.3166 7.72022 22.3642 9.85401 22.7887C11.9878 23.2131 14.1995 22.9953 16.2095 22.1627C18.2195 21.3301 19.9375 19.9202 21.1462 18.1113C22.3549 16.3023 23 14.1756 23 12C22.9966 9.08368 21.8365 6.28778 19.7744 4.22563C17.7122 2.16347 14.9163 1.00344 12 1ZM12 20C9.43178 20 6.9681 18.9598 5.12348 17.1471C3.27885 15.3344 2 12.9956 2 10.5C2 8.9 2.38 7.4 3.07 6.09C3.74175 6.72316 4.5347 7.2161 5.40583 7.54442C6.27695 7.87274 7.20689 8.02962 8.14 8C7.40325 7.15629 6.8618 6.16166 6.55075 5.08567C6.2397 4.00969 6.1661 2.87642 6.33486 1.766C8.19498 1.87044 9.94851 2.56496 11.3624 3.74451C12.7763 4.92406 13.7693 6.52436 14.19 8.3C14.5049 6.98459 15.1324 5.75375 16.0181 4.71848C16.9037 3.6832 18.0225 2.87048 19.27 2.35C20.4032 3.86444 21.0028 5.68048 21 7.54C21.0017 8.63479 20.7497 9.71591 20.2619 10.6989C19.7742 11.682 19.0624 12.5418 18.1774 13.2103C17.2925 13.8788 16.2597 14.3402 15.1584 14.5642C14.0572 14.7881 12.9147 14.7689 11.82 14.508C12.1422 14.9937 12.3621 15.5354 12.47 16.1C12.6703 17.1373 12.5938 18.2052 12.2494 19.2062C11.9049 20.2072 11.3035 21.1092 10.5 21.83C11.6243 21.9497 12.7613 21.8455 13.8451 21.5243C14.9289 21.2032 15.9384 20.6718 16.8086 19.9659C17.6789 19.2599 18.392 18.3938 18.9042 17.4178C19.4164 16.4418 19.717 15.3775 19.79 14.289C20.5332 13.0976 20.9767 11.7597 21.09 10.381C21.269 10.92 21.358 11.474 21.358 12.027C21.359 14.6525 20.3101 17.1722 18.4407 19.0417C16.5712 20.9111 14.0515 21.96 11.426 21.959C7.974 21.959 4.91 19.937 3.267 16.995C4.19309 18.5562 5.53389 19.8332 7.15316 20.69C8.77243 21.5468 10.6016 21.9512 12.448 21.859C11.2555 21.5195 10.1848 20.8736 9.31912 19.9908C8.45345 19.108 7.81942 18.0253 7.48 16.826C7.00047 15.1438 7.16276 13.3528 7.937 11.778C9.06403 12.8657 10.5006 13.5594 12.042 13.75C13.5834 13.9406 15.1473 13.6161 16.476 12.827C16.918 12.537 17.325 12.195 17.69 11.806C16.8876 14.9696 14.678 17.6287 11.69 19C13.2962 19.7299 15.0867 19.9736 16.8285 19.6937C18.5703 19.4137 20.1817 18.6242 21.44 17.438C20.5746 18.9161 19.2809 20.1244 17.7022 20.9075C16.1235 21.6906 14.3311 22.0174 12.54 21.851L12 20Z" fill="currentColor"/>
                          </svg>
                        </button>
                        <button className="text-neutral-400 hover:text-white">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M12 10V18M12 10L8 14M12 10L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 4V6.5M16 4V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 4V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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