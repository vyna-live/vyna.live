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
    <div className="h-screen overflow-hidden bg-black">
      {/* Top navigation bar - exactly matching navbar.png */}
      <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm z-30">
        <div className="flex items-center justify-between p-3 px-6">
          <div>
            <svg width="70" height="24" viewBox="0 0 70 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M39.3711 15.4668C39.3711 17.2559 38.1758 18.4336 36.1211 18.4336C34.082 18.4336 32.957 17.2949 32.9336 15.5059H35.0898C35.1367 16.1934 35.5625 16.5898 36.1211 16.5898C36.6914 16.5898 37.0938 16.1699 37.0938 15.4668V7.72656H39.3711V15.4668ZM40.4551 11.2227C40.4551 8.80859 42.168 7.55859 44.4395 7.55859C46.7227 7.55859 48.4355 8.80859 48.4355 11.2227V14.7852C48.4355 17.1992 46.7227 18.4492 44.4395 18.4492C42.168 18.4492 40.4551 17.1992 40.4551 14.7852V11.2227ZM46.1582 11.2227C46.1582 10.0391 45.5645 9.39844 44.4395 9.39844C43.3262 9.39844 42.7324 10.0391 42.7324 11.2227V14.7852C42.7324 15.9688 43.3262 16.6094 44.4395 16.6094C45.5645 16.6094 46.1582 15.9688 46.1582 14.7852V11.2227ZM50.6426 7.72656H53.0097L54.9355 15.4668H55.0176L56.9434 7.72656H59.3047V18.2812H57.1074V10.4062H57.0254L55.1699 18.2812H54.7832L52.9278 10.4062H52.8457V18.2812H50.6426V7.72656ZM67.6856 9.53906H64.8066V18.2812H62.5293V9.53906H59.6504V7.72656H67.6856V9.53906Z" fill="white"/>
              <path d="M15.0781 3.73438C21.375 3.73438 26.3438 8.01562 26.3438 14.2969C26.3438 16.7656 25.5 18.9375 24.0938 20.625C23.25 18.4688 21 16.7969 19.5 16.3594C22.1719 15.4688 24 13.3594 24 10.1562C24 6.98438 21.2812 4.5 17.2969 4.5C12.6094 4.5 9.65625 8.35938 9.65625 13.875C9.65625 14.7188 9.84375 15.75 10.2656 17.0156C8.625 16.5 8.0625 15.2344 8.0625 14.0625C8.0625 12.8438 8.71875 11.6562 9.42188 10.9062C6.9375 12.0781 4.96875 14.9375 4.96875 18.4688C4.96875 21.4688 6.75 23.0625 8.67188 23.0625C10.9062 23.0625 12.0781 21.3438 12.0781 19.1719C12.0781 17.6406 11.3594 16.7188 10.5312 16.125C10.7344 15.3281 11.25 14.0156 12.5469 14.0156C14.2969 14.0156 15.6094 15.75 15.6094 18.375C15.6094 21.1875 13.6875 23.0625 10.6406 23.0625C7.21875 23.0625 3.84375 20.2031 3.84375 15.75C3.84375 11.5625 6.75 3.73438 15.0781 3.73438Z" fill="white"/>
            </svg>
          </div>
          
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <img src="https://i.pravatar.cc/100" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <span className="text-white text-sm">Divine Samuel</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Second row header with stream info - exactly as in navbar.png */}
      <div className="absolute top-[49px] left-0 right-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent px-6 py-3">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10">
              <img src="https://i.pravatar.cc/100" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <span className="text-white text-sm">Divine Samuel</span>
          </div>
          
          <div className="flex items-center mx-4">
            <span className="text-white/40 text-sm">•</span>
          </div>
          
          <span className="text-white text-sm">Jaja Games</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="white"/>
              <path d="M14 14C14 11.2385 11.3137 9 8 9C4.68629 9 2 11.2385 2 14V15C2 15.5523 2.44772 16 3 16H13C13.5523 16 14 15.5523 14 15V14Z" fill="white"/>
            </svg>
            <span className="text-white text-xs">123.5k</span>
          </div>
          
          {!isDrawerOpen && (
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white p-0 h-auto"
              onClick={() => setIsDrawerOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 13L11 8L6 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex h-full pt-24">
        {/* Main video area */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out relative h-full overflow-hidden",
            isDrawerOpen 
              ? "w-[calc(100%-384px)] pr-4" 
              : "w-full"
          )}
        >
          {/* Video component */}
          <div className="h-full w-full">
            <AgoraVideo 
              channelName={channelName}
              mode="livestream"
              showControls={false} // We'll use our custom controls
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
              className="h-full w-full"
            />
          </div>
          
          {/* Bottom user chat messages popup - exactly as in mockup */}
          <div className="absolute left-6 bottom-24 flex flex-col gap-1 z-10 text-white">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden">
                <img src="https://i.pravatar.cc/100?img=20" alt="User" className="w-full h-full object-cover" style={{backgroundColor: '#F97316'}} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium">Innocent Dive</span>
                <span className="text-xs opacity-80">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden">
                <img src="https://i.pravatar.cc/100?img=30" alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium">Godknows Ukari</span>
                <span className="text-xs opacity-80">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden bg-gradient-to-r from-yellow-500 to-pink-500">
                <img src="https://i.pravatar.cc/100?img=40" alt="User" className="w-full h-full object-cover opacity-90" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium">Godknows Ukari</span>
                <span className="text-xs opacity-80">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-center mt-1">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span className="text-xs font-medium text-white/90">Goddess</span>
              </div>
              <span className="text-xs text-white/70 ml-1">joined</span>
            </div>
          </div>
          
          {/* Bottom control panel exactly as shown in the mockup */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex items-center gap-1 bg-[#333333]/80 backdrop-blur-sm rounded-full px-1 py-1">
              <button className="h-12 w-12 flex items-center justify-center rounded-full text-white hover:bg-neutral-700/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" x2="12" y1="19" y2="22"></line>
                </svg>
              </button>
              
              <button className="h-12 w-12 flex items-center justify-center rounded-full text-white hover:bg-neutral-700/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="12" x="3" y="6" rx="2" ry="2"></rect>
                </svg>
              </button>
              
              <button className="h-12 w-12 flex items-center justify-center rounded-full text-white hover:bg-neutral-700/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="4"></circle>
                  <line x1="21.17" x2="12" y1="8" y2="8"></line>
                  <line x1="3.95" x2="8.54" y1="6.06" y2="14"></line>
                  <line x1="10.88" x2="15.46" y1="21.94" y2="14"></line>
                </svg>
              </button>
              
              <button className="h-12 w-12 flex items-center justify-center rounded-full text-white hover:bg-neutral-700/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
              </button>
              
              <button className="h-12 w-12 flex items-center justify-center rounded-full text-white hover:bg-neutral-700/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
              
              <button className="h-12 w-12 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" x2="6" y1="6" y2="18"></line>
                  <line x1="6" x2="18" y1="6" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Right sidebar drawer */}
        {isDrawerOpen && (
          <div className="w-[384px] h-full bg-black/95 backdrop-blur-sm text-white flex flex-col rounded-l-lg overflow-hidden border-l border-white/10">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
              <div className="flex">
                <Button 
                  variant={drawerContent === 'chat' ? "default" : "outline"}
                  className={`h-8 rounded-md ${drawerContent === 'chat' ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 text-white'}`}
                  onClick={() => setDrawerContent('chat')}
                >
                  <svg className="mr-2" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 13.3333L7.6 13.04L5.33333 11.6667V13.3333H4.66667V3.33333C4.66669 3.15652 4.73692 2.98695 4.86195 2.86193C4.98697 2.7369 5.15654 2.66667 5.33336 2.66667C5.51017 2.66667 5.67974 2.7369 5.80476 2.86193C5.92979 2.98695 6.00002 3.15652 6.00003 3.33333V3.33333L9.33336 3.33333C9.51017 3.33333 9.67974 3.4036 9.80476 3.52862C9.92979 3.65365 10 3.82321 10 4C10 4.17681 9.92976 4.34638 9.80473 4.4714C9.67971 4.59643 9.51014 4.66667 9.33333 4.66667L6.00003 4.66667V10.6667L7.6 11.6267L9.2 10.6667V9.66667H10V10.6667L8 12L7.6 12.2867V13.3333H8Z" fill={drawerContent === 'chat' ? 'black' : 'white'}/>
                  </svg>
                  VynaAI
                </Button>
                <Button 
                  variant={drawerContent === 'teleprompter' ? "default" : "outline"}
                  className={`h-8 ml-2 rounded-md ${drawerContent === 'teleprompter' ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 text-white'}`}
                  onClick={() => setDrawerContent('teleprompter')}
                >
                  <svg className="mr-2" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3334 5.33333V14H2.66675V5.33333" stroke={drawerContent === 'teleprompter' ? 'black' : 'white'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.6667 2H1.33337V5.33333H14.6667V2Z" stroke={drawerContent === 'teleprompter' ? 'black' : 'white'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.66675 8H9.33341" stroke={drawerContent === 'teleprompter' ? 'black' : 'white'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Notepad
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsDrawerOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 5L15 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </div>
            
            {/* Drawer content */}
            <div className="flex-grow flex flex-col">
              {drawerContent === 'chat' ? (
                <>
                  {/* RECENTS Header */}
                  <div className="p-6 pb-2">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">RECENTS</h3>
                  </div>
                  
                  {/* Chat messages list as in mockup */}
                  <div className="flex-grow overflow-y-auto px-6 pt-0 pb-4">
                    <div className="space-y-4">
                      <div className="border border-white/10 rounded-xl p-3">
                        <p className="text-sm text-white line-clamp-2">Who is the best CODM gamer in Nigeria right now?</p>
                      </div>
                      
                      <div className="border border-white/10 rounded-xl p-3">
                        <p className="text-sm text-white line-clamp-2">Who is the best CODM gamer in Nigeria right now?</p>
                      </div>
                      
                      <div className="border border-white/10 rounded-xl p-3">
                        <p className="text-sm text-white line-clamp-2">Who is the best CODM gamer in Nigeria right now?</p>
                      </div>
                      
                      <div className="border border-white/10 rounded-xl p-3">
                        <p className="text-sm text-white line-clamp-2">Who is the best CODM gamer in Nigeria right now?</p>
                      </div>
                      
                      <div className="border border-white/10 rounded-xl p-3">
                        <p className="text-sm text-white line-clamp-2">Who is the best CODM gamer in Nigeria right now?</p>
                      </div>
                      
                      <div className="border border-white/10 rounded-xl p-3">
                        <p className="text-sm text-white line-clamp-2">Who is the best CODM gamer in Nigeria right now?</p>
                      </div>
                      
                      <div className="border border-white/10 rounded-xl p-3">
                        <p className="text-sm text-white line-clamp-2">Who is the best CODM gamer in Nigeria right now?</p>
                      </div>
                      
                      <div className="border border-white/10 rounded-xl p-3">
                        <p className="text-sm text-white line-clamp-2">Who is the best CODM gamer in Nigeria right now?</p>
                      </div>
                      
                      <div className="border border-white/10 rounded-xl p-3">
                        <p className="text-sm text-white line-clamp-2">Who is the best CODM gamer in Nigeria right now?</p>
                      </div>
                      
                      <div className="border border-white/10 rounded-xl p-3">
                        <p className="text-sm text-white line-clamp-2">Who is the best CODM gamer in Nigeria right now?</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* New chat button */}
                  <div className="mx-6 mb-6">
                    <button className="w-full h-10 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm flex items-center justify-center">
                      <svg className="mr-2" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 3.33337V12.6667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3.33331 8H12.6666" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      New chat
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Teleprompter content */}
                  <div className="flex-grow overflow-y-auto p-6 text-white">
                    {teleprompterText ? (
                      <div className="text-xl font-medium leading-relaxed">
                        <GradientText 
                          text={teleprompterText} 
                          preset="warm" 
                          showCursor={true}
                          typingSpeed={0} // Show immediately
                        />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center p-4 text-neutral-400">
                        <div>
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M26.6667 10.6667H5.33333V8H26.6667V10.6667ZM26.6667 13.3333H5.33333V16H26.6667V13.3333ZM26.6667 18.6667H5.33333V21.3333H26.6667V18.6667ZM4 26.6667H28V5.33333H4V26.6667ZM4 2.66667H28C28.7072 2.66667 29.3855 2.94762 29.8856 3.44772C30.3857 3.94781 30.6667 4.62609 30.6667 5.33333V26.6667C30.6667 27.3739 30.3857 28.0522 29.8856 28.5523C29.3855 29.0524 28.7072 29.3333 28 29.3333H4C3.29276 29.3333 2.61447 29.0524 2.11438 28.5523C1.61428 28.0522 1.33333 27.3739 1.33333 26.6667V5.33333C1.33333 4.62609 1.61428 3.94781 2.11438 3.44772C2.61447 2.94762 3.29276 2.66667 4 2.66667Z" fill="#9CA3AF"/>
                            </svg>
                          </div>
                          <p className="text-lg font-medium mb-2">Your notepad is empty</p>
                          <p className="text-sm text-neutral-500">
                            Ask the AI assistant for content, then click on a message 
                            to add it to your notepad
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Teleprompter controls */}
                  {teleprompterText && (
                    <div className="p-4 flex justify-end gap-2 border-t border-white/10">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCopyTeleprompter}
                        className="h-9 bg-transparent border-white/20 text-white hover:bg-white/10"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleClearTeleprompter}
                        className="h-9 bg-transparent border-red-500/50 text-red-500 hover:bg-red-950/30"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
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