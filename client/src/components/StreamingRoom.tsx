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
      {/* Top header row with Vyna logo and user - exactly matching navbar.png - with darker background */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 py-2 flex items-center justify-between bg-gradient-to-b from-black to-transparent">
        <div className="flex items-center">
          <svg width="64" height="28" viewBox="0 0 143 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M29.8 3.7C29.8 5.9 27.9 7.8 25.7 7.8C23.5 7.8 21.6 5.9 21.6 3.7C21.6 1.5 23.5 -0.4 25.7 -0.4C27.9 -0.4 29.8 1.5 29.8 3.7Z" fill="#F8F0E3"/>
            <path d="M20 14.5C20 22.1 13.9 28.3 6.3 28.3C-1.2 28.3 -7.4 22.1 -7.4 14.5C-7.4 12.2 -6.8 10.1 -5.8 8.2C-4.2 10.8 -1.2 12.5 2.1 12.5C2.7 12.5 3.2 12.4 3.7 12.3C3 13.1 2.5 14.2 2.5 15.4C2.5 18.1 4.8 20.3 7.7 20.3C10.6 20.3 12.9 18.1 12.9 15.4C12.9 13.9 12.4 12.6 11.4 11.7C12 10.8 12.4 9.7 12.4 8.5C12.4 5.9 10.7 3.8 8.3 3.3C8.8 3.2 9.3 3.1 9.9 3.1C12.4 3.1 14.5 4.7 15.2 6.9C17.6 8.7 19.2 11.5 19.2 14.5C19.2 14.6 19.2 14.6 19.2 14.7C20.1 13.3 20.5 11.7 20.5 10C20.5 6 17.2 2.8 13.1 2.8C12.6 2.8 12.1 2.8 11.7 2.9C11.7 2.8 11.8 2.7 11.9 2.6C13.3 1.3 14.1 -0.6 14.1 -1.9H6.7C6.7 -1.9 -0.7 -1.9 -0.7 -1.9C-0.7 -0.6 0.1 1.3 1.5 2.6C1.6 2.7 1.7 2.8 1.7 2.9C1.3 2.8 0.8 2.8 0.4 2.8C-3.7 2.8 -7 6 -7 10C-7 11.8 -6.5 13.5 -5.5 14.8C-5.5 14.7 -5.5 14.6 -5.5 14.5C-5.5 8 -0.2 2.8 6.2 2.8C12.6 2.8 17.9 8 17.9 14.5C17.9 21 12.6 26.2 6.2 26.2C-0.2 26.2 -5.5 21 -5.5 14.5C-5.5 14.5 -5.6 14.4 -5.6 14.3C-6.7 16.1 -7.4 18.3 -7.4 20.6C-7.4 24.6 -4.1 27.8 0 27.8C0.5 27.8 1 27.7 1.4 27.7C1.3 27.8 1.2 27.9 1.1 28C-0.3 29.3 -1.1 31.2 -1.1 32.5H6.3C6.3 32.5 13.7 32.5 13.7 32.5C13.7 31.2 12.9 29.3 11.5 28C11.4 27.9 11.3 27.8 11.3 27.7C11.7 27.7 12.2 27.8 12.7 27.8C14.5 27.8 16.2 27.1 17.5 26C20 23.8 21.7 20.7 21.7 17.3C21.7 16.3 21.5 15.3 21.2 14.5H20V14.5Z" fill="#CEB897"/>
            <path d="M60.8 19.7V15.6L55.5 15.6V22.5L57.9 22.5V19.7L59.2 19.7L61.2 22.5H64.1L61.6 19.4C61.8 19.3 62 19.3 62.2 19.2C62.8 19 62.9 18.7 62.9 18.2V18.1C62.8 17.1 62.3 17.9 61.2 18.1L60.8 19.7ZM57.5 17.8L58.9 17.8C59.3 17.8 59.6 17.9 59.6 18.2C59.6 18.5 59.3 18.6 58.9 18.6L57.5 18.6V17.8Z" fill="white"/>
            <path d="M69.9 15.5C67.1 15.5 64.9 17.1 64.9 18.9C64.9 20.7 67.1 22.3 69.9 22.3C72.7 22.3 74.9 20.7 74.9 18.9C74.9 17.1 72.7 15.5 69.9 15.5ZM69.9 20.5C68.8 20.5 67.7 19.7 67.7 18.8C67.7 17.9 68.8 17.1 69.9 17.1C71 17.1 72.1 17.9 72.1 18.8C72.1 19.7 71 20.5 69.9 20.5Z" fill="white"/>
            <path d="M53.1 18.9C53.1 17.2 51.7 15.5 50.1 15.5L43.8 15.5V22.5H49.8C51.5 22.5 53.1 20.9 53.1 18.9ZM49.8 20.5L46.1 20.5V17.2H49.8C50.6 17.2 51 18 51 18.9C51 19.7 50.6 20.5 49.8 20.5Z" fill="white"/>
            <path d="M112.3 4.4H124.9V8.3H119.5V28H115.7V8.3H112.3V4.4Z" fill="white"/>
            <path d="M128.1 10.9H131.7V14.4C132.6 12.1 134.3 10.7 136.9 10.7C140.3 10.7 142.7 12.8 142.7 17.2V28H139.1V18.1C139.1 15.3 138.0 13.9 135.7 13.9C133.4 13.9 131.7 15.7 131.7 18.7V28H128.1V10.9Z" fill="white"/>
            <path d="M78.3 4.4V18.7C78.3 23.7 75.6 28.5 69.4 28.5C65 28.5 62.2 25.8 62.2 22H65.9C65.9 24 67.3 25.4 69.4 25.4C72.5 25.4 74.7 22.9 74.7 18.7V4.4H78.3Z" fill="white"/>
            <path d="M101.9 4.4H105.5V11C106.6 10.2 108 9.9 109.5 9.9C113.9 9.9 116.6 13.1 116.6 18.9C116.6 24.7 113.7 27.5 109.5 27.5C107.8 27.5 106.3 27 105.2 26V27.5H101.9V4.4ZM108.9 24.2C111.2 24.2 113.1 22.1 113.1 18.9C113.1 15.6 111.2 13.2 108.9 13.2C107.4 13.2 106.2 13.9 105.5 14.9V22.4C106.2 23.5 107.3 24.2 108.9 24.2Z" fill="white"/>
            <path d="M90.8 10.9H94.4V28H90.8V25.5C89.5 27 87.7 28.1 85.6 28.1C81.8 28.1 79 25.6 79 20.5V10.9H82.6V19.7C82.6 22.8 83.9 24.5 86.4 24.5C88.9 24.5 90.8 22.1 90.8 19V10.9Z" fill="white"/>
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
      <div className="absolute top-[48px] left-0 right-0 z-30 px-4 py-2 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent">
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 20.25C3 16.6587 7.02944 13.75 12 13.75C16.9706 13.75 21 16.6587 21 20.25V20.5C21 20.7761 20.7761 21 20.5 21H3.5C3.22386 21 3 20.7761 3 20.5V20.25Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-white text-[11px]">123.5k</span>
          </div>
          
          {!isDrawerOpen && (
            <button 
              className="flex items-center justify-center"
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
          
          {/* Control panel at bottom - exactly as in bottom.png */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex items-center gap-1 bg-[#333333]/80 backdrop-blur-md rounded-full px-1 py-1">
              {/* Microphone icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z" fill="white"/>
                  <path d="M7 8V12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12V8M12 19V23M8 23H16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {/* Camera icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="6" width="15" height="12" rx="2" fill="white"/>
                  <path d="M22 9.76795C22 9.28299 22 9.04051 21.8977 8.91235C21.8078 8.80007 21.6739 8.73332 21.5348 8.72488C21.3766 8.71517 21.1926 8.81353 20.8245 9.01025L17 11.0001V13.0001L20.8245 14.99C21.1926 15.1867 21.3766 15.285 21.5348 15.2753C21.6739 15.2669 21.8078 15.2001 21.8977 15.0879C22 14.9597 22 14.7172 22 14.2323V9.76795Z" fill="white"/>
                </svg>
              </button>
              
              {/* Emoji icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="white"/>
                  <path d="M8 14C8 14 9 16 12 16C15 16 16 14 16 14" stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8.5" cy="10.5" r="1.5" fill="#333"/>
                  <circle cx="15.5" cy="10.5" r="1.5" fill="#333"/>
                </svg>
              </button>
              
              {/* Share icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 9.5V14.5C7 16.7091 8.79086 18.5 11 18.5H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 7.5L16 3.5M16 3.5L16 7.5M16 3.5L12 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.4 14.8889C20.4 16.8021 18.8418 18.3555 16.9222 18.3998C16.9222 18.3998 16.8863 18.4 16.85 18.4H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              
              {/* Info icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="white"/>
                  <path d="M12 7H12.01M11 12H12V16H13" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {/* End call button */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 5L5 19M5 5L19 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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