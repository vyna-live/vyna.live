import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Send, Gift, Heart, Flag, X, Mic, Users } from 'lucide-react';
import Logo from './Logo';
import AgoraRTC, {
  ClientConfig, 
  IAgoraRTCClient,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';
import AgoraRTM, { RtmClient, RtmMessage, RtmChannel } from 'agora-rtm-sdk';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useIsMobile } from '@/hooks/use-mobile';

// Define Agora config for audience role
const config: ClientConfig = { 
  mode: "live", 
  codec: "vp8",
};

// Custom CSS for Agora components
const customStyles = `
  .agora-video-player {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(205, 188, 171, 0.2);
  }
  
  .viewer-chat-message {
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
  
  .pip-video {
    position: absolute;
    top: 16px;
    left: 16px;
    width: 160px;
    height: 90px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 40;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }
  
  /* Glassmorphic effect for controls */
  .control-button {
    background-color: rgba(25, 25, 35, 0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
    transition: all 0.2s ease-in-out;
  }
  
  .control-button:hover {
    background-color: rgba(45, 45, 55, 0.8);
    transform: scale(1.05);
  }
  
  .control-panel {
    background-color: rgba(15, 15, 20, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  }
`;

interface ChatMessage {
  userId: string;
  name: string;
  message: string;
  color: string;
  isHost?: boolean;
}

interface ViewerStreamInterfaceProps {
  appId: string;
  channelName: string;
  token?: string;
  uid?: number;
  username: string;
  streamTitle: string;
  hostName: string;
  hostAvatar?: string;
  viewerCount?: number;
}

export default function ViewerStreamInterface({
  appId,
  channelName,
  token,
  uid = Math.floor(Math.random() * 1000000),
  username,
  streamTitle,
  hostName,
  hostAvatar,
  viewerCount: externalViewerCount
}: ViewerStreamInterfaceProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [baseViewerCount, setBaseViewerCount] = useState<number>(0);
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [mainHostUid, setMainHostUid] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // References for Agora RTC and RTM clients
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const rtmClientRef = useRef<RtmClient | null>(null);
  const rtmChannelRef = useRef<RtmChannel | null>(null);
  
  // DOM references for video displays
  const mainVideoRef = useRef<HTMLDivElement>(null);
  const pipVideoRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // Set the initial viewer count from props
  useEffect(() => {
    // If externalViewerCount is provided externally (from API), use it as the base
    if (externalViewerCount && externalViewerCount > 0) {
      setBaseViewerCount(externalViewerCount);
      setViewerCount(externalViewerCount);
    }
  }, [externalViewerCount]);
  
  // Initialize the Agora RTC and RTM clients
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        
        if (!appId) {
          setError("Missing Agora App ID");
          setIsLoading(false);
          return;
        }
        
        // Create RTC client
        const agoraClient = AgoraRTC.createClient(config);
        clientRef.current = agoraClient;
        
        // Set client role to audience
        await agoraClient.setClientRole('audience');
        
        // Initialize RTM for chat
        try {
          // Create RTM Client
          const rtmClient = AgoraRTM.createInstance(appId);
          rtmClientRef.current = rtmClient;
          
          // Login to RTM
          await rtmClient.login({ uid: uid.toString() });
          
          // Create RTM Channel
          const rtmChannel = rtmClient.createChannel(channelName);
          rtmChannelRef.current = rtmChannel;
          
          // Handle incoming messages
          rtmChannel.on('ChannelMessage', (message: any, senderId: string) => {
            try {
              if (!message || typeof message.text !== 'string') {
                console.error("Received invalid message format", message);
                return;
              }
              
              const parsedMsg = JSON.parse(message.text);
              const { text, name, color } = parsedMsg;
              
              console.log(`Message received: ${text} from ${name || 'unknown'}`);
              
              // Add message to chat (new messages at bottom)
              setChatMessages(prev => {
                const newMessages = [...prev, {
                  userId: senderId,
                  name: name || `User ${senderId.slice(-4)}`,
                  message: text || "sent a message",
                  color: color || 'bg-blue-500',
                  isHost: parsedMsg.isHost || false
                }];
                
                // Keep only the latest 50 messages
                if (newMessages.length > 50) {
                  return newMessages.slice(-50);
                }
                return newMessages;
              });
              
              // Auto-scroll to bottom of message container
              if (messageContainerRef.current) {
                setTimeout(() => {
                  if (messageContainerRef.current) {
                    messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
                  }
                }, 100);
              }
            } catch (err) {
              console.error("Error parsing RTM message:", err);
            }
          });
          
          // Join RTM channel
          await rtmChannel.join();
          console.log("Joined RTM channel:", channelName);
          
        } catch (rtmErr) {
          console.error("Error initializing RTM client:", rtmErr);
          // Continue without RTM if it fails
        }
        
        // Event listeners for RTC client
        agoraClient.on('user-published', async (user, mediaType) => {
          // When a broadcaster publishes a track
          console.log("Remote user published:", user.uid, mediaType);
          
          // Subscribe to the remote user
          await agoraClient.subscribe(user, mediaType);
          
          // Save the first host UID we see for identifying the main host
          if (mainHostUid === null) {
            console.log("Setting main host UID to:", user.uid);
            setMainHostUid(user.uid as number);
          }
          
          // If we haven't already added this user
          if (!remoteUsers.find(u => u.uid === user.uid)) {
            setRemoteUsers(prev => [...prev, user]);
            setViewerCount(prev => prev + 1);
          }
          
          // Handle video tracks
          if (mediaType === 'video') {
            // Detect if this is a screen sharing track
            // Screen shares typically have higher resolution
            const videoTrack = user.videoTrack;
            if (videoTrack) {
              // Determine if this is a screen share track
              // Screen shares typically have higher resolution, but we'll
              // use a simple heuristic since exact dimension info may not be available
              // through the stats API in all browsers
              const stats = videoTrack.getStats();
              // We'll use a simpler check since the exact properties may vary
              const isScreenShare = user.uid.toString().includes('screenshare') || 
                               (remoteUsers.length > 1 && mainHostUid !== user.uid);
              
              console.log("Video track stats:", stats, "Is screen share:", isScreenShare);
              
              // Update screen share state
              setIsScreenShared(isScreenShare);
              
              // If this is the main host or only remote user
              if ((mainHostUid === user.uid || remoteUsers.length === 0) && !isScreenShare) {
                // Keep host camera in main view if no screen share
                if (mainVideoRef.current) {
                  videoTrack.play(mainVideoRef.current);
                }
              } else if ((mainHostUid === user.uid || remoteUsers.length === 0) && isScreenShare) {
                // For host screen share, move host camera to PIP if available
                if (pipVideoRef.current && mainVideoRef.current && user.videoTrack) {
                  // Play screen share in main view
                  videoTrack.play(mainVideoRef.current);
                }
              } else {
                // For other users, play in appropriate containers
                if (videoTrack) {
                  // Decide where to play based on screen sharing state
                  if (mainVideoRef.current && !isScreenShared) {
                    videoTrack.play(mainVideoRef.current);
                  } else if (pipVideoRef.current && isScreenShared) {
                    videoTrack.play(pipVideoRef.current);
                  }
                }
              }
            }
          }
          
          // Handle audio tracks
          if (mediaType === 'audio' && user.audioTrack) {
            user.audioTrack.play();
          }
        });
        
        // When a remote user unpublishes
        agoraClient.on('user-unpublished', (user, mediaType) => {
          console.log("Remote user unpublished:", user.uid, mediaType);
          
          // If it was video, check if it was screen sharing
          if (mediaType === 'video' && user.videoTrack) {
            user.videoTrack.stop();
            
            // If we were in screen share mode, reset it
            setIsScreenShared(false);
          }
          
          // If it was audio
          if (mediaType === 'audio' && user.audioTrack) {
            user.audioTrack.stop();
          }
        });
        
        // When a user leaves
        agoraClient.on('user-left', (user) => {
          console.log("Remote user left:", user.uid);
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
          setViewerCount(prev => Math.max(0, prev - 1));
          
          // If the main host left, reset the main host UID
          if (mainHostUid === user.uid) {
            setMainHostUid(null);
            setIsScreenShared(false);
          }
          
          // Add a chat message for user leaving
          const randomColors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500'];
          const color = randomColors[Math.floor(Math.random() * randomColors.length)];
          
          setChatMessages(prev => {
            // Add message to the end
            const newMessages = [...prev, {
              userId: user.uid.toString(),
              name: `User ${user.uid.toString().slice(-4)}`,
              message: "left",
              color,
              isHost: false
            }];
            
            // Keep only the latest 50 messages
            if (newMessages.length > 50) {
              return newMessages.slice(-50);
            }
            return newMessages;
          });
        });
        
        // Join the channel
        await agoraClient.join(appId, channelName, token || null, uid);
        console.log("Joined Agora channel:", channelName);
        
        setIsJoined(true);
        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing Agora:", err);
        setError(err instanceof Error ? err.message : "Failed to join stream");
        setIsLoading(false);
      }
    };
    
    init();
    
    // Cleanup function
    return () => {
      // Leave Agora RTC channel
      if (clientRef.current && isJoined) {
        clientRef.current.leave().then(() => {
          console.log("Left RTC channel");
        }).catch(err => {
          console.error("Error leaving RTC channel:", err);
        });
      }
      
      // Leave RTM channel
      if (rtmChannelRef.current) {
        rtmChannelRef.current.leave().then(() => {
          console.log("Left RTM channel");
        }).catch(err => {
          console.error("Error leaving RTM channel:", err);
        });
      }
      
      // Logout RTM client
      if (rtmClientRef.current) {
        rtmClientRef.current.logout().then(() => {
          console.log("Logged out of RTM client");
        }).catch(err => {
          console.error("Error logging out of RTM client:", err);
        });
      }
    };
  }, [appId, channelName, token, uid, remoteUsers, mainHostUid]);
  
  // Handle sending a chat message
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!chatInput.trim() || !rtmChannelRef.current) return;
    
    // Create message object
    const chatMessage = {
      text: chatInput.trim(),
      name: username,
      color: 'bg-blue-500',
      isHost: false
    };
    
    try {
      // Send message via RTM
      await rtmChannelRef.current.sendMessage({ text: JSON.stringify(chatMessage) });
      
      // Add message to local state (at the end)
      setChatMessages(prev => {
        const newMessages = [...prev, {
          userId: uid.toString(),
          name: username,
          message: chatInput.trim(),
          color: 'bg-blue-500',
          isHost: false
        }];
        
        // Keep only the latest 50 messages
        if (newMessages.length > 50) {
          return newMessages.slice(-50);
        }
        return newMessages;
      });
      
      // Clear input
      setChatInput('');
      
      // Auto-scroll to bottom
      if (messageContainerRef.current) {
        setTimeout(() => {
          if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };
  
  // Handle sending a gift/reaction
  const handleSendGift = async () => {
    if (!rtmChannelRef.current) return;
    
    // Create gift message object
    const giftMessage = {
      text: "❤️", // Heart emoji as gift
      name: username,
      color: 'bg-red-500',
      isGift: true
    };
    
    try {
      // Send message via RTM
      await rtmChannelRef.current.sendMessage({ text: JSON.stringify(giftMessage) });
      
      toast({
        title: "Gift Sent",
        description: "Your appreciation has been sent to the streamer!",
      });
    } catch (error) {
      console.error("Error sending gift:", error);
      toast({
        title: "Error",
        description: "Failed to send gift",
        variant: "destructive"
      });
    }
  };
  
  // Handle leaving the stream
  const handleLeaveStream = () => {
    // Attempt to leave properly
    if (clientRef.current && isJoined) {
      clientRef.current.leave().catch(console.error);
    }
    
    if (rtmChannelRef.current) {
      rtmChannelRef.current.leave().catch(console.error);
    }
    
    if (rtmClientRef.current) {
      rtmClientRef.current.logout().catch(console.error);
    }
    
    // Navigate back to home page
    setLocation('/');
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-black flex flex-col">
      <style>{customStyles}</style>
      
      {/* Header with stream info */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <a href="/" className="transition-opacity hover:opacity-80">
            <Logo variant="light" size="sm" className="h-7" />
          </a>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden mr-2 border border-white/20">
              {hostAvatar ? (
                <img 
                  src={hostAvatar} 
                  alt={hostName}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#5D1C34] to-[#A67D44] flex items-center justify-center text-white">
                  {hostName.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-white text-sm font-medium">{hostName}</span>
          </div>
          
          <div className="flex items-center bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
            <Users size={14} className="text-white mr-2" />
            <span className="text-white text-sm">{viewerCount}</span>
          </div>
        </div>
      </div>

      {/* Stream title at top center */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
        <div className="text-white text-sm font-medium bg-black/40 backdrop-blur-sm px-4 py-1 rounded-full">
          {streamTitle}
        </div>
      </div>
      
      {/* Main content - video display */}
      <div className="flex-1 relative bg-black">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
            <div className="text-white text-lg ml-4">Joining Stream...</div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="z-10 bg-black/70 backdrop-blur-sm p-6 rounded-lg border border-red-500/30">
              <div className="text-red-400 text-xl mb-4">Stream Error</div>
              <div className="text-white mb-4">{error}</div>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            {/* Main video stream */}
            <div ref={mainVideoRef} className="w-full h-full agora-video-player"></div>
            
            {/* PIP camera when screen sharing is active */}
            {isScreenShared && (
              <div ref={pipVideoRef} className="absolute top-4 left-4 w-40 h-24 rounded-lg overflow-hidden border border-gray-700 z-20"></div>
            )}
            
            {/* Chat messages display area */}
            <div 
              ref={messageContainerRef}
              className="absolute bottom-24 left-4 w-64 sm:w-72 md:w-80 max-h-[40vh] overflow-y-auto bg-black/30 backdrop-blur-sm rounded-lg border border-gray-700/50 px-2 py-2"
              style={{ scrollBehavior: 'smooth' }}
            >
              {chatMessages.length > 0 ? (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className="viewer-chat-message mb-2 animate-in fade-in duration-300">
                    <div className="flex items-start">
                      <div className={`w-5 h-5 mt-0.5 rounded-full ${msg.color} flex items-center justify-center text-xs shadow-sm`}>
                        {msg.name.charAt(0)}
                      </div>
                      <div className="ml-2">
                        <div className="flex items-center">
                          <span className="text-white text-xs font-medium">{msg.name}</span>
                          {msg.isHost && (
                            <span className="bg-gradient-to-r from-[#5D1C34] to-[#A67D44] text-[9px] ml-1 px-1 py-0.5 rounded text-white font-medium">
                              HOST
                            </span>
                          )}
                        </div>
                        <div className="text-gray-200 text-xs">{msg.message}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 text-xs py-2">Chat messages will appear here</div>
              )}
            </div>
            
            {/* Centered control buttons (like in the image) */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/40 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10">
              <button 
                onClick={handleSendGift}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/70 text-white hover:text-pink-400 transition-colors"
              >
                <Gift size={22} />
              </button>
              
              <button 
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/70 text-white hover:text-red-400 transition-colors"
              >
                <Heart size={22} />
              </button>
              
              <button 
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/70 text-white hover:text-yellow-400 transition-colors"
              >
                <Flag size={22} />
              </button>
              
              <button 
                onClick={handleLeaveStream}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <X size={22} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom chat input */}
      <div className="absolute bottom-4 left-4 z-20">
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            className="w-64 sm:w-72 md:w-80 bg-black/60 backdrop-blur-sm text-white placeholder-gray-400 border border-gray-700 rounded-full py-2 px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D1C34]/50"
          />
          <button 
            type="submit" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            disabled={!chatInput.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
