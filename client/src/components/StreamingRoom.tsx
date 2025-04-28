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
      {/* Top header row with Vyna.live logo and user */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <svg width="64" height="32" viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.2812 14.2422C23.2812 16.0312 22.0859 17.2188 20.0312 17.2188C17.9922 17.2188 16.8594 16.0801 16.8438 14.2812H18.9844C19.0312 14.9688 19.4531 15.3652 20.0078 15.3652C20.5781 15.3652 20.9805 14.9453 20.9805 14.2422V6.5H23.2812V14.2422ZM11.9844 14.2969C11.9844 12.9922 12.9844 12.2578 13.9062 11.7617C13.0234 11.3086 12.25 10.3711 12.25 8.88672C12.25 6.74219 13.8281 5.33008 16.3828 5.33008C18.9062 5.33008 20.4844 6.74219 20.4844 8.88672C20.4844 10.3711 19.7109 11.3086 18.8281 11.7617C19.75 12.2578 20.75 12.9922 20.75 14.2969C20.75 16.5781 18.9375 18.043 16.3828 18.043C13.7969 18.043 11.9844 16.5781 11.9844 14.2969ZM14.5547 8.9375C14.5547 9.83594 15.3828 10.4023 16.3828 10.4023C17.3516 10.4023 18.1797 9.83594 18.1797 8.9375C18.1797 8.07422 17.3516 7.52344 16.3828 7.52344C15.3828 7.52344 14.5547 8.07422 14.5547 8.9375ZM14.2891 14.2422C14.2891 15.2266 15.2578 15.8438 16.3828 15.8438C17.4766 15.8438 18.4453 15.2266 18.4453 14.2422C18.4453 13.2734 17.4766 12.6562 16.3828 12.6562C15.2578 12.6562 14.2891 13.2734 14.2891 14.2422ZM9.375 5.5H6.5625V17.875H4.28516V5.5H1.47266V3.6875H9.375V5.5ZM42.5781 3.6875L39.1094 13.4062L35.7656 3.6875H32L27.5938 17.875H30.125L33.0938 7.59375L36.5625 17.875H41.6562L46.0625 3.6875H42.5781Z" fill="white"/>
          </svg>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full overflow-hidden">
            <img src="https://i.pravatar.cc/100" alt="Divine Samuel" className="h-full w-full object-cover" />
          </div>
          <span className="text-white">Divine Samuel</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      
      {/* Second row with user info, channel name and viewer count */}
      <div className="absolute top-[48px] left-0 right-0 z-30 px-4 py-2 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 pr-2">
            <div className="p-1 cursor-pointer hover:bg-white/10 rounded-full">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L5 8L10 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full overflow-hidden">
              <img src="https://i.pravatar.cc/100" alt="Divine Samuel" className="h-full w-full object-cover" />
            </div>
            <span className="text-white text-sm font-medium">Divine Samuel</span>
          </div>
          
          <div className="flex items-center mx-2">
            <span className="text-white/40 text-xs">•</span>
          </div>
          
          <span className="text-white text-sm font-medium">Jaja Games</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="white"/>
              <path d="M14 14C14 11.2385 11.3137 9 8 9C4.68629 9 2 11.2385 2 14V15C2 15.5523 2.44772 16 3 16H13C13.5523 16 14 15.5523 14 15V14Z" fill="white"/>
            </svg>
            <span className="text-white text-xs">123.5k</span>
          </div>
          
          {!isDrawerOpen && (
            <button 
              className="p-1 rounded-md hover:bg-white/10"
              onClick={() => setIsDrawerOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 14L12 8L6 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-1 py-1">
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 1.66669C8.66583 1.66669 7.59768 2.69752 7.59768 3.99252V10.4C7.59768 11.695 8.66583 12.7258 10 12.7258C11.3342 12.7258 12.4023 11.695 12.4023 10.4V3.99252C12.4023 2.69752 11.3342 1.66669 10 1.66669Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.8333 8.33331V10.4C15.8333 13.6975 13.2641 16.25 10 16.25C6.73584 16.25 4.16666 13.6975 4.16666 10.4V8.33331" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 16.25V18.3333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2.5" y="5" width="15" height="10" rx="1.5" stroke="white" strokeWidth="1.5"/>
                </svg>
              </button>
              
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="7.5" stroke="white" strokeWidth="1.5"/>
                  <circle cx="10" cy="10" r="3.5" stroke="white" strokeWidth="1.5"/>
                </svg>
              </button>
              
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.3667 3.84169C16.9411 3.41587 16.4356 3.07803 15.8795 2.84757C15.3233 2.6171 14.7271 2.49847 14.125 2.49847C13.5229 2.49847 12.9267 2.6171 12.3705 2.84757C11.8144 3.07803 11.3089 3.41587 10.8833 3.84169L10 4.72502L9.11666 3.84169C8.25692 2.98195 7.09085 2.49892 5.875 2.49892C4.65915 2.49892 3.49307 2.98195 2.63333 3.84169C1.7736 4.70143 1.29056 5.8675 1.29056 7.08335C1.29056 8.2992 1.7736 9.46528 2.63333 10.325L3.51666 11.2084L10 17.6917L16.4833 11.2084L17.3667 10.325C17.7925 9.89943 18.1303 9.39392 18.3608 8.83779C18.5913 8.28166 18.7099 7.68541 18.7099 7.08335C18.7099 6.4813 18.5913 5.88505 18.3608 5.32892C18.1303 4.77279 17.7925 4.26728 17.3667 3.84169V3.84169Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 14.7917L4.85667 17.4958L5.83917 11.7625L1.67834 7.71249L7.42834 6.87916L10 1.66666L12.5717 6.87916L18.3217 7.71249L14.1608 11.7625L15.1433 17.4958L10 14.7917Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button className="h-10 w-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
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