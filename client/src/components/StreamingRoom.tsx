import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
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
import { Users, Video, VideoOff, Mic, MicOff, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStreamVideo } from '@/hooks/useStreamVideo';
import Logo from '@/components/Logo';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

interface StreamingRoomProps {
  isPersonalRoom?: boolean;
  initialTeleprompterText?: string;
  callId?: string;
}

const StreamingRoom: React.FC<StreamingRoomProps> = ({ 
  isPersonalRoom = false, 
  initialTeleprompterText = '',
  callId
}) => {
  const { isDemoMode } = useStreamVideo();
  
  // Choose the appropriate streaming room based on demo mode
  if (isDemoMode) {
    return <DemoStreamingRoom initialTeleprompterText={initialTeleprompterText} />;
  }
  
  // Use the actual streaming component for production
  return (
    <ActualStreamingRoom 
      isPersonalRoom={isPersonalRoom} 
      initialTeleprompterText={initialTeleprompterText}
      callId={callId}
    />
  );
};

// Demo version of the streaming room - no actual Stream SDK
const DemoStreamingRoom: React.FC<{ initialTeleprompterText?: string }> = ({ initialTeleprompterText = '' }) => {
  const [isTeleprompterVisible, setIsTeleprompterVisible] = useState<boolean>(true);
  const [teleprompterText, setTeleprompterText] = useState<string>(initialTeleprompterText || 'Welcome to Vyna.live! Your AI-powered streaming platform.');
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(1);
  const [teleprompterPosition, setTeleprompterPosition] = useState<number>(0);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [layoutType, setLayoutType] = useState<'grid' | 'split'>('split');
  
  // Handle going back to dashboard
  const handleBack = () => {
    setLocation('/');
  };
  
  return (
    <div className="flex h-screen overflow-hidden text-white bg-gradient-to-b from-gray-900 to-black">
      {/* Header with logo and controls */}
      <div className="absolute top-4 left-4 z-10">
        <Logo variant="light" size="md" />
      </div>

      {/* Demo status indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-amber-600/80 px-3 py-1 rounded-full text-sm flex items-center gap-1">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span>Demo Mode</span>
      </div>

      {/* Teleprompter toggle button */}
      <button
        onClick={() => setIsTeleprompterVisible(!isTeleprompterVisible)}
        className="absolute top-4 right-4 z-10 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] text-white px-3 py-1 rounded-md text-sm font-medium transition-all hover:opacity-90"
      >
        {isTeleprompterVisible ? 'Hide' : 'Show'} Teleprompter
      </button>
      
      {/* Main content */}
      <div className="flex w-full h-full">
        {/* Stream view */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out h-full",
            isTeleprompterVisible ? "w-[70%]" : "w-full"
          )}
        >
          <div className="h-full relative flex items-center justify-center">
            {/* Demo camera preview */}
            <div className="p-8 rounded-xl bg-black/50 backdrop-blur-sm w-full max-w-2xl text-center">
              <div className="mb-6 w-full bg-black rounded-lg overflow-hidden">
                <div className="aspect-video flex items-center justify-center border border-gray-800">
                  <div className="flex flex-col items-center">
                    <VideoOff className="h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-gray-400 mb-2">Camera preview unavailable in demo mode</p>
                    <p className="text-xs text-gray-500">
                      To enable actual video streaming, please provide valid GetStream API credentials
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
                <div className="p-3 rounded-lg bg-gray-800/50 flex flex-col items-center">
                  <VideoOff className="h-6 w-6 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-300">Video Off</span>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/50 flex flex-col items-center">
                  <MicOff className="h-6 w-6 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-300">Mic Off</span>
                </div>
              </div>
            </div>
            
            {/* Stream controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 px-6 py-3 bg-gray-900/80 backdrop-blur-sm rounded-full">
              <button className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-800">
                <VideoOff className="h-5 w-5 text-red-500" />
              </button>
              <button className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-800">
                <MicOff className="h-5 w-5 text-red-500" />
              </button>
              <button 
                onClick={handleBack}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700"
              >
                <PhoneOff className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Teleprompter panel */}
        {isTeleprompterVisible && (
          <div className="w-[30%] h-full bg-gray-900/60 backdrop-blur-sm border-l border-gray-800/50 overflow-y-auto p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-medium text-lg">Teleprompter</h2>
              <div className="space-x-2">
                <button
                  onClick={() => setTeleprompterSpeed(Math.max(0.5, teleprompterSpeed - 0.25))}
                  className="px-2 py-1 bg-gray-800 rounded text-white text-sm hover:bg-gray-700"
                  disabled={teleprompterSpeed <= 0.5}
                >
                  -
                </button>
                <span className="text-white text-sm">{teleprompterSpeed.toFixed(2)}x</span>
                <button
                  onClick={() => setTeleprompterSpeed(Math.min(2, teleprompterSpeed + 0.25))}
                  className="px-2 py-1 bg-gray-800 rounded text-white text-sm hover:bg-gray-700"
                  disabled={teleprompterSpeed >= 2}
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Teleprompter Display */}
            <div className="flex-1 overflow-hidden relative bg-gray-800/40 rounded-lg p-4 text-white">
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
            
            {/* Edit Teleprompter */}
            <div className="mt-4">
              <textarea
                className="w-full bg-gray-800/50 text-white rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#A67D44]/50 h-32"
                value={teleprompterText}
                onChange={(e) => setTeleprompterText(e.target.value)}
                placeholder="Type your teleprompter text here..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Actual Stream SDK implementation of the streaming room
const ActualStreamingRoom: React.FC<StreamingRoomProps> = ({ 
  isPersonalRoom = false, 
  initialTeleprompterText = '',
  callId
}) => {
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipant, setShowParticipant] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [streamStatus, setStreamStatus] = useState<string>('active');
  const [teleprompterText, setTeleprompterText] = useState<string>(initialTeleprompterText || 'Welcome to Vyna.live! Your AI-powered streaming platform.');
  const [isTeleprompterVisible, setIsTeleprompterVisible] = useState<boolean>(true);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(1);
  const [teleprompterPosition, setTeleprompterPosition] = useState<number>(0);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { client, userId } = useStreamVideo();
  
  // Initialize WebSocket connection
  useEffect(() => {
    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Attempting to connect to WebSocket at:', wsUrl);
      
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
            if (message.data?.error) {
              toast({
                title: "Stream Error",
                description: message.data.error,
                variant: "destructive",
              });
            } else if (message.data?.status) {
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
          title: "Connection Warning",
          description: "Could not establish real-time connection. Some features may be limited.",
          variant: "destructive",
        });
      };
      
      socket.onclose = () => {
        console.log('WebSocket connection closed');
        setWsConnection(null);
      };
      
      // Clean up WebSocket on component unmount
      return () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(JSON.stringify({
              type: 'stream_status',
              data: {
                status: 'stream_ended',
                timestamp: new Date().toISOString()
              }
            }));
          } catch (e) {
            console.error('Error sending final message:', e);
          }
          socket.close();
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  }, [toast]);
  
  // Get calling state from Stream
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  
  // If not joined, render loader
  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="flex flex-col items-center">
          <Logo variant="light" size="lg" className="mb-8" />
          <div className="animate-spin h-10 w-10 border-4 border-[#A67D44] border-t-transparent rounded-full"></div>
          <div className="mt-4 text-gray-300 text-xl">Connecting to stream...</div>
        </div>
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
    <div className="relative h-screen w-full overflow-hidden text-white bg-black">
      {/* Header with logo */}
      <div className="absolute top-4 left-4 z-10">
        <Logo variant="light" size="md" />
      </div>
      
      {/* Live indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-red-600/80 px-3 py-1 rounded-full text-sm flex items-center gap-1">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span>LIVE</span>
      </div>
      
      {/* Teleprompter toggle button */}
      <button
        onClick={() => setIsTeleprompterVisible(!isTeleprompterVisible)}
        className="absolute top-4 right-4 z-10 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] text-white px-3 py-1 rounded-md text-sm font-medium transition-all hover:opacity-90"
      >
        {isTeleprompterVisible ? 'Hide' : 'Show'} Teleprompter
      </button>
      
      {/* Main content area */}
      <div className="flex h-full">
        {/* Stream view */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out h-full",
            isTeleprompterVisible ? "w-[70%]" : "w-full"
          )}
        >
          <div className="h-full relative">
            {/* Layout selector */}
            <div className="absolute top-16 right-4 z-10 flex space-x-2">
              <button
                onClick={() => handleLayoutChange('grid')}
                className={`p-2 rounded-md ${layout === 'grid' ? 'bg-[#A67D44]' : 'bg-gray-700 hover:bg-gray-600'}`}
                title="Grid layout"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              
              <button
                onClick={() => handleLayoutChange('speaker-left')}
                className={`p-2 rounded-md ${layout === 'speaker-left' ? 'bg-[#A67D44]' : 'bg-gray-700 hover:bg-gray-600'}`}
                title="Speaker left"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="11" height="18" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="17" y="3" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="17" y="10" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="17" y="17" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              
              <button
                onClick={() => handleLayoutChange('speaker-right')}
                className={`p-2 rounded-md ${layout === 'speaker-right' ? 'bg-[#A67D44]' : 'bg-gray-700 hover:bg-gray-600'}`}
                title="Speaker right"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="3" width="11" height="18" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="3" y="3" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="3" y="10" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="3" y="17" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              
              <button
                onClick={() => setShowParticipant(!showParticipant)}
                className={`p-2 rounded-md ${showParticipant ? 'bg-[#A67D44]' : 'bg-gray-700 hover:bg-gray-600'}`}
                title="Show/hide participants"
              >
                <Users className="w-5 h-5" />
              </button>
              
              <CallStatsButton />
            </div>
            
            {/* Stream layout component */}
            <div className="h-full flex items-center justify-center p-4">
              <CallLayout />
            </div>
            
            {/* Stream controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-gray-900/80 backdrop-blur-sm rounded-full">
              <CallControls 
                onLeave={() => {
                  // Handle leaving the stream
                  setLocation('/');
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Teleprompter panel */}
        {isTeleprompterVisible && (
          <div className="w-[30%] h-full bg-gray-900/60 backdrop-blur-sm border-l border-gray-800/50 overflow-y-auto p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-medium text-lg">Teleprompter</h2>
              <div className="space-x-2">
                <button
                  onClick={() => setTeleprompterSpeed(Math.max(0.5, teleprompterSpeed - 0.25))}
                  className="px-2 py-1 bg-gray-800 rounded text-white text-sm hover:bg-gray-700"
                  disabled={teleprompterSpeed <= 0.5}
                >
                  -
                </button>
                <span className="text-white text-sm">{teleprompterSpeed.toFixed(2)}x</span>
                <button
                  onClick={() => setTeleprompterSpeed(Math.min(2, teleprompterSpeed + 0.25))}
                  className="px-2 py-1 bg-gray-800 rounded text-white text-sm hover:bg-gray-700"
                  disabled={teleprompterSpeed >= 2}
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Teleprompter Display */}
            <div className="flex-1 overflow-hidden relative bg-gray-800/40 rounded-lg p-4 text-white">
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
            
            {/* Edit Teleprompter */}
            <div className="mt-4">
              <textarea
                className="w-full bg-gray-800/50 text-white rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#A67D44]/50 h-32"
                value={teleprompterText}
                onChange={(e) => setTeleprompterText(e.target.value)}
                placeholder="Type your teleprompter text here..."
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Participants list */}
      {showParticipant && (
        <div className="absolute top-16 right-4 z-10 bg-gray-900/90 backdrop-blur-sm rounded-md border border-gray-800 w-80 max-h-[70vh] overflow-y-auto">
          <div className="p-3 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-white font-medium">Participants</h3>
            <button 
              onClick={() => setShowParticipant(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <CallParticipantsList onClose={() => setShowParticipant(false)} />
        </div>
      )}
    </div>
  );
};

export default StreamingRoom;