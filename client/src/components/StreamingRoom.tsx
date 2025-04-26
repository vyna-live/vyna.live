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
      {/* Vyna.live logo at top left */}
      <div className="absolute top-4 left-6 z-30">
        <svg width="70" height="24" viewBox="0 0 70 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M39.3711 15.4668C39.3711 17.2559 38.1758 18.4336 36.1211 18.4336C34.082 18.4336 32.957 17.2949 32.9336 15.5059H35.0898C35.1367 16.1934 35.5625 16.5898 36.1211 16.5898C36.6914 16.5898 37.0938 16.1699 37.0938 15.4668V7.72656H39.3711V15.4668ZM40.4551 11.2227C40.4551 8.80859 42.168 7.55859 44.4395 7.55859C46.7227 7.55859 48.4355 8.80859 48.4355 11.2227V14.7852C48.4355 17.1992 46.7227 18.4492 44.4395 18.4492C42.168 18.4492 40.4551 17.1992 40.4551 14.7852V11.2227ZM46.1582 11.2227C46.1582 10.0391 45.5645 9.39844 44.4395 9.39844C43.3262 9.39844 42.7324 10.0391 42.7324 11.2227V14.7852C42.7324 15.9688 43.3262 16.6094 44.4395 16.6094C45.5645 16.6094 46.1582 15.9688 46.1582 14.7852V11.2227ZM50.6426 7.72656H53.0097L54.9355 15.4668H55.0176L56.9434 7.72656H59.3047V18.2812H57.1074V10.4062H57.0254L55.1699 18.2812H54.7832L52.9278 10.4062H52.8457V18.2812H50.6426V7.72656ZM67.6856 9.53906H64.8066V18.2812H62.5293V9.53906H59.6504V7.72656H67.6856V9.53906Z" fill="white"/>
          <path d="M15.0781 3.73438C21.375 3.73438 26.3438 8.01562 26.3438 14.2969C26.3438 16.7656 25.5 18.9375 24.0938 20.625C23.25 18.4688 21 16.7969 19.5 16.3594C22.1719 15.4688 24 13.3594 24 10.1562C24 6.98438 21.2812 4.5 17.2969 4.5C12.6094 4.5 9.65625 8.35938 9.65625 13.875C9.65625 14.7188 9.84375 15.75 10.2656 17.0156C8.625 16.5 8.0625 15.2344 8.0625 14.0625C8.0625 12.8438 8.71875 11.6562 9.42188 10.9062C6.9375 12.0781 4.96875 14.9375 4.96875 18.4688C4.96875 21.4688 6.75 23.0625 8.67188 23.0625C10.9062 23.0625 12.0781 21.3438 12.0781 19.1719C12.0781 17.6406 11.3594 16.7188 10.5312 16.125C10.7344 15.3281 11.25 14.0156 12.5469 14.0156C14.2969 14.0156 15.6094 15.75 15.6094 18.375C15.6094 21.1875 13.6875 23.0625 10.6406 23.0625C7.21875 23.0625 3.84375 20.2031 3.84375 15.75C3.84375 11.5625 6.75 3.73438 15.0781 3.73438Z" fill="white"/>
        </svg>
      </div>
      
      {/* User profile at top right */}
      <div className="absolute top-4 right-6 z-30 flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
          <img src="https://i.pravatar.cc/100" alt="Profile" className="w-full h-full object-cover" />
        </div>
        <span className="text-white text-sm font-medium">Divine Samuel</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      {/* User and viewers in second row */}
      <div className="absolute top-16 left-6 z-20 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full overflow-hidden">
            <img src="https://i.pravatar.cc/100" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <span className="text-white text-sm font-medium">Divine Samuel</span>
        </div>
      </div>
      
      <div className="absolute top-16 right-6 z-20 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <svg className="text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 8C17 10.7614 14.7614 13 12 13C9.23858 13 7 10.7614 7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 21C3 21 5 17 12 17C19 17 21 21 21 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-white text-sm font-medium">123.5k</span>
        </div>
        
        {!isDrawerOpen && (
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white"
            onClick={() => setIsDrawerOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="18" y="3" width="3" height="18" rx="1" fill="white"/>
              <rect x="10.5" y="3" width="3" height="18" rx="1" fill="white"/>
              <rect x="3" y="3" width="3" height="18" rx="1" fill="white"/>
            </svg>
          </Button>
        )}
      </div>
      
      {/* Main content */}
      <div className="flex h-full">
        {/* Main video area */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out relative h-full overflow-hidden",
            isDrawerOpen 
              ? "w-[calc(100%-384px)]" 
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
          
          {/* Bottom user chat messages popup */}
          <div className="absolute left-6 bottom-24 flex flex-col gap-2 z-10">
            <div className="flex items-center gap-2 text-white bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <img src="https://i.pravatar.cc/100?img=20" alt="User" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-medium">Innocent Dive</span>
              <span className="text-xs text-white/70">How far my guys wetin dey happen</span>
            </div>
            
            <div className="flex items-center gap-2 text-white bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <img src="https://i.pravatar.cc/100?img=30" alt="User" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-medium">Godknows Ukari</span>
              <span className="text-xs text-white/70">How far my guys wetin dey happen</span>
            </div>
            
            <div className="flex items-center gap-2 text-white bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <img src="https://i.pravatar.cc/100?img=40" alt="User" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-medium">Godknows Ukari</span>
              <span className="text-xs text-white/70">How far my guys wetin dey happen</span>
            </div>
            
            <div className="flex items-center gap-2 text-white/80 bg-transparent px-3 py-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-xs">Goddess</span>
              </span>
              <span className="text-xs">joined</span>
            </div>
          </div>
          
          {/* Bottom control bar */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
              <Button variant="ghost" size="icon" className="rounded-full bg-transparent hover:bg-white/10 text-white h-10 w-10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.33325 7.5L13.3333 10L8.33325 12.5V7.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
              
              <Button variant="ghost" size="icon" className="rounded-full bg-transparent hover:bg-white/10 text-white h-10 w-10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.5 10C15.6212 13.75 13.0875 15.625 10 15.625C6.9125 15.625 4.37875 13.75 2.5 10C4.37875 6.25 6.9125 4.375 10 4.375C13.0875 4.375 15.6212 6.25 17.5 10Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
              
              <Button variant="ghost" size="icon" className="rounded-full bg-transparent hover:bg-white/10 text-white h-10 w-10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.3333 14.1667L17.5 10L13.3333 5.83334" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.5 10H7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Right sidebar drawer */}
        {isDrawerOpen && (
          <div className="w-[384px] h-full bg-black/90 backdrop-blur-sm text-white flex flex-col overflow-hidden border-l border-white/10">
            {/* Drawer header */}
            <div className="flex items-center gap-6 px-6 py-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsDrawerOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.66666 10H13.3333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 6.66667L13.3333 10L10 13.3333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant={drawerContent === 'chat' ? "default" : "outline"} 
                  className={`h-9 px-4 rounded-md ${drawerContent === 'chat' ? 'bg-white text-black' : 'bg-transparent border-white/20 text-white'}`}
                  onClick={() => setDrawerContent('chat')}
                >
                  <svg className="mr-2" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3333 5.33333V14H2.66663V5.33333" stroke={drawerContent === 'chat' ? "black" : "white"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.6666 2H1.33331V5.33333H14.6666V2Z" stroke={drawerContent === 'chat' ? "black" : "white"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.66663 8H9.33329" stroke={drawerContent === 'chat' ? "black" : "white"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  VynaAI
                </Button>
                <Button 
                  variant={drawerContent === 'teleprompter' ? "default" : "outline"} 
                  className={`h-9 px-4 rounded-md ${drawerContent === 'teleprompter' ? 'bg-white text-black' : 'bg-transparent border-white/20 text-white'}`}
                  onClick={() => setDrawerContent('teleprompter')}
                >
                  <svg className="mr-2" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3333 5.33333V14H2.66675V5.33333" stroke={drawerContent === 'teleprompter' ? "black" : "white"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.6667 2H1.33337V5.33333H14.6667V2Z" stroke={drawerContent === 'teleprompter' ? "black" : "white"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.66675 8H9.33341" stroke={drawerContent === 'teleprompter' ? "black" : "white"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Notepad
                </Button>
              </div>
            </div>
            
            {/* Drawer content */}
            <div className="flex-grow flex flex-col">
              {drawerContent === 'chat' ? (
                <>
                  {/* RECENTS Header */}
                  <div className="p-6 pb-2">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">RECENTS</h3>
                  </div>
                  
                  {/* Chats & Messages */}
                  <div className="flex-grow overflow-y-auto px-6 pt-0">
                    <ChatInterface 
                      messages={messages} 
                      onTeleprompterClick={handleTeleprompterClick}
                      isLoading={isLoading}
                    />
                  </div>
                  
                  {/* Input area */}
                  <div className="p-6 mt-auto border-t border-white/10">
                    <InputArea 
                      onSubmit={handleSendMessage} 
                      isLoading={isLoading}
                    />
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
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-800 flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 8H4V6H20V8ZM20 10H4V12H20V10ZM20 14H4V16H20V14ZM3 20H21V4H3V20ZM3 2H21C22.1046 2 23 2.89543 23 4V20C23 21.1046 22.1046 22 21 22H3C1.89543 22 1 21.1046 1 20V4C1 2.89543 1.89543 2 3 2Z" fill="#9CA3AF"/>
                            </svg>
                          </div>
                          <p className="mb-2 font-medium">Your notepad is empty</p>
                          <p className="text-sm">
                            Ask the AI assistant for content, then click on a message 
                            to add it to your notepad
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Teleprompter controls */}
                  {teleprompterText && (
                    <div className="p-6 flex justify-end gap-2 border-t border-white/10">
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