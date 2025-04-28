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

  return (
    <div className="h-screen w-screen overflow-hidden bg-black relative">
      {/* Top header row with Vyna logo and user - exactly matching navbar.png */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 py-2 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center">
          <svg width="64" height="32" viewBox="0 0 118 43" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60.8957 16.2253C57.2842 16.2253 54.3574 18.9924 54.3574 22.3994C54.3574 25.8064 57.2842 28.5735 60.8957 28.5735C64.5071 28.5735 67.4339 25.8064 67.4339 22.3994C67.4339 18.9924 64.5071 16.2253 60.8957 16.2253ZM60.8957 25.3253C59.1453 25.3253 57.7331 24.0047 57.7331 22.3994C57.7331 20.7942 59.1453 19.4736 60.8957 19.4736C62.646 19.4736 64.0582 20.7942 64.0582 22.3994C64.0582 24.0047 62.646 25.3253 60.8957 25.3253Z" fill="white"/>
            <path d="M26.4831 5.99771C26.4831 9.27176 23.7535 11.8624 20.3427 11.8624C16.932 11.8624 14.2023 9.27176 14.2023 5.99771C14.2023 2.72365 16.932 0.133057 20.3427 0.133057C23.7535 0.133057 26.4831 2.72365 26.4831 5.99771Z" fill="white"/>
            <path d="M40.2874 22.3992C40.2874 32.5819 31.3951 40.841 20.3428 40.841C9.29047 40.841 0.398193 32.5819 0.398193 22.3992C0.398193 19.2842 1.30639 16.3587 2.89528 13.8279C5.38736 17.2871 9.37964 19.4734 13.9597 19.4734C14.7023 19.4734 15.4449 19.4113 16.1516 19.2842C15.1773 20.3944 14.558 21.8209 14.558 23.3735C14.558 27.104 17.8362 30.1556 21.8425 30.1556C25.8488 30.1556 29.127 27.104 29.127 23.3735C29.127 21.4606 28.3485 19.7274 27.0627 18.4068C27.9193 17.1483 28.4137 15.6318 28.4137 13.9867C28.4137 10.4916 25.9217 7.58818 22.5828 6.97894C23.2895 6.72592 24.0679 6.59882 24.8823 6.59882C28.1605 6.59882 30.9261 8.75723 31.9003 11.8001C35.1785 14.246 37.4073 18.0906 37.4073 22.3992C37.4073 22.4613 37.4073 22.5233 37.4073 22.5854C38.6572 20.7762 39.2765 18.5557 39.2765 16.1455C39.2765 10.6808 34.5603 6.22453 28.7374 6.22453C28.0666 6.22453 27.4274 6.28659 26.7925 6.39774C26.9319 6.27451 27.0582 6.14205 27.1844 6.0096C29.127 4.1521 30.3048 1.57974 30.3048 -0.196777H20.3428C20.3428 -0.196777 10.3807 -0.196777 10.3807 -0.196777C10.3807 1.57974 11.5585 4.1521 13.5011 6.0096C13.6274 6.14205 13.7537 6.27451 13.8931 6.39774C13.2582 6.28659 12.6189 6.22453 11.9481 6.22453C6.1253 6.22453 1.40905 10.6808 1.40905 16.1455C1.40905 18.6142 2.14043 20.8968 3.4984 22.6489C3.4984 22.5647 3.46143 22.4835 3.46143 22.3992C3.46143 13.5004 10.9845 6.34542 20.3428 6.34542C29.7011 6.34542 37.2242 13.5004 37.2242 22.3992C37.2242 31.2979 29.7011 38.4529 20.3428 38.4529C10.9845 38.4529 3.46143 31.2979 3.46143 22.3992C3.46143 22.3992 3.42862 22.2721 3.42862 22.2101C1.85323 24.7408 0.945042 27.6663 0.945042 30.7813C0.945042 36.2461 5.56127 40.7023 11.3841 40.7023C12.0549 40.7023 12.6942 40.6402 13.329 40.5291C13.1896 40.6523 13.0633 40.7847 12.9371 40.9172C10.9944 42.7747 9.81667 45.347 9.81667 47.1235H19.7787C19.7787 47.1235 29.7407 47.1235 29.7407 47.1235C29.7407 45.347 28.563 42.7747 26.6203 40.9172C26.4941 40.7847 26.3678 40.6523 26.2284 40.5291C26.8632 40.6402 27.5025 40.7023 28.1734 40.7023C30.6113 40.7023 32.8291 39.8063 34.5245 38.329C37.9159 35.2774 40.2874 31.092 40.2874 26.3964C40.2874 24.9998 40.0668 23.6651 39.6632 22.3992H40.2874V22.3992Z" fill="white"/>
            <path d="M75.8591 7.22388H86.8281V10.8189H82.0304V28.3859H78.6943V10.8189H75.8591V7.22388Z" fill="white"/>
            <path d="M89.4268 12.8823H92.6007V16.0065C93.3804 14.0072 94.931 12.7579 97.2671 12.7579C100.278 12.7579 102.427 14.6075 102.427 18.4272V28.3859H99.2527V19.1795C99.2527 16.7586 98.223 15.5093 96.1994 15.5093C94.1398 15.5093 92.6007 17.1091 92.6007 19.7074V28.3859H89.4268V12.8823Z" fill="white"/>
            <path d="M105.835 7.22388H109.009V13.7381C109.962 13.0613 111.236 12.7579 112.573 12.7579C116.559 12.7579 118.99 15.6338 118.99 20.7792C118.99 26.0107 116.374 28.5102 112.573 28.5102C111.048 28.5102 109.679 28.0829 108.695 27.1026V28.3859H105.835V7.22388ZM112.011 25.6329C114.097 25.6329 115.816 23.7833 115.816 20.7792C115.816 17.775 114.004 15.6342 111.979 15.6342C110.582 15.6342 109.554 16.2354 109.009 17.097V23.7077C109.585 24.6638 110.644 25.6329 112.011 25.6329Z" fill="white"/>
            <path d="M51.1835 7.22388V19.7074C51.1835 24.0889 48.8115 28.5102 43.2738 28.5102C39.3232 28.5102 36.8271 26.0107 36.8271 22.6289H40.0011C40.0011 24.3898 41.3212 25.6329 43.2738 25.6329C46.0729 25.6329 48.0094 23.3721 48.0094 19.7074V7.22388H51.1835Z" fill="white"/>
          </svg>
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
      
      {/* Second row with user info, channel name and viewer count - exactly matching navbar.png */}
      <div className="absolute top-[48px] left-0 right-0 z-30 px-4 py-2 flex items-center justify-between">
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

        {/* Center title */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <span className="text-white text-xs font-medium">Jaja Games</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 14C14 11.2385 11.3137 9 8 9C4.68629 9 2 11.2385 2 14V15C2 15.5523 2.44772 16 3 16H13C13.5523 16 14 15.5523 14 15V14Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-white text-[11px]">123.5k</span>
          </div>
          
          {!isDrawerOpen && (
            <button 
              className="flex items-center justify-center"
              onClick={() => setIsDrawerOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L3 7L10 12" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 2L-2 7L5 12" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main content area with video */}
      <div className="flex h-full">
        {/* Main video area */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out relative h-full overflow-hidden",
            isDrawerOpen 
              ? "w-[calc(100%-320px)]" 
              : "w-full"
          )}
        >
          {/* Video stream - full screen */}
          <div className="absolute inset-0">
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
          
          {/* Chat messages bottom left - exactly as in 1st view.png */}
          <div className="absolute left-4 bottom-20 flex flex-col gap-2 z-10 max-w-xs">
            <div className="flex items-start gap-2 animate-slide-up">
              <div className="h-6 w-6 rounded-full overflow-hidden bg-orange-500/80">
                <img src="https://i.pravatar.cc/100?img=20" alt="User" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">Innocent Dive</span>
                <span className="text-xs text-white/80">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2 animate-slide-up animation-delay-100">
              <div className="h-6 w-6 rounded-full overflow-hidden">
                <img src="https://i.pravatar.cc/100?img=30" alt="User" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">Godknows Ukari</span>
                <span className="text-xs text-white/80">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2 animate-slide-up animation-delay-200">
              <div className="h-6 w-6 rounded-full overflow-hidden bg-gradient-to-r from-yellow-500 to-pink-500">
                <img src="https://i.pravatar.cc/100?img=40" alt="User" className="h-full w-full object-cover opacity-90" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">Godknows Ukari</span>
                <span className="text-xs text-white/80">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-center mt-1 animate-slide-up animation-delay-300">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span className="text-xs text-white font-medium">Goddess</span>
              </div>
              <span className="text-xs text-white/70 ml-1">joined</span>
            </div>
          </div>
          
          {/* Control panel at bottom - exactly as in 1st view.png */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-1.5 py-1.5">
              <button className="h-9 w-9 flex items-center justify-center rounded-full text-white hover:bg-white/10">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 1.66669C8.66583 1.66669 7.59768 2.69752 7.59768 3.99252V10.4C7.59768 11.695 8.66583 12.7258 10 12.7258C11.3342 12.7258 12.4023 11.695 12.4023 10.4V3.99252C12.4023 2.69752 11.3342 1.66669 10 1.66669Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.8333 8.33331V10.4C15.8333 13.6975 13.2641 16.25 10 16.25C6.73584 16.25 4.16666 13.6975 4.16666 10.4V8.33331" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 16.25V18.3333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button className="h-9 w-9 flex items-center justify-center rounded-full text-white hover:bg-white/10">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2.5" y="5" width="15" height="10" rx="1.5" stroke="white" strokeWidth="1.5"/>
                </svg>
              </button>
              
              <button className="h-9 w-9 flex items-center justify-center rounded-full text-white hover:bg-white/10">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="7.5" stroke="white" strokeWidth="1.5"/>
                  <circle cx="10" cy="10" r="3.5" stroke="white" strokeWidth="1.5"/>
                </svg>
              </button>
              
              <button className="h-9 w-9 flex items-center justify-center rounded-full text-white hover:bg-white/10">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.3667 3.84169C16.9411 3.41587 16.4356 3.07803 15.8795 2.84757C15.3233 2.6171 14.7271 2.49847 14.125 2.49847C13.5229 2.49847 12.9267 2.6171 12.3705 2.84757C11.8144 3.07803 11.3089 3.41587 10.8833 3.84169L10 4.72502L9.11666 3.84169C8.25692 2.98195 7.09085 2.49892 5.875 2.49892C4.65915 2.49892 3.49307 2.98195 2.63333 3.84169C1.7736 4.70143 1.29056 5.8675 1.29056 7.08335C1.29056 8.2992 1.7736 9.46528 2.63333 10.325L3.51666 11.2084L10 17.6917L16.4833 11.2084L17.3667 10.325C17.7925 9.89943 18.1303 9.39392 18.3608 8.83779C18.5913 8.28166 18.7099 7.68541 18.7099 7.08335C18.7099 6.4813 18.5913 5.88505 18.3608 5.32892C18.1303 4.77279 17.7925 4.26728 17.3667 3.84169V3.84169Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button className="h-9 w-9 flex items-center justify-center rounded-full text-white hover:bg-white/10">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 14.7917L4.85667 17.4958L5.83917 11.7625L1.67834 7.71249L7.42834 6.87916L10 1.66666L12.5717 6.87916L18.3217 7.71249L14.1608 11.7625L15.1433 17.4958L10 14.7917Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button className="h-9 w-9 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 5L15 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Sidebar drawer */}
        {isDrawerOpen && (
          <div className="w-[320px] h-full bg-black text-white border-l border-white/10">
            {/* Tabs header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded-md text-sm flex items-center ${
                    drawerContent === 'chat' 
                      ? 'bg-white text-black' 
                      : 'bg-transparent text-white border border-white/20'
                  }`}
                  onClick={() => setDrawerContent('chat')}
                >
                  <svg className="mr-1.5" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 11.6667L6.65 11.41L4.66667 10.2083V11.6667H4.08333V2.91666C4.08335 2.76196 4.14481 2.61358 4.25421 2.50418C4.36361 2.39478 4.51198 2.33333 4.66669 2.33333C4.8214 2.33333 4.96977 2.39478 5.07917 2.50418C5.18857 2.61358 5.25002 2.76196 5.25003 2.91666V2.91666L8.16669 2.91666C8.3214 2.91666 8.46977 2.97816 8.57917 3.08754C8.68857 3.19694 8.75003 3.34531 8.75003 3.5C8.75003 3.65471 8.6886 3.80308 8.57919 3.91247C8.46979 4.02187 8.32142 4.08333 8.16672 4.08333L5.25003 4.08333V9.33333L6.65 10.1733L8.05 9.33333V8.45833H8.75003V9.33333L7 10.5L6.65 10.7508V11.6667H7Z" fill={drawerContent === 'chat' ? 'black' : 'white'}/>
                  </svg>
                  VynaAI
                </button>
                
                <button
                  className={`px-3 py-1 rounded-md text-sm flex items-center ${
                    drawerContent === 'teleprompter' 
                      ? 'bg-white text-black' 
                      : 'bg-transparent text-white border border-white/20'
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
              
              <button 
                className="p-1.5 rounded-full hover:bg-white/10"
                onClick={() => setIsDrawerOpen(false)}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.5 3.5L3.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.5 3.5L10.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            {/* Drawer content */}
            <div className="h-[calc(100%-48px)]">
              {drawerContent === 'chat' ? (
                <div className="flex flex-col h-full">
                  {/* RECENTS header */}
                  <div className="p-4 pb-2">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">RECENTS</h3>
                  </div>
                  
                  {/* Chat history */}
                  <div className="flex-1 overflow-y-auto px-4">
                    <div className="space-y-3">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="p-3 border border-white/10 rounded-xl">
                          <p className="text-sm text-white line-clamp-2">Who is the best CODM gamer in Nigeria right now?</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* New chat button */}
                  <div className="p-4">
                    <button className="w-full py-2 px-4 bg-white/10 hover:bg-white/15 rounded-lg text-sm flex items-center justify-center">
                      <svg className="mr-2" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 2.91666V11.0833" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.91666 7H11.0833" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      New chat
                    </button>
                  </div>
                </div>
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