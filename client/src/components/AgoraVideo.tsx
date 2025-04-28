import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, { 
  ClientConfig, 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  ConnectionState,
  ConnectionDisconnectedReason
} from "agora-rtc-sdk-ng";
import { Loader2, Video, X, Mic, MicOff, Camera, CameraOff } from 'lucide-react';

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
`;

interface AgoraVideoProps {
  appId: string;
  channelName: string;
  token?: string;
  uid?: number;
  role?: 'host' | 'audience';
  userName: string;
}

export function AgoraVideo({ 
  appId, 
  channelName, 
  token, 
  uid = Math.floor(Math.random() * 1000000),
  role = 'host',
  userName
}: AgoraVideoProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  
  // Client reference
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  
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
      
      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center space-x-4 agora-controls">
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
        <button 
          onClick={endStream}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white"
        >
          End Stream
        </button>
      </div>
      
      {/* Live indicator */}
      <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-1.5"></span>
        LIVE
      </div>
      
      {/* Username */}
      <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
        {userName}
      </div>
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