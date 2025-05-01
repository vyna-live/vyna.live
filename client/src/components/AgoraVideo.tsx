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
  IRemoteAudioTrack,
  ILocalVideoTrack
} from "agora-rtc-sdk-ng";
import AgoraRTM, { RtmClient, RtmMessage, RtmChannel } from 'agora-rtm-sdk';
import { Loader2, Video, X, Mic, MicOff, Camera, CameraOff, Users, Send, ScreenShare, MonitorUp, Share2, Copy } from 'lucide-react';
import { useLocation } from 'wouter';
import ShareStreamDialog from './ShareStreamDialog';
import { useToast } from "@/hooks/use-toast";

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

// Component to display camera video
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

// Component to display screen sharing video
interface ScreenPlayerProps {
  videoTrack: ILocalVideoTrack;
}

function ScreenPlayer({ videoTrack }: ScreenPlayerProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!screenRef.current) return;
    videoTrack.play(screenRef.current);
    
    return () => {
      videoTrack.stop();
    };
  }, [videoTrack]);
  
  return (
    <div 
      ref={screenRef} 
      className="w-full h-full agora-video-player"
    ></div>
  );
}

// Chat message interface
interface ChatMessage {
  userId: string;
  name: string;
  message: string;
  color: string;
  isHost?: boolean;
}

// AgoraVideo component props
interface AgoraVideoProps {
  appId: string;
  channelName: string;
  token?: string;
  uid?: number;
  role?: 'host' | 'audience';
  userName: string;
  hostId?: string | number;
  streamTitle?: string;
  onToggleDrawer?: () => void;
}

export function AgoraVideo({ 
  appId, 
  channelName, 
  token, 
  uid = Math.floor(Math.random() * 1000000),
  role = 'audience',
  userName,
  hostId,
  streamTitle = 'Live Stream',
  onToggleDrawer
}: AgoraVideoProps) {
  // State
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(true);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [viewers, setViewers] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const clientRef = useRef<IAgoraRTCClient>(AgoraRTC.createClient(config));
  const rtmClientRef = useRef<RtmClient | null>(null);
  const rtmChannelRef = useRef<RtmChannel | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
  const remoteUsersRef = useRef<IAgoraRTCRemoteUser[]>([]);
  
  // Navigation
  const [_, setLocation] = useLocation();
  
  // Handle toggling full screen
  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // State for share dialog
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false);
  const [currentHostId, setCurrentHostId] = useState<string | number>('');
  const { toast } = useToast();
  
  // Handle share button click
  const handleShareClick = async () => {
    try {
      // Get host ID from user data
      const response = await fetch('/api/user');
      
      if (!response.ok) {
        throw new Error('Failed to get user data');
      }
      
      const userData = await response.json();
      setCurrentHostId(userData.id);
      
      // Show the share dialog
      setShowShareDialog(true);
    } catch (error) {
      console.error('Error preparing share:', error);
      toast({
        title: "Couldn't prepare share link",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  // Toggle chat visibility
  const toggleChat = () => {
    setShowChat(!showChat);
  };
  
  // Join the Agora channel
  const joinChannel = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!appId) {
        throw new Error("App ID is required");
      }
      
      if (!channelName) {
        throw new Error("Channel name is required");
      }
      
      const client = clientRef.current;
      
      // Initialize RTM client
      if (AgoraRTM) {
        try {
          rtmClientRef.current = AgoraRTM.createInstance(appId);
          await rtmClientRef.current.login({
            uid: uid.toString()
          });
          
          rtmChannelRef.current = rtmClientRef.current.createChannel(channelName);
          
          // Handle channel messages
          rtmChannelRef.current.on('ChannelMessage', (message, senderId) => {
            try {
              const messageData = JSON.parse(message.text);
              
              setChatMessages(prev => [
                {
                  userId: senderId,
                  name: messageData.name || 'Anonymous',
                  message: messageData.text,
                  color: messageData.color || 'bg-gray-500',
                  isHost: messageData.isHost
                },
                ...prev
              ]);
            } catch (err) {
              console.error('Error parsing RTM message:', err);
            }
          });
          
          // Member joined events
          rtmChannelRef.current.on('MemberJoined', memberId => {
            console.log('Member joined:', memberId);
            
            // Update viewer count
            setViewers(prev => prev + 1);
            
            // Add join message to chat
            setChatMessages(prev => [
              {
                userId: memberId,
                name: memberId === uid.toString() ? userName : 'User',
                message: 'joined',
                color: 'bg-orange-500'
              },
              ...prev
            ]);
          });
          
          // Member left events
          rtmChannelRef.current.on('MemberLeft', memberId => {
            console.log('Member left:', memberId);
            
            // Update viewer count
            setViewers(prev => Math.max(0, prev - 1));
            
            // Add leave message to chat
            setChatMessages(prev => [
              {
                userId: memberId,
                name: memberId === uid.toString() ? userName : 'User',
                message: 'left',
                color: 'bg-orange-500'
              },
              ...prev
            ]);
          });
          
          // Join the channel
          await rtmChannelRef.current.join();
          console.log('Joined RTM channel:', channelName);
          
          // Get channel member count
          const members = await rtmChannelRef.current.getMembers();
          setViewers(members.length);
          console.log('Current channel members:', members.length);
          
        } catch (rtmError) {
          console.error('Error initializing RTM:', rtmError);
          // Continue without RTM if it fails
        }
      }
      
      // Event listeners for RTC client
      client.on('user-published', async (user, mediaType) => {
        console.log('User published:', user.uid, mediaType);
        
        await client.subscribe(user, mediaType);
        
        // Handle remote tracks
        if (mediaType === 'video') {
          remoteUsersRef.current.push(user);
          setViewers(remoteUsersRef.current.length + 1); // +1 for host
        }
        
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });
      
      client.on('user-unpublished', (user, mediaType) => {
        console.log('User unpublished:', user.uid, mediaType);
        
        if (mediaType === 'video') {
          remoteUsersRef.current = remoteUsersRef.current.filter(u => u.uid !== user.uid);
          setViewers(remoteUsersRef.current.length + 1); // +1 for host
        }
        
        if (mediaType === 'audio') {
          user.audioTrack?.stop();
        }
      });
      
      client.on('user-left', user => {
        console.log('User left:', user.uid);
        remoteUsersRef.current = remoteUsersRef.current.filter(u => u.uid !== user.uid);
        setViewers(remoteUsersRef.current.length + 1); // +1 for host
      });
      
      client.on('user-joined', user => {
        console.log('User joined:', user.uid);
      });
      
      client.on('connection-state-change', (curState, prevState, reason) => {
        console.log('Connection state changed:', prevState, '->', curState, 'reason:', reason);
        
        if (curState === 'DISCONNECTED') {
          console.log('Disconnected from Agora channel. Reason:', reason);
          
          // Attempt to reconnect if disconnected unexpectedly
          if (reason !== 'LEAVE') {
            console.log('Attempting to reconnect...');
            client.join(appId, channelName, token, uid)
              .then(() => {
                console.log('Reconnected to channel');
              })
              .catch(err => {
                console.error('Failed to reconnect:', err);
                setError("Connection lost. Please refresh.");
              });
          }
        }
      });
      
      // Join the channel as host or audience
      if (role === 'host') {
        console.log('Joining as host with UID:', uid);
        
        // Create audio and video tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { encoderConfig: 'high_quality' },
          { encoderConfig: { width: 640, height: 360, frameRate: 30 } }
        );
        
        audioTrackRef.current = audioTrack;
        videoTrackRef.current = videoTrack;
        
        // Join the channel with token
        await client.join(appId, channelName, token, uid);
        
        // Publish tracks
        await client.publish([audioTrack, videoTrack]);
        
        // Update stream status in database
        try {
          const response = await fetch('/api/stream/active', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              channelName,
              isActive: true
            })
          });
          
          if (response.ok) {
            console.log('Stream status updated in database');
          }
        } catch (err) {
          console.error('Failed to update stream status:', err);
        }
      } else {
        // Join as audience
        console.log('Joining as audience with UID:', uid);
        await client.join(appId, channelName, token, uid);
      }
      
      console.log('Successfully joined channel as', role);
      setIsJoined(true);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error joining channel:', error);
      setError(`Failed to join: ${error.message || 'Unknown error'}`);      
      setIsLoading(false);
    }
  };
  
  // Toggle audio mute
  const toggleAudio = async () => {
    if (!audioTrackRef.current) return;
    
    if (isAudioMuted) {
      await audioTrackRef.current.setMuted(false);
      setIsAudioMuted(false);
    } else {
      await audioTrackRef.current.setMuted(true);
      setIsAudioMuted(true);
    }
  };
  
  // Toggle video mute
  const toggleVideo = async () => {
    if (!videoTrackRef.current) return;
    
    if (isVideoMuted) {
      await videoTrackRef.current.setMuted(false);
      setIsVideoMuted(false);
    } else {
      await videoTrackRef.current.setMuted(true);
      setIsVideoMuted(true);
    }
  };
  
  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenTrackRef.current) {
        try {
          await clientRef.current.unpublish(screenTrackRef.current);
          screenTrackRef.current.close();
          screenTrackRef.current = null;
          setIsScreenSharing(false);
        } catch (error) {
          console.error("Error stopping screen sharing:", error);
        }
      }
    } else {
      try {
        // Create a new screen track
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, 'auto');
        
        if (Array.isArray(screenTrack)) {
          // If returns array [videoTrack, audioTrack]
          screenTrackRef.current = screenTrack[0];
          await clientRef.current.publish(screenTrack[0]);
        } else {
          // If returns just video track
          screenTrackRef.current = screenTrack;
          await clientRef.current.publish(screenTrack);
        }
        
        setIsScreenSharing(true);
        
        // Handle screen share stopped by browser UI
        screenTrackRef.current.on('track-ended', async () => {
          console.log('Screen sharing stopped via browser UI');
          await clientRef.current.unpublish(screenTrackRef.current);
          screenTrackRef.current.close();
          screenTrackRef.current = null;
          setIsScreenSharing(false);
        });
        
      } catch (error) {
        console.error("Error starting screen sharing:", error);
      }
    }
  };
  
  // End stream and leave channel
  const endStream = async () => {
    try {
      // Unpublish and close screen track if active
      if (screenTrackRef.current) {
        try {
          await clientRef.current.unpublish(screenTrackRef.current);
          screenTrackRef.current.close();
          screenTrackRef.current = null;
          setIsScreenSharing(false);
          console.log("Screen sharing stopped");
        } catch (error) {
          console.error("Error stopping screen sharing:", error);
        }
      }
      
      // Unpublish audio track
      if (audioTrackRef.current) {
        try {
          await clientRef.current.unpublish(audioTrackRef.current);
          audioTrackRef.current.close();
          console.log("Audio track unpublished");
        } catch (error) {
          console.error("Error unpublishing audio track:", error);
        }
      }
      
      // Unpublish video track
      if (videoTrackRef.current) {
        try {
          await clientRef.current.unpublish(videoTrackRef.current);
          videoTrackRef.current.close();
          console.log("Video track unpublished");
        } catch (error) {
          console.error("Error unpublishing video track:", error);
        }
      }
      
      // Leave RTM channel
      if (rtmChannelRef.current) {
        try {
          await rtmChannelRef.current.leave();
          console.log("Left RTM channel");
        } catch (error) {
          console.error("Error leaving RTM channel:", error);
        }
      }
      
      // Leave RTC channel
      try {
        await clientRef.current.leave();
        console.log("Left Agora channel");
      } catch (error) {
        console.error("Error leaving RTC channel:", error);
      }
      
      // Reset state
      setIsJoined(false);
      setViewers(0);
      setChatMessages([]);
      
      // Reset tracks to null
      audioTrackRef.current = null;
      videoTrackRef.current = null;
      
      console.log("Stream ended successfully");
      
      // Navigate to home page
      setTimeout(() => {
        setLocation("/");
        console.log("Navigating to home page");
      }, 1000);
      
    } catch (err) {
      console.error("Error ending stream:", err);
      
      // Force state reset in case of error
      setIsJoined(false);
      
      // Still navigate to home page even if there was an error
      setTimeout(() => {
        setLocation("/");
        console.log("Navigating to home page after error");
      }, 1000);
    }
  };
  
  // Send chat message
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    try {
      const randomColors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
      const myColor = randomColors[Math.floor(Math.random() * randomColors.length)];
      
      // Create message object
      const messageObj = {
        text: chatInput,
        name: userName,
        color: myColor,
        isHost: role === 'host'
      };
      
      // Try to send via RTM if available
      if (rtmChannelRef.current) {
        try {
          // Send message via RTM
          await rtmChannelRef.current.sendMessage({ text: JSON.stringify(messageObj) });
          console.log("Message sent via RTM");
        } catch (rtmError) {
          console.error("Error sending message via RTM:", rtmError);
          
          // Add message locally if sending fails
          setChatMessages(prev => [
            {
              userId: uid.toString(),
              name: userName,
              message: chatInput,
              color: myColor,
              isHost: role === 'host'
            },
            ...prev
          ]);
        }
      } else {
        // Add message locally if RTM isn't available
        setChatMessages(prev => [
          {
            userId: uid.toString(),
            name: userName,
            message: chatInput,
            color: myColor,
            isHost: role === 'host'
          },
          ...prev
        ]);
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
    }
  };
  
  // Handle chat form submission
  const handleChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChatMessage();
      setChatInput("");
    }
  };
  
  // Join channel on mount
  useEffect(() => {
    // Add custom styles
    const styleElement = document.createElement('style');
    styleElement.textContent = customStyles;
    document.head.appendChild(styleElement);
    
    // Initialize and join channel
    joinChannel();
    
    // Cleanup on unmount
    return () => {
      // Remove custom styles
      document.head.removeChild(styleElement);
      
      // Cleanup resources
      if (isJoined) {
        endStream();
      }
    };
  }, []);
  
  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0F1015]">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-[#0F1015] text-white">
        <Loader2 className="animate-spin h-8 w-8" />
        <p>Connecting to stream...</p>
      </div>
    );
  }
  
  // Render video interface
  return (
    <div className="relative h-full overflow-hidden bg-[#0F1015]">
      {/* Inject custom styles */}
      <style>{customStyles}</style>
      
      {/* Screen share or camera view */}
      <div className="relative h-full">
        {isScreenSharing && screenTrackRef.current ? (
          <div className="h-full">
            <ScreenPlayer videoTrack={screenTrackRef.current} />
            
            {/* Picture-in-picture for camera when screen sharing */}
            {!isVideoMuted && videoTrackRef.current && (
              <div className="absolute top-4 left-4 w-40 h-32 z-10 rounded-lg overflow-hidden shadow-md border border-gray-800">
                <VideoPlayer videoTrack={videoTrackRef.current} />
              </div>
            )}
          </div>
        ) : (
          // Regular camera view
          <div className="flex items-center justify-center h-full">
            {!isVideoMuted && videoTrackRef.current ? (
              <VideoPlayer videoTrack={videoTrackRef.current} />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <div className="p-8 rounded-full bg-gray-800/50">
                  <Video className="h-12 w-12 text-gray-400" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Live indicator - repositioned when screen sharing is active */}
      <div className={`absolute ${isScreenSharing ? 'top-4 left-52' : 'top-4 left-4'} bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center transition-all duration-300`}>
        <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-1.5"></span>
        LIVE
      </div>
      
      {/* Viewer count, share button, and drawer toggle */}
      <div className="absolute top-4 right-4 flex items-center space-x-3">
        {/* Viewer count with glassmorphic background */}
        <div className="flex items-center bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
          <div className="flex items-center">
            <Users size={12} className="text-white mr-1" />
            <span className="text-white text-xs">{viewers}</span>
          </div>
        </div>

        {/* Share button with transparent background */}
        <button
          onClick={handleShareClick}
          className="flex items-center justify-center w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full border border-white/10 text-white hover:bg-black/50 transition-colors"
        >
          <Share2 size={14} />
        </button>
        
        {/* Drawer toggle button with glassmorphic background */}
        <button 
          onClick={onToggleDrawer} 
          className="flex items-center justify-center w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full border border-white/10 text-white hover:bg-black/50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 7L13 12L8 17M16 7L21 12L16 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      {/* Chat container */}
      {showChat && (
        <div className="absolute left-4 bottom-24 w-72 flex flex-col">
          {/* Chat messages */}
          <div className="mb-2 overflow-y-auto max-h-48 flex flex-col-reverse">
            {chatMessages.map((chatMsg, index) => (
              <div key={index} className="animate-slideInUp mb-2">
                <div className="flex items-center space-x-1.5 py-1">
                  <div className={`w-5 h-5 rounded-full ${chatMsg.color} overflow-hidden flex items-center justify-center text-xs shadow-sm`}>
                    {chatMsg.name.charAt(0)}
                  </div>
                  <div className="flex items-center">
                    <span className="text-white text-xs font-medium">{chatMsg.name}</span>
                    
                    {/* Host badge if applicable */}
                    {chatMsg.isHost && (
                      <span className="bg-gradient-to-r from-[#5D1C34] to-[#A67D44] text-[9px] ml-1 px-1 py-0.5 rounded text-white font-medium">
                        HOST
                      </span>
                    )}
                  </div>
                  
                  {/* Message content */}
                  {chatMsg.message === "joined" || chatMsg.message === "left" ? (
                    <div className={`${chatMsg.message === "joined" ? "text-green-400" : "text-red-400"} text-xs ml-0.5`}>{chatMsg.message}</div>
                  ) : (
                    <div className={`${chatMsg.isHost ? "text-[#CDBCAB]" : "text-gray-300"} text-xs ${chatMsg.isHost ? "font-medium" : ""}`}>
                      {chatMsg.message}
                    </div>
                  )}
                </div>
                {index > 0 && (
                  <div className="border-t border-gray-800/30 my-1"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Chat input directly below messages */}
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
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white transition-colors border border-white/10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 10H8.01M12 10H12.01M16 10H16.01M12 18H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12H8C7.46957 12 6.96086 12.2107 6.58579 12.5858C6.21071 12.9609 6 13.4696 6 14V18H12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 18C19.0609 18 20.0783 18.4214 20.8284 19.1716C21.5786 19.9217 22 20.9391 22 22H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 18C4.93913 18 3.92172 18.4214 3.17157 19.1716C2.42143 19.9217 2 20.9391 2 22H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 6.1632C16.9368 7.58343 16.0518 8.87525 14.7213 9.54385C13.3908 10.2125 11.8219 10.0941 10.5973 9.22225C9.3728 8.35044 8.73662 6.87022 8.91891 5.3848C9.1012 3.89938 10.0682 2.62441 11.442 2.12261C12.8158 1.62081 14.3311 1.96011 15.3785 2.97685C16.4259 3.99359 16.8223 5.4947 16.37 6.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ShareStreamDialog */}
      <ShareStreamDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        hostId={currentHostId || hostId || ''}
        channelName={channelName}
        streamTitle={streamTitle}
      />
    </div>
  );
}

export default AgoraVideo;