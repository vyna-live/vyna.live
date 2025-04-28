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

interface ChatMessage {
  userId: string;
  name: string;
  message: string;
  color: string;
}

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
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
          
          // Add a chat message for user joining
          const randomColors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
          const color = randomColors[Math.floor(Math.random() * randomColors.length)];
          
          setChatMessages(prev => {
            const newMessages = [...prev, {
              userId: user.uid.toString(),
              name: `User ${user.uid.toString().slice(-4)}`,
              message: "joined",
              color
            }];
            
            // Keep only the latest 2 messages to prevent overlap with chat input
            if (newMessages.length > 2) {
              return newMessages.slice(newMessages.length - 2);
            }
            return newMessages;
          });
        });
        
        // Listen for user-left events
        agoraClient.on('user-left', (user) => {
          console.log("User left:", user.uid);
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
          setViewers(prev => Math.max(0, prev - 1));
          
          // Add a chat message for user leaving
          const randomColors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
          const color = randomColors[Math.floor(Math.random() * randomColors.length)];
          
          setChatMessages(prev => {
            const newMessages = [...prev, {
              userId: user.uid.toString(),
              name: `User ${user.uid.toString().slice(-4)}`,
              message: "left",
              color
            }];
            
            // Keep only the latest 2 messages to prevent overlap with chat input
            if (newMessages.length > 2) {
              return newMessages.slice(newMessages.length - 2);
            }
            return newMessages;
          });
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
  
  // Send chat message
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !clientRef.current) return;
    
    try {
      // Using Agora RTM to send message to channel
      // Instead we're just adding it locally for now
      const randomColors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
      const myColor = randomColors[Math.floor(Math.random() * randomColors.length)];
      
      setChatMessages(prev => {
        const newMessages = [...prev, {
          userId: uid.toString(),
          name: userName,
          message: chatInput,
          color: myColor
        }];
        
        // Keep only the latest 2 messages to prevent overlap with chat input
        if (newMessages.length > 2) {
          return newMessages.slice(newMessages.length - 2);
        }
        return newMessages;
      });
      
      // Clear input
      setChatInput('');
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };
  
  // Handle chat input submit
  const handleChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendChatMessage();
  };
  
  // Toggle chat visibility
  const toggleChat = () => {
    setShowChat(!showChat);
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
          onClick={async () => {
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
                const screenTrack = await AgoraRTC.createScreenVideoTrack();
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
              } catch (error) {
                console.error("Error starting screen sharing:", error);
              }
            }
          }}
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
        {/* Viewer count - now next to toggle button */}
        <div className="flex items-center">
          <div className="flex items-center">
            <Users size={12} className="text-white mr-1" />
            <span className="text-white text-xs">{viewers}</span>
          </div>
        </div>
        
        {/* Drawer toggle button - no background */}
        <button 
          onClick={onToggleDrawer} 
          className="text-white hover:text-gray-300 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 7L13 12L8 17M16 7L21 12L16 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      {/* Chat container */}
      {showChat && (
        <div className="absolute left-4 bottom-24 w-72 max-h-72 flex flex-col">
          {/* Chat messages */}
          <div className="overflow-y-auto max-h-64 flex flex-col-reverse pb-2 mb-2">
            {chatMessages.map((chatMsg, index) => (
              <div key={index} className="animate-slideInUp">
                <div className="flex items-center space-x-1.5 py-1">
                  <div className={`w-5 h-5 rounded-full ${chatMsg.color} overflow-hidden flex items-center justify-center text-xs shadow-sm`}>
                    {chatMsg.name.charAt(0)}
                  </div>
                  <div className="text-white text-xs font-medium">{chatMsg.name}</div>
                  {chatMsg.message === "joined" || chatMsg.message === "left" ? (
                    <div className={`text-${chatMsg.message === "joined" ? "green" : "red"}-400 text-xs ml-0.5`}>{chatMsg.message}</div>
                  ) : (
                    <div className="text-gray-300 text-xs">{chatMsg.message}</div>
                  )}
                </div>
                {index > 0 && (
                  <div className="border-t border-gray-800/30 my-1"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Chat input */}
          <form onSubmit={handleChatSubmit} className="relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send a message..."
              className="w-full bg-black/50 backdrop-blur-sm text-white text-xs rounded-lg py-2 pl-3 pr-10 border border-gray-800/50 focus:outline-none focus:ring-1 focus:ring-[#A67D44]/60"
            />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#A67D44] hover:text-[#B68D54] transition-colors"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
      
      {/* Chat toggle button */}
      <div className="absolute left-4 bottom-16">
        <button 
          onClick={toggleChat}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 10H8.01M12 10H12.01M16 10H16.01M12 18H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12H8C7.46957 12 6.96086 12.2107 6.58579 12.5858C6.21071 12.9609 6 13.4696 6 14V18H12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 18C19.0609 18 20.0783 18.4214 20.8284 19.1716C21.5786 19.9217 22 20.9391 22 22H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 18C4.93913 18 3.92172 18.4214 3.17157 19.1716C2.42143 19.9217 2 20.9391 2 22H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 6.1632C16.9368 7.58343 16.0518 8.87525 14.7213 9.54385C13.3908 10.2125 11.8219 10.0941 10.5973 9.22225C9.3728 8.35044 8.73662 6.87022 8.91891 5.3848C9.1012 3.89938 10.0682 2.62441 11.442 2.12261C12.8158 1.62081 14.3311 1.96011 15.3785 2.97685C16.4259 3.99359 16.8223 5.4947 16.37 6.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
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