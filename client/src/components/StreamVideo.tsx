import React, { useState, useEffect } from 'react';
import { Loader2, Video, Mic, Monitor, Share2, X } from 'lucide-react';

interface StreamVideoComponentProps {
  apiKey: string;
  token: string;
  userId: string;
  callId: string;
  userName: string;
}

export function StreamVideoComponent({ apiKey, token, userId, callId, userName }: StreamVideoComponentProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Simulate connection to the Stream API
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!apiKey || !token || !userId || !callId) {
        setError('Missing stream configuration parameters');
      } else {
        setIsConnecting(false);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [apiKey, token, userId, callId]);
  
  const startStream = () => {
    setIsStreamActive(true);
  };
  
  const endStream = () => {
    setIsStreamActive(false);
  };
  
  const toggleMic = () => {
    setIsMicOn(!isMicOn);
  };
  
  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
  };
  
  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
  };

  if (isConnecting) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-[#A67D44] animate-spin mb-2" />
          <p className="text-[#CDBCAB]">Connecting to stream...</p>
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
      {isStreamActive ? (
        // Active stream view
        <div className="relative w-full h-full">
          {/* Video container */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#15162c]/90 to-[#1a1b33]/90 flex items-center justify-center">
            {isCameraOn ? (
              <div className="relative w-full h-full">
                {/* Mock video feed with overlays */}
                <div className="absolute inset-0 bg-[#0a0a0a]">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#5D1C34] via-[#A67D44] to-[#899481] flex items-center justify-center animate-pulse">
                      <span className="text-xl font-medium text-[#EFE9E1]">{userName.charAt(0)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Video overlay message */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <p className="text-[#CDBCAB]">Live preview (GetStream integration simulation)</p>
                </div>
              </div>
            ) : (
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
            <span className="text-[#EFE9E1]">{userName}</span>
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
              <Mic className={`w-5 h-5 ${isMicOn ? 'text-[#CDBCAB]' : 'text-white'}`} />
            </button>
            
            <button 
              onClick={toggleCamera}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isCameraOn 
                  ? 'bg-[#11100F]/80 hover:bg-[#11100F] border border-[#CDBCAB]/20' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Video className={`w-5 h-5 ${isCameraOn ? 'text-[#CDBCAB]' : 'text-white'}`} />
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
              onClick={endStream}
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
              onClick={startStream}
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