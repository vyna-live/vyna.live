import React, { useState, useEffect } from 'react';
import { useAgora } from '../hooks/useAgora';
import AgoraVideo from './AgoraVideo';
import ChatInterface from './ChatInterface';
import InputArea from './InputArea';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clipboard, X, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import GradientText from './GradientText';
import { MessageType, InfoGraphic } from '@/types/chat';

interface StreamingRoomProps {
  channelName: string;
  title?: string;
  description?: string;
  rtmpDestinations?: string[];
  onEnd?: () => void;
}

export default function StreamingRoom({
  channelName,
  title,
  description,
  rtmpDestinations = [],
  onEnd
}: StreamingRoomProps) {
  // State
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [drawerContent, setDrawerContent] = useState<'chat' | 'teleprompter'>('teleprompter');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [teleprompterText, setTeleprompterText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Handle sending chat message and getting AI response
  const handleSendMessage = async (message: string) => {
    try {
      setIsLoading(true);
      // Add user message to chat
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: message,
          role: 'user',
          timestamp: new Date(),
        }
      ]);

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      // Add AI response to chat
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: data.text,
          role: 'assistant',
          timestamp: new Date(),
          hasInfoGraphic: data.hasInfoGraphic,
          infoGraphicData: data.infoGraphicData,
        }
      ]);

      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to get response from AI assistant',
        variant: 'destructive',
      });
    }
  };

  // Handle setting teleprompter text
  const handleTeleprompterClick = (text: string) => {
    setTeleprompterText(text);
    // Switch to teleprompter view if not already active
    if (drawerContent !== 'teleprompter') {
      setDrawerContent('teleprompter');
    }
    toast({
      title: 'Added to Teleprompter',
      description: 'Text has been added to your teleprompter',
    });
  };

  // Handle copying teleprompter text to clipboard
  const handleCopyTeleprompter = () => {
    navigator.clipboard.writeText(teleprompterText).then(
      () => {
        toast({
          title: 'Copied',
          description: 'Teleprompter text copied to clipboard',
        });
      },
      (err) => {
        console.error('Failed to copy text: ', err);
        toast({
          title: 'Error',
          description: 'Failed to copy text to clipboard',
          variant: 'destructive',
        });
      }
    );
  };

  // Handle clearing teleprompter text
  const handleClearTeleprompter = () => {
    setTeleprompterText('');
    toast({
      title: 'Cleared',
      description: 'Teleprompter text has been cleared',
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-black">
      {/* Floating header with logo and user info */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-5 py-3 z-20">
        <div className="flex items-center">
          <div className="mr-6">
            <svg width="70" height="24" viewBox="0 0 70 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M39.3711 15.4668C39.3711 17.2559 38.1758 18.4336 36.1211 18.4336C34.082 18.4336 32.957 17.2949 32.9336 15.5059H35.0898C35.1367 16.1934 35.5625 16.5898 36.1211 16.5898C36.6914 16.5898 37.0938 16.1699 37.0938 15.4668V7.72656H39.3711V15.4668ZM40.4551 11.2227C40.4551 8.80859 42.168 7.55859 44.4395 7.55859C46.7227 7.55859 48.4355 8.80859 48.4355 11.2227V14.7852C48.4355 17.1992 46.7227 18.4492 44.4395 18.4492C42.168 18.4492 40.4551 17.1992 40.4551 14.7852V11.2227ZM46.1582 11.2227C46.1582 10.0391 45.5645 9.39844 44.4395 9.39844C43.3262 9.39844 42.7324 10.0391 42.7324 11.2227V14.7852C42.7324 15.9688 43.3262 16.6094 44.4395 16.6094C45.5645 16.6094 46.1582 15.9688 46.1582 14.7852V11.2227ZM50.6426 7.72656H53.0097L54.9355 15.4668H55.0176L56.9434 7.72656H59.3047V18.2812H57.1074V10.4062H57.0254L55.1699 18.2812H54.7832L52.9278 10.4062H52.8457V18.2812H50.6426V7.72656ZM67.6856 9.53906H64.8066V18.2812H62.5293V9.53906H59.6504V7.72656H67.6856V9.53906Z" fill="white"/>
              <path d="M15.0781 3.73438C21.375 3.73438 26.3438 8.01562 26.3438 14.2969C26.3438 16.7656 25.5 18.9375 24.0938 20.625C23.25 18.4688 21 16.7969 19.5 16.3594C22.1719 15.4688 24 13.3594 24 10.1562C24 6.98438 21.2812 4.5 17.2969 4.5C12.6094 4.5 9.65625 8.35938 9.65625 13.875C9.65625 14.7188 9.84375 15.75 10.2656 17.0156C8.625 16.5 8.0625 15.2344 8.0625 14.0625C8.0625 12.8438 8.71875 11.6562 9.42188 10.9062C6.9375 12.0781 4.96875 14.9375 4.96875 18.4688C4.96875 21.4688 6.75 23.0625 8.67188 23.0625C10.9062 23.0625 12.0781 21.3438 12.0781 19.1719C12.0781 17.6406 11.3594 16.7188 10.5312 16.125C10.7344 15.3281 11.25 14.0156 12.5469 14.0156C14.2969 14.0156 15.6094 15.75 15.6094 18.375C15.6094 21.1875 13.6875 23.0625 10.6406 23.0625C7.21875 23.0625 3.84375 20.2031 3.84375 15.75C3.84375 11.5625 6.75 3.73438 15.0781 3.73438Z" fill="white"/>
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              <img src="https://i.pravatar.cc/100" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <span className="text-white text-sm font-medium">Divine Samuel</span>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="rounded-full bg-black/40 backdrop-blur-sm px-3 py-1.5 text-white flex items-center mr-3">
            <svg className="mr-1.5" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" fill="white"/>
              <path d="M12 10C13.1046 10 14 9.10457 14 8C14 6.89543 13.1046 6 12 6C10.8954 6 10 6.89543 10 8C10 9.10457 10.8954 10 12 10Z" fill="white" fillOpacity="0.4"/>
              <path d="M4 10C5.10457 10 6 9.10457 6 8C6 6.89543 5.10457 6 4 6C2.89543 6 2 6.89543 2 8C2 9.10457 2.89543 10 4 10Z" fill="white" fillOpacity="0.4"/>
            </svg>
            <span className="text-sm font-medium">123.5k</span>
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
      </div>
      
      {/* Main content */}
      <div className="flex h-full">
        {/* Main video area */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out relative h-full",
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
              showControls={true}
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
          <div className="absolute left-4 bottom-20 flex flex-col gap-2 z-10">
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
                  <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.5 10C15.6212 13.75 13.0875 15.625 10 15.625C6.9125 15.625 4.37875 13.75 2.5 10C4.37875 6.25 6.9125 4.375 10 4.375C13.0875 4.375 15.6212 6.25 17.5 10Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
              
              <Button variant="ghost" size="icon" className="rounded-full bg-transparent hover:bg-white/10 text-white h-10 w-10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.5 5.83301H13.3333C14.2174 5.83301 15.0652 6.18444 15.6904 6.80956C16.3155 7.43468 16.6667 8.28253 16.6667 9.16634C16.6667 10.0501 16.3155 10.898 15.6904 11.5231C15.0652 12.1482 14.2174 12.4997 13.3333 12.4997H12.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.33325 5.83301H12.4999V13.333H3.33325V5.83301Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.66675 15V17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.16675 15V17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.91675 2.5V5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
              
              <Button variant="ghost" size="icon" className="rounded-full bg-transparent hover:bg-white/10 text-white h-10 w-10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.99992 18.3334C14.6023 18.3334 18.3333 14.6025 18.3333 10.0001C18.3333 5.39771 14.6023 1.66675 9.99992 1.66675C5.39746 1.66675 1.66663 5.39771 1.66663 10.0001C1.66663 14.6025 5.39746 18.3334 9.99992 18.3334Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 13.3333C11.841 13.3333 13.3334 11.841 13.3334 10C13.3334 8.15906 11.841 6.66669 10 6.66669C8.15908 6.66669 6.66675 8.15906 6.66675 10C6.66675 11.841 8.15908 13.3333 10 13.3333Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
              
              <Button variant="ghost" size="icon" className="rounded-full bg-red-500 hover:bg-red-600 text-white h-10 w-10">
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
          <div className="w-[384px] h-full bg-black/90 backdrop-blur-sm text-white flex flex-col rounded-l-2xl overflow-hidden border-l border-white/10">
            {/* Drawer header */}
            <div className="flex items-center px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3 mr-auto">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setDrawerContent('chat')}
                  className={cn(
                    "h-8 px-3 text-sm font-medium rounded-md hover:bg-white/10",
                    drawerContent === 'chat' ? 'bg-white/10' : 'bg-transparent'
                  )}
                >
                  <svg className="mr-2" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 14L8.11687 13.9415L11.25 12.111V14H12.5V4C12.4997 3.73731 12.4054 3.48044 12.2347 3.27392C12.064 3.0674 11.8267 2.92217 11.5654 2.86275C11.304 2.80332 11.0308 2.83329 10.7907 2.94777C10.5507 3.06225 10.3582 3.25466 10.246 3.494L5.75 3.5C5.63778 3.26066 5.44536 3.06825 5.20532 2.95377C4.96527 2.83929 4.69196 2.80932 4.43063 2.86875C4.1693 2.92818 3.93204 3.07341 3.76133 3.27993C3.59062 3.48645 3.49633 3.74331 3.496 4.005V14H4.746V12.111L7.87913 13.9415L8 14ZM10.246 11.177L8 12.579L5.75 11.177V4.766H10.25L10.246 11.177Z" fill="white"/>
                    <path d="M7.99994 7.375C8.38624 7.375 8.75695 7.22038 9.03357 6.94376C9.31019 6.66713 9.46481 6.29642 9.46481 5.91012C9.46481 5.52382 9.31019 5.15311 9.03357 4.87649C8.75695 4.59987 8.38624 4.44525 7.99994 4.44525C7.61364 4.44525 7.24292 4.59987 6.9663 4.87649C6.68968 5.15311 6.53506 5.52382 6.53506 5.91012C6.53506 6.29642 6.68968 6.66713 6.9663 6.94376C7.24292 7.22038 7.61364 7.375 7.99994 7.375Z" fill="white"/>
                  </svg>
                  VynaAI
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setDrawerContent('teleprompter')}
                  className={cn(
                    "h-8 px-3 text-sm font-medium rounded-md hover:bg-white/10",
                    drawerContent === 'teleprompter' ? 'bg-white/10' : 'bg-transparent'
                  )}
                >
                  <svg className="mr-2" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3334 5.33333V14H2.66675V5.33333" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.6667 2H1.33337V5.33333H14.6667V2Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.66675 8H9.33341" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
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
                  <div className="p-4 pb-2">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">RECENTS</h3>
                  </div>
                  
                  {/* Chats & Messages */}
                  <div className="flex-grow overflow-y-auto px-4 pt-0">
                    <ChatInterface 
                      messages={messages} 
                      onTeleprompterClick={handleTeleprompterClick}
                      isLoading={isLoading}
                    />
                  </div>
                  
                  {/* Input area */}
                  <div className="p-4 mt-auto border-t border-white/10">
                    <InputArea 
                      onSubmit={handleSendMessage} 
                      isLoading={isLoading}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Teleprompter content */}
                  <div className="flex-grow overflow-y-auto p-4 text-white">
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
                    <div className="p-4 flex justify-end gap-2 border-t border-white/10">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCopyTeleprompter}
                        className="h-8 bg-transparent border-white/20 text-white hover:bg-white/10"
                      >
                        <Copy className="h-3.5 w-3.5 mr-2" />
                        Copy
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleClearTeleprompter}
                        className="h-8 bg-transparent border-red-500/50 text-red-500 hover:bg-red-950/30"
                      >
                        <X className="h-3.5 w-3.5 mr-2" />
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