import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  CallControls,
  CallingState,
  CallParticipantsList,
  CallStatsButton,
  LivestreamLayout,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

interface StreamingRoomProps {
  isPersonalRoom?: boolean;
  initialTeleprompterText?: string;
}

const StreamingRoom: React.FC<StreamingRoomProps> = ({ isPersonalRoom = false, initialTeleprompterText = '' }) => {
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipant, setShowParticipant] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [streamStatus, setStreamStatus] = useState<string>('active');
  const [teleprompterText, setTeleprompterText] = useState<string>(initialTeleprompterText || 'Welcome to Vyna.live! Your AI-powered streaming platform.');
  const [isTeleprompterVisible, setIsTeleprompterVisible] = useState<boolean>(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(1);
  const [teleprompterPosition, setTeleprompterPosition] = useState<number>(0);
  const { toast } = useToast();
  
  // Initialize WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      setWsConnection(socket);
      
      // Send initial connection message
      socket.send(JSON.stringify({
        type: 'stream_status',
        data: {
          status: 'stream_started',
          timestamp: new Date().toISOString()
        }
      }));
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        
        // Handle different message types
        if (message.type === 'status_update') {
          if (message.data.error) {
            toast({
              title: "Stream Error",
              description: message.data.error,
              variant: "destructive",
            });
          } else if (message.data.status) {
            setStreamStatus(message.data.status);
            
            // Show appropriate toast based on status
            if (message.data.status === 'stream_started') {
              toast({
                title: "Stream Started",
                description: "Your livestream has successfully started",
              });
            } else if (message.data.status === 'egress_started') {
              toast({
                title: "Multiplatform Streaming",
                description: `Your stream is now live on ${message.data.platforms || 'multiple platforms'}`,
              });
            } else if (message.data.status === 'egress_updated') {
              toast({
                title: "Multiplatform Settings Updated",
                description: `Stream settings have been updated for ${message.data.platforms || 'your platforms'}`,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Could not establish real-time connection for stream status updates",
        variant: "destructive",
      });
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setWsConnection(null);
    };
    
    // Clean up WebSocket on component unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'stream_status',
          data: {
            status: 'stream_ended',
            timestamp: new Date().toISOString()
          }
        }));
      }
      socket.close();
    };
  }, [toast]);
  
  // Get calling state from Stream
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  
  // If not joined, render loader
  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-white">Connecting to stream...</span>
      </div>
    );
  }
  
  // Component to render the appropriate layout
  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="right" />;
      default:
        return <SpeakerLayout participantsBarPosition="left" />;
    }
  };
  
  // Handle layout change
  const handleLayoutChange = (newLayout: CallLayoutType) => {
    setLayout(newLayout);
    toast({
      title: 'Layout Changed',
      description: `Switched to ${newLayout.replace('-', ' ')} layout`,
    });
  };
  
  return (
    <section className="relative h-screen w-full overflow-hidden p-6 text-white bg-black">
      {/* Main content area */}
      <div className="relative flex size-full">
        {/* Livestream view */}
        <div className="flex size-full max-w-[1000px] items-center">
          <LivestreamLayout
            showLiveBadge={false}
            showDuration={false}
            mirrorLocalParticipantVideo={false}
          />
        </div>
        
        {/* Side panel (could be for chat, participants, etc.) */}
        <div className={cn("ml-2 bg-gray-900/40 backdrop-blur-md w-full rounded-lg p-4")}>
          {/* Content changes based on current view */}
          {showParticipant ? (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Participants</h3>
                <button 
                  onClick={() => setShowParticipant(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <CallParticipantsList onClose={() => setShowParticipant(false)} />
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Teleprompter</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTeleprompterSpeed(prev => Math.max(0.5, prev - 0.25))}
                    className="text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded-md text-sm"
                  >
                    Slower
                  </button>
                  <button 
                    onClick={() => setTeleprompterSpeed(prev => Math.min(2, prev + 0.25))}
                    className="text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded-md text-sm"
                  >
                    Faster
                  </button>
                </div>
              </div>
              
              {/* Teleprompter Display */}
              <div className="flex-1 overflow-hidden relative bg-gray-800/50 rounded-lg p-4">
                <div 
                  className="teleprompter-content text-white text-xl font-medium leading-relaxed"
                  style={{
                    transition: `transform ${teleprompterSpeed * 0.5}s ease-out`,
                    transform: `translateY(-${teleprompterPosition}px)`,
                  }}
                >
                  {teleprompterText.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
                
                {/* Teleprompter Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-t from-gray-900 to-transparent">
                  <div className="flex items-center">
                    <span className="text-gray-400 text-sm mr-2">Speed: {teleprompterSpeed.toFixed(2)}x</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setTeleprompterPosition(0)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => setTeleprompterPosition(prev => Math.max(0, prev - 100))}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    >
                      ↑ Up
                    </button>
                    <button 
                      onClick={() => setTeleprompterPosition(prev => prev + 100)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    >
                      ↓ Down
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Edit Teleprompter Button */}
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => {
                    // Show a prompt to edit the teleprompter text
                    const newText = prompt("Edit teleprompter text", teleprompterText);
                    if (newText !== null) {
                      setTeleprompterText(newText);
                      setTeleprompterPosition(0); // Reset position
                      
                      toast({
                        title: "Teleprompter Updated",
                        description: "The teleprompter content has been updated",
                      });
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Edit Teleprompter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom controls */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex flex-wrap max-w-[900px] items-center justify-center gap-5 px-4 py-2 bg-gray-900/60 backdrop-blur-md rounded-full">
        <CallControls />
        
        {/* Layout toggle */}
        <div className="relative group">
          <button 
            className="rounded-full bg-gray-800 p-2 hover:bg-gray-700 transition-colors"
            onClick={() => setLayout(layout === 'grid' ? 'speaker-left' : 'grid')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/>
            </svg>
          </button>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 invisible group-hover:visible">
            <span className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              Toggle Layout
            </span>
          </div>
        </div>
        
        {/* Stats button */}
        <CallStatsButton />
        
        {/* Participants button */}
        <div className="relative group">
          <button
            onClick={() => setShowParticipant(prev => !prev)}
            className="rounded-full bg-gray-800 p-2 hover:bg-gray-700 transition-colors"
          >
            <Users size={20} className="text-white" />
          </button>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 invisible group-hover:visible">
            <span className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              {showParticipant ? 'Hide' : 'Show'} Participants
            </span>
          </div>
        </div>
        
        {/* End call button (only for non-personal rooms) */}
        {!isPersonalRoom && (
          <div className="relative group">
            <button
              onClick={() => window.location.href = '/'}
              className="rounded-full bg-red-600 p-2 hover:bg-red-700 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 invisible group-hover:visible">
              <span className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                End Stream
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default StreamingRoom;