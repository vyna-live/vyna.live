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
      {/* Top navigation bar */}
      <div className="absolute top-0 left-0 right-0 bg-black/30 backdrop-blur-sm z-30 flex justify-between items-center px-6 py-3">
        <div>
          <svg width="70" height="24" viewBox="0 0 70 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M39.3711 15.4668C39.3711 17.2559 38.1758 18.4336 36.1211 18.4336C34.082 18.4336 32.957 17.2949 32.9336 15.5059H35.0898C35.1367 16.1934 35.5625 16.5898 36.1211 16.5898C36.6914 16.5898 37.0938 16.1699 37.0938 15.4668V7.72656H39.3711V15.4668ZM40.4551 11.2227C40.4551 8.80859 42.168 7.55859 44.4395 7.55859C46.7227 7.55859 48.4355 8.80859 48.4355 11.2227V14.7852C48.4355 17.1992 46.7227 18.4492 44.4395 18.4492C42.168 18.4492 40.4551 17.1992 40.4551 14.7852V11.2227ZM46.1582 11.2227C46.1582 10.0391 45.5645 9.39844 44.4395 9.39844C43.3262 9.39844 42.7324 10.0391 42.7324 11.2227V14.7852C42.7324 15.9688 43.3262 16.6094 44.4395 16.6094C45.5645 16.6094 46.1582 15.9688 46.1582 14.7852V11.2227ZM50.6426 7.72656H53.0097L54.9355 15.4668H55.0176L56.9434 7.72656H59.3047V18.2812H57.1074V10.4062H57.0254L55.1699 18.2812H54.7832L52.9278 10.4062H52.8457V18.2812H50.6426V7.72656ZM67.6856 9.53906H64.8066V18.2812H62.5293V9.53906H59.6504V7.72656H67.6856V9.53906Z" fill="white"/>
            <path d="M15.0781 3.73438C21.375 3.73438 26.3438 8.01562 26.3438 14.2969C26.3438 16.7656 25.5 18.9375 24.0938 20.625C23.25 18.4688 21 16.7969 19.5 16.3594C22.1719 15.4688 24 13.3594 24 10.1562C24 6.98438 21.2812 4.5 17.2969 4.5C12.6094 4.5 9.65625 8.35938 9.65625 13.875C9.65625 14.7188 9.84375 15.75 10.2656 17.0156C8.625 16.5 8.0625 15.2344 8.0625 14.0625C8.0625 12.8438 8.71875 11.6562 9.42188 10.9062C6.9375 12.0781 4.96875 14.9375 4.96875 18.4688C4.96875 21.4688 6.75 23.0625 8.67188 23.0625C10.9062 23.0625 12.0781 21.3438 12.0781 19.1719C12.0781 17.6406 11.3594 16.7188 10.5312 16.125C10.7344 15.3281 11.25 14.0156 12.5469 14.0156C14.2969 14.0156 15.6094 15.75 15.6094 18.375C15.6094 21.1875 13.6875 23.0625 10.6406 23.0625C7.21875 23.0625 3.84375 20.2031 3.84375 15.75C3.84375 11.5625 6.75 3.73438 15.0781 3.73438Z" fill="white"/>
          </svg>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              <img src="https://i.pravatar.cc/100" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <span className="text-white text-sm font-medium">Divine Samuel</span>
            <svg className="ml-1" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6L8 10L12 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Second row header with stream info */}
      <div className="absolute top-14 left-0 right-0 z-20 flex justify-between items-center px-6 py-2">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full overflow-hidden">
              <img src="https://i.pravatar.cc/100" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <span className="text-white text-sm font-semibold">Divine Samuel</span>
          </div>
          
          <span className="text-white text-sm mx-4">•</span>
          
          <span className="text-white text-sm font-semibold">Jaja Games</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm py-1 px-2 rounded-full">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="white"/>
                <path d="M14 14C14 11.2385 11.3137 9 8 9C4.68629 9 2 11.2385 2 14V15C2 15.5523 2.44772 16 3 16H13C13.5523 16 14 15.5523 14 15V14Z" fill="white"/>
              </svg>
              <span className="text-white text-xs font-semibold">123.5k</span>
            </div>
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
          
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.0299 4.04997C11.9799 4.04997 11.9199 4.04997 11.8699 4.04997C9.99992 4.03997 8.21992 4.84997 6.91992 6.14997C5.61992 7.44997 4.82992 9.26997 4.82992 11.14C4.82992 12.59 5.24992 14.0099 6.04992 15.2499C6.55992 16.0599 6.71992 17.0199 6.47992 17.9099L6.09992 19.3499C5.99992 19.7499 6.13992 20.1599 6.42992 20.4499C6.65992 20.6799 6.97992 20.7999 7.29992 20.7999C7.40992 20.7999 7.51992 20.7799 7.61992 20.7499L9.05992 20.3699C9.31992 20.2999 9.58992 20.2599 9.85992 20.2599C10.3699 20.2599 10.8699 20.3699 11.3299 20.5999C12.4599 21.1299 13.7299 21.4199 14.9999 21.4199C16.8699 21.4199 18.6499 20.6399 19.9399 19.3499C21.2299 18.0599 22.0399 16.2799 22.0399 14.3899C22.0399 12.5499 21.2699 10.8099 19.9999 9.51997C18.6799 8.19997 16.9799 7.38997 15.1399 7.34997C14.9899 7.35997 14.8399 7.35997 14.6899 7.35997C13.7699 7.32997 12.8599 7.49997 12.0299 7.84997" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.5 14.9999C16.5 15.5499 16.05 15.9999 15.5 15.9999C14.95 15.9999 14.5 15.5499 14.5 14.9999C14.5 14.4499 14.95 13.9999 15.5 13.9999C16.05 13.9999 16.5 14.4499 16.5 14.9999Z" fill="white"/>
            <path d="M12.5 14.9999C12.5 15.5499 12.05 15.9999 11.5 15.9999C10.95 15.9999 10.5 15.5499 10.5 14.9999C10.5 14.4499 10.95 13.9999 11.5 13.9999C12.05 13.9999 12.5 14.4499 12.5 14.9999Z" fill="white"/>
            <path d="M8.5 14.9999C8.5 15.5499 8.05 15.9999 7.5 15.9999C6.95 15.9999 6.5 15.5499 6.5 14.9999C6.5 14.4499 6.95 13.9999 7.5 13.9999C8.05 13.9999 8.5 14.4499 8.5 14.9999Z" fill="white"/>
          </svg>
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
          
          {/* Bottom control panel exactly as in mockup */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
              <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 0.833374C11.3833 0.833374 12.5 1.95004 12.5 3.33337V10C12.5 11.3834 11.3833 12.5 10 12.5C8.61667 12.5 7.5 11.3834 7.5 10V3.33337C7.5 1.95004 8.61667 0.833374 10 0.833374Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.8333 8.33337V10C15.8333 13.225 13.225 15.8334 10 15.8334C6.77501 15.8334 4.16667 13.225 4.16667 10V8.33337" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 15.8334V19.1667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.66666 19.1666H13.3333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.49999 2.5H12.5C14.1667 2.5 15.8333 3.33333 15.8333 5.83333V14.1667C15.8333 16.6667 14.1667 17.5 12.5 17.5H7.49999C5.83333 17.5 4.16666 16.6667 4.16666 14.1667V5.83333C4.16666 3.33333 5.83333 2.5 7.49999 2.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.99999 14.1667C9.07952 14.1667 8.33333 13.4205 8.33333 12.5C8.33333 11.5795 9.07952 10.8333 9.99999 10.8333C10.9205 10.8333 11.6667 11.5795 11.6667 12.5C11.6667 13.4205 10.9205 14.1667 9.99999 14.1667Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.1667 5.83329L13.3333 10L19.1667 14.1666V5.83329Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.6667 4.16663H2.50001C1.5795 4.16663 0.833344 4.91279 0.833344 5.83329V14.1666C0.833344 15.0871 1.5795 15.8333 2.50001 15.8333H11.6667C12.5872 15.8333 13.3333 15.0871 13.3333 14.1666V5.83329C13.3333 4.91279 12.5872 4.16663 11.6667 4.16663Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.91669 10.8334C8.11058 10.8334 8.30251 10.7544 8.44566 10.6113C8.58881 10.4681 8.66669 10.2762 8.66669 10.0834C8.66669 9.89052 8.58881 9.69858 8.44566 9.55543C8.30251 9.41228 8.11058 9.3334 7.91669 9.3334C7.7228 9.3334 7.53086 9.41228 7.38771 9.55543C7.24456 9.69858 7.16669 9.89052 7.16669 10.0834C7.16669 10.2762 7.24456 10.4681 7.38771 10.6113C7.53086 10.7544 7.7228 10.8334 7.91669 10.8334Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.0833 10.8334C12.2772 10.8334 12.4692 10.7544 12.6123 10.6113C12.7555 10.4681 12.8333 10.2762 12.8333 10.0834C12.8333 9.89052 12.7555 9.69858 12.6123 9.55543C12.4692 9.41228 12.2772 9.3334 12.0833 9.3334C11.8894 9.3334 11.6975 9.41228 11.5544 9.55543C11.4112 9.69858 11.3333 9.89052 11.3333 10.0834C11.3333 10.2762 11.4112 10.4681 11.5544 10.6113C11.6975 10.7544 11.8894 10.8334 12.0833 10.8334Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.475 13.3417C14.075 12.8834 13.1417 12.5 12.0833 12.5C10.8333 12.5 10.8333 13.3334 9.99999 13.3334C9.16666 13.3334 9.16666 12.5 7.91666 12.5C6.85833 12.5 5.92499 12.8834 5.52499 13.3417" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.1333 4.17504C11.9583 4.13337 11.775 4.10004 11.5833 4.08337C11.4583 4.06671 11.325 4.0667 11.1917 4.0667C8.69166 4.0667 6.66666 6.09171 6.66666 8.5917C6.66666 11.0917 8.69166 13.1167 11.1917 13.1167C11.325 13.1167 11.4583 13.1084 11.5833 13.1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.2583 10.925C15.675 10.2583 15.9167 9.45833 15.9167 8.59167C15.9167 6.05833 13.8 4.00833 11.1833 4.06667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16.6667 16.6667C16.6667 13.9083 14.1917 11.6667 11.1917 11.6667C8.19166 11.6667 5.71666 13.9083 5.71666 16.6667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.33334 13.7583C2.15001 12.75 1.46667 11.3667 1.46667 9.84167C1.46667 7.00833 3.85001 4.67502 6.72501 4.67502C8.08334 4.67502 9.30001 5.17502 10.2167 5.99169" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.16666 16.6667C4.16666 14.1667 5.84166 12.0667 8.33333 11.7167" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.0416 11.7167C16.5333 12.0667 18.2083 14.1667 18.2083 16.6667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.4583 1.90836L13.9583 2.51669C14.9416 2.75003 15.7416 3.69169 15.7416 4.70003V6.76669C16.6583 7.44169 17.5 8.45003 17.5 9.75003V12.9167C17.5 14.65 16.0917 16.0584 14.3583 16.0584H5.64167C3.90833 16.0584 2.5 14.65 2.5 12.9167V9.75003C2.5 8.45003 3.34167 7.44169 4.25833 6.76669V4.70003C4.25833 3.69169 5.05833 2.75003 6.04167 2.51669L8.54167 1.90836C9.25833 1.75836 10.75 1.75836 11.4583 1.90836Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 13.125V14.375" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.0001 9.79167C9.08008 9.79167 8.3334 9.04499 8.3334 8.125V7.70833C8.3334 6.78841 9.08008 6.04167 10.0001 6.04167C10.92 6.04167 11.6667 6.78841 11.6667 7.70833V8.125C11.6667 9.04499 10.92 9.79167 10.0001 9.79167Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button className="h-10 w-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.8334 4.16671L4.16675 15.8334" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.8334 15.8334L4.16675 4.16671" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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