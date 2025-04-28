import React, { useState, useEffect, useRef } from 'react';
import { createClient, createMicrophoneAndCameraTracks, ClientConfig, IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-react";
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
  
  // Create Agora client
  const useClient = createClient(config);
  const client = useClient();
  
  // Create audio and video tracks
  const { ready, tracks } = createMicrophoneAndCameraTracks();
  const [audioTrack, videoTrack] = tracks;

  useEffect(() => {
    // Don't try to connect if no appId
    if (!appId) {
      setError("Missing Agora App ID");
      setIsLoading(false);
      return;
    }
    
    // Wait for tracks to be ready
    if (!ready) return;
    
    setIsLoading(false);
  }, [appId, ready]);

  // Join call when ready
  const joinChannel = async () => {
    if (!client || !ready || !audioTrack || !videoTrack) return;
    
    try {
      setIsLoading(true);
      client.setClientRole(role);
      
      // Join the channel
      await client.join(appId, channelName, token || null, uid);
      console.log("Joined Agora channel:", channelName);
      
      // Publish tracks
      await client.publish([audioTrack, videoTrack]);
      console.log("Published tracks to Agora channel");
      
      setIsJoined(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Error joining Agora channel:", err);
      setError(err instanceof Error ? err.message : "Failed to join stream");
      setIsLoading(false);
    }
  };

  // Leave channel when component unmounts
  useEffect(() => {
    return () => {
      if (isJoined) {
        client.unpublish();
        client.leave();
        console.log("Left Agora channel");
      }
    };
  }, [client, isJoined]);

  // Toggle audio
  const toggleAudio = async () => {
    if (!audioTrack) return;
    
    if (isAudioOn) {
      await audioTrack.setEnabled(false);
    } else {
      await audioTrack.setEnabled(true);
    }
    
    setIsAudioOn(!isAudioOn);
  };

  // Toggle video
  const toggleVideo = async () => {
    if (!videoTrack) return;
    
    if (isVideoOn) {
      await videoTrack.setEnabled(false);
    } else {
      await videoTrack.setEnabled(true);
    }
    
    setIsVideoOn(!isVideoOn);
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
  if (!isJoined && client && ready) {
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
          {videoTrack && (
            <div className="mb-6 relative rounded-lg overflow-hidden shadow-lg">
              <div className="w-full pb-[56.25%] relative"> {/* 16:9 aspect ratio */}
                <div className="absolute inset-0">
                  <VideoPlayer videoTrack={videoTrack} />
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
        {videoTrack && <VideoPlayer videoTrack={videoTrack} />}
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
          onClick={() => {
            client?.unpublish();
            client?.leave();
            setIsJoined(false);
          }}
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