import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Video, Mic, Monitor, Share2, X, Camera, CameraOff, MicOff } from 'lucide-react';

interface StreamVideoComponentProps {
  apiKey: string;
  token: string;
  userId: string;
  callId: string;
  userName: string;
}

// Custom theme in TS object format
const theme = {
  colors: {
    primary: '#A67D44',
    secondary: '#5D1C34',
    accent: '#899481',
    background: {
      dark: '#0f1015',
      medium: '#16171d', 
      light: '#1a1b24'
    },
    text: {
      primary: '#EFE9E1',
      secondary: '#CDBCAB'
    },
    status: {
      error: '#dd2e44',
      success: '#3ba55c'
    }
  },
  gradients: {
    primary: 'linear-gradient(to right, #A67D44, #5D1C34)',
    secondary: 'linear-gradient(to right, #5D1C34, #A67D44)',
    hover: 'linear-gradient(to right, #B68D54, #6D2C44)',
    background: 'linear-gradient(to bottom right, #15162c, #1a1b33)'
  }
};

export function StreamVideoComponent({ apiKey, token, userId, callId, userName }: StreamVideoComponentProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Simulate connection to API
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnecting(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle video stream
  useEffect(() => {
    if (!isLive) return;
    
    const setupStream = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isCameraOn,
          audio: isMicOn
        });
        
        // Save reference to the stream
        streamRef.current = stream;
        
        // Set the stream to the video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error getting media devices:', err);
        setError('Unable to access camera or microphone. Please check permissions.');
      }
    };
    
    setupStream();
    
    // Clean up
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isLive, isCameraOn, isMicOn]);
  
  const startLivestream = () => {
    setIsLive(true);
  };
  
  const endLivestream = () => {
    setIsLive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };
  
  const toggleCamera = () => {
    if (streamRef.current && isLive) {
      const videoTracks = streamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const isEnabled = !isCameraOn;
        videoTracks.forEach(track => {
          track.enabled = isEnabled;
        });
      }
    }
    setIsCameraOn(!isCameraOn);
  };
  
  const toggleMic = () => {
    if (streamRef.current && isLive) {
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const isEnabled = !isMicOn;
        audioTracks.forEach(track => {
          track.enabled = isEnabled;
        });
      }
    }
    setIsMicOn(!isMicOn);
  };
  
  const toggleScreenShare = async () => {
    if (!isLive) return;
    
    try {
      if (isScreenSharing) {
        // Return to camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isCameraOn,
          audio: isMicOn
        });
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setIsScreenSharing(false);
      } else {
        // Share screen
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        if (streamRef.current) {
          const audioTracks = streamRef.current.getAudioTracks();
          audioTracks.forEach(track => {
            screenStream.addTrack(track);
          });
          
          streamRef.current.getTracks().forEach(track => {
            if (track.kind === 'video') {
              track.stop();
            }
          });
        }
        
        streamRef.current = screenStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        
        // Add listener for when user stops sharing
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error('Error sharing screen:', err);
      setIsScreenSharing(false);
    }
  };

  if (isConnecting) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-[#A67D44] animate-spin mb-2" />
          <p className="text-[#CDBCAB]">Connecting to the streaming service...</p>
        </div>
      </div>
    );
  }
  
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
  
  return (
    <div className="getstream-container w-full h-full bg-[#0f1015] rounded-lg overflow-hidden relative">
      {isLive ? (
        // Active stream view
        <div className="relative w-full h-full">
          {/* Video container */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#15162c]/90 to-[#1a1b33]/90 flex items-center justify-center">
            <video 
              ref={videoRef}
              className={`w-full h-full object-cover ${!isCameraOn && 'hidden'}`}
              autoPlay
              playsInline
              muted
            />
            
            {!isCameraOn && (
              <div className="p-6 text-center">
                <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mb-4">
                  <Video className="w-10 h-10 text-[#EFE9E1] opacity-50" />
                </div>
                <h3 className="text-xl font-medium text-[#CDBCAB] mb-2">Camera Off</h3>
                <p className="text-[#CDBCAB] mb-6 max-w-md mx-auto">
                  Your camera is currently turned off. Viewers cannot see you.
                </p>
              </div>
            )}
          </div>
          
          {/* Stream status indicator */}
          <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
            <span className="text-[#EFE9E1] text-sm">LIVE</span>
          </div>
          
          {/* Username display */}
          <div className="absolute bottom-20 left-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg">
            <span className="text-[#EFE9E1]">{userName || 'Streamer'}</span>
          </div>
          
          {/* Stream controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-2 rounded-full flex items-center space-x-3 bg-black/30 backdrop-blur-sm border border-white/10">
            <button 
              onClick={toggleMic}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isMicOn 
                  ? 'bg-[#11100F]/80 hover:bg-[#11100F] border border-[#CDBCAB]/20' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isMicOn ? (
                <Mic className="w-5 h-5 text-[#CDBCAB]" />
              ) : (
                <MicOff className="w-5 h-5 text-white" />
              )}
            </button>
            
            <button 
              onClick={toggleCamera}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isCameraOn 
                  ? 'bg-[#11100F]/80 hover:bg-[#11100F] border border-[#CDBCAB]/20' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isCameraOn ? (
                <Camera className="w-5 h-5 text-[#CDBCAB]" />
              ) : (
                <CameraOff className="w-5 h-5 text-white" />
              )}
            </button>
            
            <button 
              onClick={toggleScreenShare}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isScreenSharing 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-[#11100F]/80 hover:bg-[#11100F] border border-[#CDBCAB]/20'
              }`}
            >
              <Monitor className={`w-5 h-5 ${isScreenSharing ? 'text-white' : 'text-[#CDBCAB]'}`} />
            </button>
            
            <button 
              onClick={endLivestream}
              className="h-10 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-full flex items-center justify-center text-white font-medium"
            >
              End Stream
            </button>
          </div>
        </div>
      ) : (
        // Ready to stream view
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mb-4">
              <Video className="w-10 h-10 text-[#EFE9E1]" />
            </div>
            <h3 className="text-xl font-medium text-[#CDBCAB] mb-2">Ready to Stream</h3>
            <p className="text-[#CDBCAB] mb-6 max-w-md mx-auto">
              Your stream is ready to go live. Click the button below to start streaming to your audience.
            </p>
            <button 
              onClick={startLivestream}
              className="px-6 py-3 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] hover:from-[#B68D54] hover:to-[#6D2C44] rounded-lg text-[#EFE9E1] hover:shadow-md transition-all"
            >
              Go Live
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StreamVideoComponent;