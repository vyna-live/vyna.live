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
    <div className="flex h-screen overflow-hidden">
      {/* Main content - video area */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isDrawerOpen 
          ? "w-[calc(100%-30%)] pr-4" 
          : "w-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Stream title */}
          <div className="px-4 py-2 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">{title || channelName}</h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isDrawerOpen && (
                <>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setDrawerContent('chat');
                      setIsDrawerOpen(true);
                    }}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setDrawerContent('teleprompter');
                      setIsDrawerOpen(true);
                    }}
                  >
                    <Clipboard className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Video component */}
          <div className="flex-grow overflow-hidden p-4">
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
              className="h-full rounded-xl overflow-hidden shadow-lg"
            />
          </div>
        </div>
      </div>
      
      {/* Sidebar/drawer */}
      {isDrawerOpen && (
        <div className="w-[30%] border-l bg-background flex flex-col">
          {/* Drawer header */}
          <div className="p-3 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button 
                variant={drawerContent === 'chat' ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawerContent('chat')}
                className="h-8"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
              </Button>
              <Button 
                variant={drawerContent === 'teleprompter' ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawerContent('teleprompter')}
                className="h-8"
              >
                <Clipboard className="h-4 w-4 mr-1" />
                Teleprompter
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsDrawerOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Drawer content */}
          <div className="flex-grow overflow-hidden flex flex-col">
            {drawerContent === 'chat' ? (
              <>
                {/* Chat messages */}
                <div className="flex-grow overflow-y-auto p-4">
                  <ChatInterface 
                    messages={messages} 
                    onTeleprompterClick={handleTeleprompterClick}
                    isLoading={isLoading}
                  />
                </div>
                
                {/* Input area */}
                <div className="p-3 border-t">
                  <InputArea 
                    onSubmit={handleSendMessage} 
                    isLoading={isLoading}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full">
                {/* Teleprompter toolbar */}
                <div className="p-2 bg-muted border-b flex justify-between items-center">
                  <h3 className="text-sm font-medium">Teleprompter</h3>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleCopyTeleprompter}
                      className="h-7 w-7"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleClearTeleprompter}
                      className="h-7 w-7 text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                
                {/* Teleprompter content */}
                <div className="flex-grow overflow-y-auto p-4 bg-black text-white">
                  {teleprompterText ? (
                    <div className="text-2xl font-medium leading-relaxed">
                      <GradientText 
                        text={teleprompterText} 
                        preset="warm" 
                        showCursor={true}
                        typingSpeed={0} // Show immediately
                      />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-4 text-muted-foreground">
                      <div>
                        <p className="mb-2">No teleprompter text yet</p>
                        <p className="text-sm">
                          Ask the AI assistant for content, then click on a message 
                          to add it to the teleprompter
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}