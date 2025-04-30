import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { 
  Mic, MicOff, Phone, MessageSquare, Users, Share2, X, ChevronRight, ChevronLeft
} from 'lucide-react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  UID
} from 'agora-rtc-sdk-ng';
import { AgoraVideo } from './AgoraVideo';

interface ViewerStreamInterfaceProps {
  appId: string;
  channelName: string;
  rtcToken: string;
  rtmToken: string | null;
  uid: number;
  userName: string;
  streamTitle: string;
}

export default function ViewerStreamInterface({ 
  appId, 
  channelName, 
  rtcToken, 
  rtmToken,
  uid,
  userName,
  streamTitle
}: ViewerStreamInterfaceProps) {
  const [, setLocation] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userCount, setUserCount] = useState(1); // Start with 1 (the streamer)
  const [isMuted, setIsMuted] = useState(true);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTracksRef = useRef<{
    audioTrack?: IMicrophoneAudioTrack;
    videoTrack?: ICameraVideoTrack;
  }>({});
  
  // Function to handle user count updates from AgoraVideo
  const handleUserCountChange = useCallback((count: number) => {
    setUserCount(count);
  }, []);
  
  // Function to toggle drawer open/closed
  const toggleDrawer = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);
  
  // Function to toggle mute state
  const toggleMute = useCallback(async () => {
    if (!localTracksRef.current.audioTrack) return;
    
    if (isMuted) {
      await localTracksRef.current.audioTrack.setEnabled(true);
    } else {
      await localTracksRef.current.audioTrack.setEnabled(false);
    }
    
    setIsMuted(!isMuted);
  }, [isMuted]);
  
  // Function to handle ending call/leaving stream
  const handleEndCall = useCallback(() => {
    setIsCallEnded(true);
    
    // Close and clean up any local tracks
    if (localTracksRef.current.audioTrack) {
      localTracksRef.current.audioTrack.close();
    }
    
    if (localTracksRef.current.videoTrack) {
      localTracksRef.current.videoTrack.close();
    }
    
    // Leave the RTC channel if client exists
    if (clientRef.current) {
      clientRef.current.leave();
    }
    
    // Navigate back to the home page
    setLocation('/');
  }, [setLocation]);
  
  // Function to create a shareable link for the stream
  const handleShareStream = useCallback(() => {
    // Create a shareable direct stream link
    const streamLink = `${window.location.origin}/direct/${channelName}`;
    
    // Check if the browser supports the Share API
    if (navigator.share) {
      navigator.share({
        title: `Join ${streamTitle}`,
        text: `Join my livestream on Vyna Live! Stream code: ${channelName}`,
        url: streamLink,
      }).catch((error) => {
        console.log('Error sharing:', error);
        // Fallback to clipboard copy if sharing fails
        navigator.clipboard.writeText(streamLink);
        alert('Stream link copied to clipboard!');
      });
    } else {
      // Fallback for browsers that don't support the Share API
      navigator.clipboard.writeText(streamLink);
      alert('Stream link copied to clipboard!');
    }
  }, [channelName, streamTitle]);
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Clean up Agora resources
      if (localTracksRef.current.audioTrack) {
        localTracksRef.current.audioTrack.close();
      }
      
      if (localTracksRef.current.videoTrack) {
        localTracksRef.current.videoTrack.close();
      }
      
      if (clientRef.current) {
        clientRef.current.leave();
      }
    };
  }, []);
  
  // Handle case when stream has ended
  if (isCallEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
        <h2 className="text-xl font-semibold mb-4">Stream Ended</h2>
        <p className="mb-6 text-gray-400">You have left the stream.</p>
        <button 
          onClick={() => setLocation('/')}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition"
        >
          Return Home
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Main content area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${drawerOpen ? 'mr-72' : ''}`}>
        {/* Stream title bar */}
        <div className="p-4 flex justify-between items-center bg-gray-800/70 backdrop-blur-md">
          <h1 className="text-xl font-semibold truncate">{streamTitle}</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-1.5 text-gray-400" />
              <span className="text-gray-300">{userCount}</span>
            </div>
            <button 
              onClick={handleShareStream}
              className="rounded-full p-2 bg-gray-700/50 hover:bg-gray-700 transition"
              title="Share stream"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* AgoraVideo component takes most of the space */}
        <div className="flex-1 relative">
          <AgoraVideo
            appId={appId}
            channelName={channelName}
            rtcToken={rtcToken}
            rtmToken={rtmToken}
            uid={uid}
            role="audience"
            userName={userName}
            onUserCountChange={handleUserCountChange}
            onToggleDrawer={toggleDrawer}
          />
          
          {/* Control panel overlay positioned at the center bottom */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800/70 backdrop-blur-md">
            <button
              onClick={toggleMute}
              className={`rounded-full p-3 ${isMuted ? 'bg-gray-700 text-white' : 'bg-primary text-white'}`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={handleEndCall}
              className="rounded-full p-3 bg-red-600 text-white"
              title="Leave stream"
            >
              <Phone className="w-5 h-5 transform rotate-135" />
            </button>
            <button
              onClick={toggleDrawer}
              className="rounded-full p-3 bg-gray-700 text-white"
              title={drawerOpen ? "Close chat" : "Open chat"}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
          
          {/* Drawer toggle button on the right side */}
          <button
            onClick={toggleDrawer}
            className={`absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-800/70 backdrop-blur-md text-white p-2 rounded-l-lg transition-all ${
              drawerOpen ? 'translate-x-0' : 'translate-x-0'
            }`}
            title={drawerOpen ? "Close drawer" : "Open drawer"}
          >
            {drawerOpen ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Chat drawer panel */}
      <div 
        className={`fixed right-0 top-0 bottom-0 w-72 bg-gray-800/95 backdrop-blur-md transition-transform duration-300 transform ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        } z-20`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-medium">Live Chat</h2>
          <button 
            onClick={toggleDrawer}
            className="rounded-full p-1 hover:bg-gray-700/70 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Chat messages will be rendered inside the AgoraVideo component */}
        {/* This is just the container for the drawer */}
      </div>
    </div>
  );
}