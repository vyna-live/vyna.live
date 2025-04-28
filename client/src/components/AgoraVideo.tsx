import React, { useState, useEffect, useRef, FormEvent } from 'react';
import AgoraRTC, { 
  ClientConfig, 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  ConnectionState,
  ConnectionDisconnectedReason,
  IAgoraRTCRemoteUser,
  IRemoteVideoTrack,
  IRemoteAudioTrack
} from "agora-rtc-sdk-ng";
import { Loader2, Video, X, Mic, MicOff, Camera, CameraOff, Users, Send, ScreenShare, MonitorUp } from 'lucide-react';

// Define Agora config
const config: ClientConfig = { 
  mode: "live", 
  codec: "vp8",
};

// Custom CSS for Agora components
const customStyles = `
  .agora-video-player {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(205, 188, 171, 0.2);
  }
  
  .agora-controls {
    background: rgba(15, 16, 21, 0.6);
    border-radius: 9999px;
    padding: 8px;
    border: 1px solid rgba(205, 188, 171, 0.1);
    backdrop-filter: blur(8px);
  }
  
  .animate-slideInUp {
    animation: slideInUp 0.3s ease-out forwards;
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Removed ChatMessage interface as we're using Agora's built-in chat

interface AgoraVideoProps {
  appId: string;
  channelName: string;
  token?: string;
  uid?: number;
  role?: 'host' | 'audience';
  userName: string;
  onToggleDrawer?: () => void;
}

export function AgoraVideo({ 
  appId, 
  channelName, 
  token, 
  uid = Math.floor(Math.random() * 1000000),
  role = 'host',
  userName,
  onToggleDrawer
}: AgoraVideoProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [viewers, setViewers] = useState<number>(0);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  // Removed chat-related state as we're using Agora's built-in chat
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Client reference
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const screenTrackRef = useRef<any | null>(null);
  
  // Create client and tracks on mount
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        
        // Don't try to connect if no appId
        if (!appId) {
          setError("Missing Agora App ID");
          setIsLoading(false);
          return;
        }
        
        // Create client
        const agoraClient = AgoraRTC.createClient(config);
        clientRef.current = agoraClient;
        
        // Set client role
        await agoraClient.setClientRole(role === 'host' ? 'host' : 'audience');
        
        // Listen for connection state changes
        agoraClient.on('connection-state-change', (curState, prevState, reason) => {
          console.log("Agora connection state changed:", prevState, "->", curState, "reason:", reason);
          
          if (curState === 'DISCONNECTED') {
            setIsJoined(false);
          }
        });
        
        // Listen for user-joined events
        agoraClient.on('user-joined', (user) => {
          console.log("User joined:", user.uid);
          setRemoteUsers(prev => [...prev, user]);
          setViewers(prev => prev + 1);
        });
        
        // Listen for user-left events
        agoraClient.on('user-left', (user) => {
          console.log("User left:", user.uid);
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
          setViewers(prev => Math.max(0, prev - 1));
        });
        
        // Create tracks if host
        if (role === 'host') {
          // Create microphone and camera tracks
          const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          audioTrackRef.current = micTrack;
          videoTrackRef.current = camTrack;
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing Agora:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize stream");
        setIsLoading(false);
      }
    };
    
    init();
    
    // Cleanup
    return () => {
      // Clean up tracks
      if (audioTrackRef.current) {
        audioTrackRef.current.close();
        audioTrackRef.current = null;
      }
      
      if (videoTrackRef.current) {
        videoTrackRef.current.close();
        videoTrackRef.current = null;
      }
      
      // Leave channel if joined
      if (clientRef.current && isJoined) {
        clientRef.current.leave();
      }
    };
  }, [appId, role]);

  // Join call when ready
  const joinChannel = async () => {
    if (!clientRef.current || !audioTrackRef.current || !videoTrackRef.current) return;
    
    try {
      setIsLoading(true);
      const client = clientRef.current;
      
      // Join the channel
      await client.join(appId, channelName, token || null, uid);
      console.log("Joined Agora channel:", channelName);
      
      // Publish tracks if host
      if (role === 'host') {
        await client.publish([audioTrackRef.current, videoTrackRef.current]);
        console.log("Published tracks to Agora channel");
      }
      
      setIsJoined(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Error joining Agora channel:", err);
      setError(err instanceof Error ? err.message : "Failed to join stream");
      setIsLoading(false);
    }
  };

  // Toggle audio
  const toggleAudio = async () => {
    if (!audioTrackRef.current) return;
    
    if (isAudioOn) {
      await audioTrackRef.current.setEnabled(false);
    } else {
      await audioTrackRef.current.setEnabled(true);
    }
    
    setIsAudioOn(!isAudioOn);
  };

  // Toggle video
  const toggleVideo = async () => {
    if (!videoTrackRef.current) return;
    
    if (isVideoOn) {
      await videoTrackRef.current.setEnabled(false);
    } else {
      await videoTrackRef.current.setEnabled(true);
    }
    
    setIsVideoOn(!isVideoOn);
  };

  // End stream
  const endStream = async () => {
    if (!clientRef.current) return;
    
    try {
      // Unpublish tracks
      if (audioTrackRef.current) {
        await clientRef.current.unpublish(audioTrackRef.current);
      }
      
      if (videoTrackRef.current) {
        await clientRef.current.unpublish(videoTrackRef.current);
      }
      
      // Leave channel
      await clientRef.current.leave();
      console.log("Left Agora channel");
      
      setIsJoined(false);
    } catch (err) {
      console.error("Error leaving channel:", err);
    }
  };
  
  // Chat functionality now handled by Agora's built-in UI
  
  // Toggle screen sharing
  const toggleScreenSharing = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      try {
        if (screenTrackRef.current) {
          await clientRef.current?.unpublish(screenTrackRef.current);
          screenTrackRef.current.close();
          screenTrackRef.current = null;
        }
        // Re-enable camera video
        if (videoTrackRef.current) {
          await videoTrackRef.current.setEnabled(true);
          setIsVideoOn(true);
        }
        setIsScreenSharing(false);
      } catch (error) {
        console.error("Error stopping screen sharing:", error);
      }
    } else {
      // Start screen sharing
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
          optimizationMode: "detail"
        });
        
        if (!Array.isArray(screenTrack)) {
          screenTrackRef.current = screenTrack;
          
          // Disable camera video while screen sharing
          if (videoTrackRef.current) {
            await videoTrackRef.current.setEnabled(false);
          }
          
          // Publish screen track
          await clientRef.current?.publish(screenTrack);
          setIsScreenSharing(true);
          
          // Handle screen sharing stopped by user through browser UI
          screenTrack.on("track-ended", async () => {
            await clientRef.current?.unpublish(screenTrack);
            screenTrack.close();
            screenTrackRef.current = null;
            
            // Re-enable camera
            if (videoTrackRef.current) {
              await videoTrackRef.current.setEnabled(true);
              setIsVideoOn(true);
            }
            
            setIsScreenSharing(false);
          });
        }
      } catch (error) {
        console.error("Error starting screen sharing:", error);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-[#A67D44] animate-spin mb-2" />
          <p className="text-[#CDBCAB]">Connecting to stream...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-[#EFE9E1]" />
          </div>
          <h3 className="text-xl font-medium text-[#CDBCAB] mb-2">Stream Error</h3>
          <p className="text-[#CDBCAB] mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] rounded-lg text-[#EFE9E1] hover:shadow-md transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Not joined yet - "Go Live" screen
  if (!isJoined) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <style>{customStyles}</style>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mb-4">
            <Video className="w-10 h-10 text-[#EFE9E1]" />
          </div>
          <h3 className="text-xl font-medium text-[#CDBCAB] mb-2">Ready to Stream</h3>
          <p className="text-[#CDBCAB] mb-4">
            You're about to go live as <strong>{userName}</strong>. Click "Go Live" to start streaming.
          </p>
          
          {/* Preview of local video */}
          {videoTrackRef.current && (
            <div className="mb-6 relative rounded-lg overflow-hidden shadow-lg">
              <div className="w-full pb-[56.25%] relative"> {/* 16:9 aspect ratio */}
                <div className="absolute inset-0">
                  <VideoPlayer videoTrack={videoTrackRef.current} />
                </div>
              </div>
            </div>
          )}
          
          {/* Controls */}
          <div className="mb-6 flex justify-center space-x-4">
            <button 
              onClick={toggleAudio}
              className="p-3 rounded-full bg-[#242428] hover:bg-[#2C2C32] text-white"
            >
              {isAudioOn ? <Mic size={20} /> : <MicOff size={20} className="text-red-500" />}
            </button>
            <button 
              onClick={toggleVideo}
              className="p-3 rounded-full bg-[#242428] hover:bg-[#2C2C32] text-white"
            >
              {isVideoOn ? <Camera size={20} /> : <CameraOff size={20} className="text-red-500" />}
            </button>
          </div>
          
          <button 
            onClick={joinChannel}
            className="px-6 py-3 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] hover:from-[#B68D54] hover:to-[#6D2C44] rounded-lg text-[#EFE9E1] hover:shadow-md transition-all"
          >
            Go Live
          </button>
        </div>
      </div>
    );
  }

  // Live stream view
  return (
    <div className="h-full relative">
      <style>{customStyles}</style>
      
      {/* Main video stream */}
      <div className="absolute inset-0 bg-black rounded-lg overflow-hidden">
        {videoTrackRef.current && <VideoPlayer videoTrack={videoTrackRef.current} />}
      </div>
      
      {/* Custom controls - more stylish than Agora's */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
        <button 
          onClick={toggleAudio}
          className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          {isAudioOn ? <Mic size={16} /> : <MicOff size={16} className="text-red-400" />}
        </button>
        <button 
          onClick={toggleVideo}
          className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          {isVideoOn ? <Camera size={16} /> : <CameraOff size={16} className="text-red-400" />}
        </button>
        <button 
          onClick={() => toggleScreenSharing()}
          className={`w-8 h-8 ${isScreenSharing ? 'bg-green-500/70' : 'bg-black/50'} hover:bg-opacity-80 rounded-full flex items-center justify-center text-white transition-colors`}
        >
          <ScreenShare size={16} />
        </button>
        <button 
          onClick={endStream}
          className="w-8 h-8 bg-red-500/80 hover:bg-red-600/90 rounded-full flex items-center justify-center text-white shadow-sm hover:shadow-md transition-all"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Live indicator */}
      <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-1.5"></span>
        LIVE
      </div>
      
      {/* Viewer count and drawer toggle */}
      <div className="absolute top-4 right-4 flex items-center space-x-3">
        {/* Viewer count with glassmorphic background */}
        <div className="flex items-center bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
          <div className="flex items-center">
            <Users size={12} className="text-white mr-1" />
            <span className="text-white text-xs">{viewers}</span>
          </div>
        </div>
        
        {/* Drawer toggle button with glassmorphic background */}
        <button 
          onClick={onToggleDrawer} 
          className="flex items-center justify-center w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full border border-white/10 text-white hover:bg-black/50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 7L13 12L8 17M16 7L21 12L16 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      {/* We're now using Agora's built-in chat UI so we've removed the custom chat components */}
    </div>
  );
}

// Component to display video
interface VideoPlayerProps {
  videoTrack: ICameraVideoTrack;
}

function VideoPlayer({ videoTrack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!videoRef.current) return;
    videoTrack.play(videoRef.current);
    
    return () => {
      videoTrack.stop();
    };
  }, [videoTrack]);
  
  return (
    <div 
      ref={videoRef} 
      className="w-full h-full agora-video-player"
    ></div>
  );
}

export default AgoraVideo;