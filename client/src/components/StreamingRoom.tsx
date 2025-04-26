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
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Main video area */}
      <div className={cn(
        "transition-all duration-300 ease-in-out relative",
        isDrawerOpen 
          ? "w-[calc(100%-400px)]" 
          : "w-full"
      )}>
        {/* User info and viewers at top */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-5 py-3 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              <img src="https://i.pravatar.cc/100" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-medium">Divine Samuel</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-white flex items-center gap-1">
              <span className="text-sm font-medium">123.5k</span>
              <span className="text-xs">viewers</span>
            </div>
            {!isDrawerOpen && (
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white"
                onClick={() => setIsDrawerOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="3" height="18" x="18" y="3" rx="1" /><rect width="3" height="18" x="10.5" y="3" rx="1" /><rect width="3" height="18" x="3" y="3" rx="1" /></svg>
              </Button>
            )}
          </div>
        </div>
          
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
        
        {/* Bottom user chat indicators */}
        <div className="absolute left-4 bottom-20 flex flex-col gap-2 z-10">
          <div className="flex items-center gap-2 text-white bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
            <div className="w-5 h-5 rounded-full bg-orange-500"></div>
            <span className="text-xs">Innocent Dive</span>
            <span className="text-xs text-white/70">How far my guys wetin dey happen</span>
          </div>
          
          <div className="flex items-center gap-2 text-white bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
            <div className="w-5 h-5 rounded-full bg-blue-500"></div>
            <span className="text-xs">Godknows Ukari</span>
            <span className="text-xs text-white/70">How far my guys wetin dey happen</span>
          </div>
          
          <div className="flex items-center gap-2 text-white bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
            <div className="w-5 h-5 rounded-full bg-purple-500"></div>
            <span className="text-xs">Godknows Ukari</span>
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
      </div>
      
      {/* Right sidebar drawer matching Figma design */}
      {isDrawerOpen && (
        <div className="w-[400px] bg-black/80 backdrop-blur-lg text-white flex flex-col">
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-1">
              {/* Collapse button */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsDrawerOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
              </Button>
              
              {/* Tab buttons */}
              <div className="flex items-center gap-3 ml-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setDrawerContent('chat')}
                  className={cn(
                    "h-8 px-3 text-sm font-medium rounded-md hover:bg-white/10",
                    drawerContent === 'chat' ? 'bg-white/10' : 'bg-transparent'
                  )}
                >
                  <span className="mr-2">✨</span> VynaAI
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
                  <span className="mr-2">📝</span> Notepad
                </Button>
              </div>
            </div>
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
                <div className="flex-grow overflow-y-auto p-4 pt-0">
                  <ChatInterface 
                    messages={messages} 
                    onTeleprompterClick={handleTeleprompterClick}
                    isLoading={isLoading}
                  />
                </div>
                
                {/* Input area */}
                <div className="p-3 mt-auto">
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
                          📝
                        </div>
                        <p className="mb-2 font-medium">Your teleprompter is empty</p>
                        <p className="text-sm">
                          Ask the AI assistant for content, then click on a message 
                          to add it to your teleprompter
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Teleprompter controls */}
                {teleprompterText && (
                  <div className="p-3 flex justify-end gap-2 border-t border-white/10">
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
  );
}