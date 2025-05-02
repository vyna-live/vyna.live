import React, { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
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

interface ChatMessage {
  userId: string;
  name: string;
  message: string;
  color: string;
  isHost?: boolean;
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
  const [, setLocation] = useLocation();
  const [connectedAudienceIds, setConnectedAudienceIds] = useState<Set<string>>(new Set());
  
  // Client reference
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
  
  // RTM (Real-Time Messaging) client and channel
  const rtmClientRef = useRef<RtmClient | null>(null);
  const rtmChannelRef = useRef<RtmChannel | null>(null);
  
  // Reference to the interval timer for audience checking
  const audienceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
        
        // Create RTC client for video/audio
        const agoraClient = AgoraRTC.createClient(config);
        clientRef.current = agoraClient;
        
        // Set client role
        await agoraClient.setClientRole(role === 'host' ? 'host' : 'audience');
        
        // Listen for user-published events - this is crucial for viewing streamer content
        agoraClient.on('user-published', async (user, mediaType) => {
          console.log(`User ${user.uid} published ${mediaType} track`);
          
          try {
            // Subscribe to the remote user when they publish
            await agoraClient.subscribe(user, mediaType);
            console.log(`Subscribed to ${user.uid}'s ${mediaType} track successfully`);
            
            // Handle video track
            if (mediaType === 'video') {
              console.log('Remote video track received, user:', user);
              
              // Add user to remote users array if not already there
              setRemoteUsers(prev => {
                const exists = prev.some(u => u.uid === user.uid);
                if (!exists) {
                  console.log('Adding user to remoteUsers array:', user.uid);
                  return [...prev, user];
                }
                return prev;
              });
              
              // Ensure the video track plays into the correct container
              if (user.videoTrack) {
                // Force a small delay to ensure DOM is ready
                setTimeout(() => {
                  // For audience, use the correct container ID
                  const containerId = `remote-stream-${user.uid}`;
                  console.log(`Playing ${user.uid}'s video into container: ${containerId}`);
                  
                  try {
                    const container = document.getElementById(containerId);
                    if (container) {
                      user.videoTrack?.play(containerId);
                      console.log(`Successfully played ${user.uid}'s video track in ${containerId}`);
                    } else {
                      console.error(`Container ${containerId} not found in DOM`);
                      // Try playing directly in document body
                      user.videoTrack?.play("");
                    }
                  } catch (playErr) {
                    console.error(`Error playing video track:`, playErr);
                    // Fallback to playing without a specific container
                    try {
                      user.videoTrack?.play("");
                      console.log('Played video without specific container as fallback');
                    } catch (fallbackErr) {
                      console.error('Fallback play also failed:', fallbackErr);
                    }
                  }
                }, 300);
              }
            }
            
            // Handle audio track
            if (mediaType === 'audio') {
              if (user.audioTrack) {
                try {
                  user.audioTrack.play();
                  console.log(`Successfully played ${user.uid}'s audio track`);
                } catch (audioErr) {
                  console.error(`Error playing audio track:`, audioErr);
                }
              }
            }
          } catch (subscribeErr) {
            console.error(`Failed to subscribe to ${user.uid}'s ${mediaType} track:`, subscribeErr);
          }
        });
        
        // Create RTM client for chat
        try {
          // Create RTM Client
          const rtmClient = AgoraRTM.createInstance(appId);
          rtmClientRef.current = rtmClient;
          
          // Initialize RTM Client with detailed logging
          console.log(`Logging in to RTM with uid: ${uid.toString()}`);
          await rtmClient.login({
            uid: uid.toString()
          });
          
          // Create RTM Channel
          console.log(`Creating RTM channel: ${channelName}`);
          const rtmChannel = rtmClient.createChannel(channelName);
          rtmChannelRef.current = rtmChannel;
          
          // Register RTM channel events
          rtmChannel.on('ChannelMessage', (message: any, senderId: string) => {
            try {
              console.log(`Raw Channel message received from ${senderId}:`, message);
              
              let messageText;
              // Handle different message formats based on RTM SDK version
              if (typeof message === 'string') {
                // Legacy format: message is directly the string
                messageText = message;
                console.log('Detected legacy RTM message format (string)');
              } else if (message && typeof message.text === 'string') {
                // New format: message is an object with a text property
                messageText = message.text;
                console.log('Detected new RTM message format (object with text)'); 
              } else {
                console.error("Received invalid message format", message);
                return;
              }
              
              // Try to parse the message content
              const parsedMsg = JSON.parse(messageText);
              const { text, name, color, type } = parsedMsg;
              
              console.log(`Channel message parsed: ${text} from ${name || 'unknown'} (${senderId})`, parsedMsg);
              
              // Add explicit console logs for any message on host side
              if (role === 'host') {
                console.log('HOST RECEIVED MESSAGE:', {
                  type,
                  text,
                  sender: senderId,
                  fullMessage: parsedMsg
                });
              }
              
              // Special message handling for viewer notifications
              if (role === 'host' && type === 'viewer_join') {
                console.log('Received explicit viewer join notification:', parsedMsg);
                
                // Debug the DOM elements we're trying to update
                console.log('Looking for viewer count display element');
                const viewersElement = document.querySelector('.viewer-count-display');
                console.log('Viewer count element found:', viewersElement !== null);
                if (viewersElement) {
                  // Get the current count and increment
                  const currentCount = Number(viewersElement.textContent || '0');
                  const newCount = currentCount + 1;
                  
                  // Update DOM directly
                  viewersElement.textContent = String(newCount);
                  if (viewersElement instanceof HTMLElement) {
                    viewersElement.setAttribute('data-count', String(newCount));
                  }
                  
                  // Also update React state to keep it in sync
                  setViewers(newCount);
                  console.log(`Force-updated viewer count to ${newCount} via DOM`);
                }
                
                // Add the viewer to our tracking set
                setConnectedAudienceIds(prev => {
                  const updated = new Set(prev);
                  updated.add(senderId);
                  return updated;
                });
                
                // Add notification to chat
                setChatMessages(prev => {
                  const newMessages = [{
                    userId: senderId,
                    name: name || `Viewer ${senderId.slice(-4)}`,
                    message: "joined via explicit notification",
                    color: color || 'bg-green-500',
                    isHost: false
                  }, ...prev];
                  
                  if (newMessages.length > 8) {
                    return newMessages.slice(0, 8);
                  }
                  return newMessages;
                });
              }
              // Regular chat message handling
              else if (text) {
                // Add message to chat - prepend new messages so they show at the bottom
                setChatMessages(prev => {
                  const newMessages = [{
                    userId: senderId,
                    name: name || `User ${senderId.slice(-4)}`,
                    message: text,
                    color: color || 'bg-blue-500',
                    isHost: parsedMsg.isHost || false
                  }, ...prev];
                  
                  if (newMessages.length > 8) {
                    return newMessages.slice(0, 8);
                  }
                  return newMessages;
                });
              }
            } catch (err) {
              console.error("Error processing RTM message:", err);
            }
          });
          
          // Add specific handlers for RTM channel events
          rtmChannel.on('MemberJoined', (memberId) => {
            console.log(`RTM Member joined: ${memberId}, current role: ${role}`);
            
            // Update viewers count when member joins RTM channel - fixes audience count issue
            if (role === 'host' && memberId !== uid.toString()) {
              console.log(`Host detected new viewer: ${memberId}`);
              
              // Track the connected audience in a Set
              setConnectedAudienceIds(prev => {
                const updated = new Set(prev);
                updated.add(memberId);
                console.log('Updated audience set:', Array.from(updated));
                return updated;
              });
              
              // Force UI update with new viewer count
              setViewers(prevCount => {
                const newCount = prevCount + 1;
                console.log(`Viewer count updated: ${prevCount} -> ${newCount}`);
                return newCount;
              });
              
              // Add system notification for new viewer joining
              const randomColors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
              const color = randomColors[Math.floor(Math.random() * randomColors.length)];
              
              // Add a visible notification message
              setChatMessages(prev => {
                const newMessages = [{
                  userId: memberId,
                  name: `Viewer ${memberId.slice(-4)}`,
                  message: "joined the stream",
                  color,
                  isHost: false
                }, ...prev];
                
                if (newMessages.length > 8) {
                  return newMessages.slice(0, 8);
                }
                return newMessages;
              });
              
              // Broadcast a host message to all clients that a new viewer has joined
              try {
                if (rtmChannelRef.current) {
                  const announcement = {
                    text: `A new viewer has joined (${memberId.slice(-4)})`,
                    name: userName,
                    color: 'bg-emerald-500',
                    isHost: true,
                    isSystemMessage: true
                  };
                  rtmChannelRef.current.sendMessage({ text: JSON.stringify(announcement) })
                    .then(() => console.log('Sent viewer join announcement'))
                    .catch(err => console.error('Failed to send join announcement:', err));
                }
              } catch (err) {
                console.error('Error sending join announcement:', err);
              }
            }
          });
          
          rtmChannel.on('MemberLeft', (memberId) => {
            console.log(`RTM Member left: ${memberId}, current role: ${role}`);
            
            // Update viewers count when member leaves RTM channel
            if (role === 'host' && memberId !== uid.toString()) {
              console.log(`Host detected viewer leaving: ${memberId}`);
              
              // Remove from tracked audience set
              setConnectedAudienceIds(prev => {
                const updated = new Set(prev);
                updated.delete(memberId);
                console.log('Updated audience set after leave:', Array.from(updated));
                return updated;
              });
              
              // Force UI update with decreased viewer count
              setViewers(prevCount => {
                const newCount = Math.max(0, prevCount - 1);
                console.log(`Viewer count updated: ${prevCount} -> ${newCount}`);
                return newCount;
              });
              
              // Add system notification for viewer leaving
              const randomColors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
              const color = randomColors[Math.floor(Math.random() * randomColors.length)];
              
              // Add a visible notification message
              setChatMessages(prev => {
                const newMessages = [{
                  userId: memberId,
                  name: `Viewer ${memberId.slice(-4)}`,
                  message: "left the stream",
                  color,
                  isHost: false
                }, ...prev];
                
                if (newMessages.length > 8) {
                  return newMessages.slice(0, 8);
                }
                return newMessages;
              });
              
              // Broadcast a host message to all clients that a viewer has left
              try {
                if (rtmChannelRef.current) {
                  const announcement = {
                    text: `A viewer has left (${memberId.slice(-4)})`,
                    name: userName,
                    color: 'bg-pink-500',
                    isHost: true,
                    isSystemMessage: true
                  };
                  rtmChannelRef.current.sendMessage({ text: JSON.stringify(announcement) })
                    .then(() => console.log('Sent viewer leave announcement'))
                    .catch(err => console.error('Failed to send leave announcement:', err));
                }
              } catch (err) {
                console.error('Error sending leave announcement:', err);
              }
            }
          });
          
          // Get the initial member count when joining the channel
          rtmChannel.getMembers().then(members => {
            console.log(`RTM channel has ${members.length} members:`, members);
            
            // If we're the host, count other members as viewers
            if (role === 'host') {
              // Filter out our own ID to get just the audience
              const audienceMembers = members.filter(member => member !== uid.toString());
              const viewerCount = audienceMembers.length;
              console.log(`Setting initial viewer count to ${viewerCount}`);
              
              // Update state with the initial audience count
              setViewers(viewerCount);
              
              // Also track these members in our audience set
              if (audienceMembers.length > 0) {
                setConnectedAudienceIds(prev => {
                  const updated = new Set(prev);
                  audienceMembers.forEach(member => updated.add(member));
                  console.log('Initialized audience set:', Array.from(updated));
                  return updated;
                });
                
                // Send notifications for each existing audience member
                audienceMembers.forEach(member => {
                  const randomColors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
                  const color = randomColors[Math.floor(Math.random() * randomColors.length)];
                  
                  setChatMessages(prev => {
                    const newMessages = [{
                      userId: member,
                      name: `Viewer ${member.slice(-4)}`,
                      message: "is in the stream",
                      color,
                      isHost: false
                    }, ...prev];
                    
                    if (newMessages.length > 8) {
                      return newMessages.slice(0, 8);
                    }
                    return newMessages;
                  });
                });
              }
            }
          });
          
          // For host role, periodically check for audience members to ensure UI is accurate
          if (role === 'host') {
            audienceCheckIntervalRef.current = setInterval(() => {
              if (rtmChannelRef.current && isJoined) {
                rtmChannelRef.current.getMembers().then(members => {
                  // Filter out our own ID
                  const audienceMembers = members.filter(member => member !== uid.toString());
                  console.log(`Audience check: found ${audienceMembers.length} audience members:`, audienceMembers);
                  
                  // If audience count doesn't match our current count, update it
                  if (audienceMembers.length !== viewers) {
                    console.log(`Correcting audience count from ${viewers} to ${audienceMembers.length}`);
                    
                    // Force UI update with new count - using a callback to ensure fresh state
                    setViewers(audienceMembers.length);
                    
                    // Force component to re-render with the new value
                    setTimeout(() => {
                      console.log('Force re-render with new viewer count:', audienceMembers.length);
                      // This is redundant but forces state updates to be applied
                      setViewers(prevCount => {
                        if (prevCount !== audienceMembers.length) {
                          return audienceMembers.length;
                        }
                        return prevCount;
                      });
                    }, 100);
                  }
                  
                  // Update our tracking set - this must happen BEFORE the visualization
                  const prevSize = connectedAudienceIds.size;
                  const newAudienceIds = new Set(audienceMembers);
                  setConnectedAudienceIds(newAudienceIds);
                  
                  // Find any new audience members that we haven't announced yet
                  if (prevSize !== newAudienceIds.size) {
                    console.log(`Audience set size changed: ${prevSize} -> ${newAudienceIds.size}`);
                    
                    // Find new audience members
                    const newMembers = audienceMembers.filter(member => !Array.from(connectedAudienceIds).includes(member));
                    
                    if (newMembers.length > 0) {
                      console.log('Detected new audience members not in current set:', newMembers);
                      
                      // Add chat notifications for each new member
                      newMembers.forEach(member => {
                        // Add a visible notification message
                        const randomColors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
                        const color = randomColors[Math.floor(Math.random() * randomColors.length)];
                        
                        setChatMessages(prev => {
                          const newMessages = [{
                            userId: member,
                            name: `Viewer ${member.slice(-4)}`,
                            message: "newly detected in stream",
                            color,
                            isHost: false
                          }, ...prev];
                          
                          if (newMessages.length > 8) {
                            return newMessages.slice(0, 8);
                          }
                          return newMessages;
                        });
                      });
                    }
                  }
                  
                }).catch(err => {
                  console.error('Error in periodic audience check:', err);
                });
              }
            }, 5000); // Check every 5 seconds (reduced from 10)
          }
          
          // Join RTM channel
          await rtmChannel.join();
          console.log("Joined RTM channel:", channelName);
          
        } catch (rtmErr) {
          console.error("Error initializing RTM client:", rtmErr);
          // Continue without RTM if it fails
        }
        
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
          
          // Add to remote users list if not already there
          setRemoteUsers(prev => {
            if (prev.some(u => u.uid === user.uid)) return prev;
            console.log("Adding new remote user to state:", user.uid);
            return [...prev, user];
          });
          
          // Update viewer count
          setViewers(prev => prev + 1);
          
          // Force re-render when users join to update UI
          if (role === 'host') {
            console.log("Host notified of viewer joining, uid:", user.uid);
          }
          
          // For audience role handling of host joining
          if (role === 'audience') {
            console.log("Audience detected host joining, uid:", user.uid);
            // Note: We rely on user-published event for track playing now
            // This is just for notification and state management
          }
          
          // Add chat message for user joining, but with some delay to avoid initial connection messages
          setTimeout(() => {
            const randomColors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
            const color = randomColors[Math.floor(Math.random() * randomColors.length)];
            
            // Generate appropriate name based on role
            let displayName;
            if (role === 'host' && user.uid !== uid) {
              // Audience joining host's stream
              displayName = `Viewer ${user.uid.toString().slice(-4)}`;
            } else if (role === 'audience' && user.uid !== uid) {
              // Host joining stream that audience is viewing
              displayName = userName; // Use host name passed from props
            } else {
              // Generic fallback
              displayName = `User ${user.uid.toString().slice(-4)}`;
            }
            
            setChatMessages(prev => {
              const newMessages = [{
                userId: user.uid.toString(),
                name: displayName,
                message: "joined",
                color,
                isHost: user.uid !== uid && role === 'audience' // The host is the remote user when in audience mode
              }, ...prev];
              
              // Keep only the latest 8 messages
              if (newMessages.length > 8) {
                return newMessages.slice(0, 8);
              }
              return newMessages;
            });
          }, 2000); // Delay to avoid messages appearing for initial connections
        });
        
        // Listen for user-left events
        agoraClient.on('user-left', (user) => {
          console.log("User left:", user.uid);
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
          setViewers(prev => Math.max(0, prev - 1));
          
          // Add chat message for user leaving, only if we were tracking them (not initial disconnect)
          const randomColors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
          const color = randomColors[Math.floor(Math.random() * randomColors.length)];
            
          // Find if we had this user in our chat messages already
          // to get their proper name
          const existingUser = chatMessages.find(msg => msg.userId === user.uid.toString());
          
          // Generate appropriate name based on role
          let displayName;
          if (role === 'host' && user.uid !== uid) {
            // Audience leaving host's stream
            displayName = existingUser?.name || `Viewer ${user.uid.toString().slice(-4)}`;
          } else if (role === 'audience' && user.uid !== uid) {
            // Host leaving stream that audience is viewing
            displayName = userName; // Use host name passed from props
          } else {
            // Generic fallback
            displayName = existingUser?.name || `User ${user.uid.toString().slice(-4)}`;
          }
          
          setChatMessages(prev => {
            const newMessages = [{
              userId: user.uid.toString(),
              name: displayName,
              message: "left",
              color,
              isHost: user.uid !== uid && role === 'audience' // The host is the remote user when in audience mode
            }, ...prev];
            
            // Keep only the latest 8 messages
            if (newMessages.length > 8) {
              return newMessages.slice(0, 8);
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
      console.log("Component unmounting, cleaning up resources...");
      
      // Clear any interval timers
      if (audienceCheckIntervalRef.current) {
        clearInterval(audienceCheckIntervalRef.current);
        audienceCheckIntervalRef.current = null;
        console.log("Cleared audience check interval");
      }
      
      // Stop and clean up screen sharing if active
      if (screenTrackRef.current) {
        try {
          if (clientRef.current && isJoined) {
            clientRef.current.unpublish(screenTrackRef.current).catch(err => 
              console.error("Error unpublishing screen track:", err)
            );
          }
          screenTrackRef.current.close();
          screenTrackRef.current = null;
          console.log("Screen track cleaned up");
        } catch (error) {
          console.error("Error cleaning up screen track:", error);
        }
      }
      
      // Clean up audio track
      if (audioTrackRef.current) {
        try {
          if (clientRef.current && isJoined) {
            clientRef.current.unpublish(audioTrackRef.current).catch(err => 
              console.error("Error unpublishing audio track:", err)
            );
          }
          audioTrackRef.current.close();
          audioTrackRef.current = null;
          console.log("Audio track cleaned up");
        } catch (error) {
          console.error("Error cleaning up audio track:", error);
        }
      }
      
      // Clean up video track
      if (videoTrackRef.current) {
        try {
          if (clientRef.current && isJoined) {
            clientRef.current.unpublish(videoTrackRef.current).catch(err => 
              console.error("Error unpublishing video track:", err)
            );
          }
          videoTrackRef.current.close();
          videoTrackRef.current = null;
          console.log("Video track cleaned up");
        } catch (error) {
          console.error("Error cleaning up video track:", error);
        }
      }
      
      // Leave RTC channel
      if (clientRef.current && isJoined) {
        try {
          clientRef.current.leave().then(() => {
            console.log("Left RTC channel on cleanup");
          }).catch(err => {
            console.error("Error leaving RTC channel on cleanup:", err);
          });
        } catch (error) {
          console.error("Error leaving RTC channel:", error);
        }
      }
      
      // Leave RTM channel
      if (rtmChannelRef.current) {
        try {
          rtmChannelRef.current.leave().then(() => {
            console.log("Left RTM channel on cleanup");
          }).catch(err => {
            console.error("Error leaving RTM channel on cleanup:", err);
          });
        } catch (error) {
          console.error("Error leaving RTM channel:", error);
        }
      }
      
      // Logout RTM client
      if (rtmClientRef.current) {
        try {
          rtmClientRef.current.logout().then(() => {
            console.log("Logged out of RTM client on cleanup");
          }).catch(err => {
            console.error("Error logging out of RTM client on cleanup:", err);
          });
        } catch (error) {
          console.error("Error logging out of RTM client:", error);
        }
      }
      
      console.log("All Agora resources cleaned up");
    };
  }, [appId, role, channelName, uid, userName]);  // Added userName to dependencies as it's used for chat messages
  
  // Join call when ready is defined here
  const joinChannel = useCallback(async () => {
    // For audience, only need to check clientRef
    if (role === 'audience') {
      if (!clientRef.current) return;
    } else {
      // For host, need to check all tracks
      if (!clientRef.current || !audioTrackRef.current || !videoTrackRef.current) return;
    }
    
    try {
      setIsLoading(true);
      const client = clientRef.current;
      
      // Join the channel
      await client.join(appId, channelName, token || null, uid);
      console.log("Joined Agora channel:", channelName);
      
      // Publish tracks if host
      if (role === 'host') {
        console.log('Host joined channel, checking for audience members');
        // Publish audio and video tracks separately to avoid type errors
        // Add null checks to ensure tracks exist before publishing
        if (audioTrackRef.current) {
          await client.publish(audioTrackRef.current);
        }
        
        if (videoTrackRef.current) {
          await client.publish(videoTrackRef.current);
        }
        
        console.log("Published tracks to Agora channel");
        
        // Update database to set stream as active
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
            console.log('Stream marked as active in database');
            
            // Check for any existing audience members right after host joins
            if (rtmChannelRef.current) {
              rtmChannelRef.current.getMembers().then(members => {
                const audienceMembers = members.filter(member => member !== uid.toString());
                console.log(`Initial audience check after host join: ${audienceMembers.length} members:`, audienceMembers);
                
                // Update the audience count immediately
                if (audienceMembers.length > 0) {
                  setViewers(audienceMembers.length);
                  setConnectedAudienceIds(new Set(audienceMembers));
                  
                  // Notify about existing audience
                  audienceMembers.forEach(member => {
                    // Add a visible notification message
                    const randomColors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
                    const color = randomColors[Math.floor(Math.random() * randomColors.length)];
                    
                    setChatMessages(prev => {
                      const newMessages = [{
                        userId: member,
                        name: `Viewer ${member.slice(-4)}`,
                        message: "is already in the stream",
                        color,
                        isHost: false
                      }, ...prev];
                      
                      if (newMessages.length > 8) {
                        return newMessages.slice(0, 8);
                      }
                      return newMessages;
                    });
                  });
                }
              }).catch(err => {
                console.error('Error checking for audience after host join:', err);
              });
            }
          } else {
            console.error('Failed to update stream active status in database');
          }
        } catch (dbErr) {
          console.error('Error updating stream status:', dbErr);
          // Continue even if database update fails
        }
      }
      
      // Send explicit viewer_join notification when audience joins
      if (role === 'audience' && rtmChannelRef.current) {
        try {
          console.log('AUDIENCE SENDING VIEWER JOIN NOTIFICATION - THIS SHOULD BE VISIBLE');
          // Create and send a special notification that the host will recognize
          const viewerJoinMsg = {
            type: 'viewer_join',
            text: 'Viewer has joined the stream',
            name: userName,
            color: 'bg-green-500',
            timestamp: new Date().toISOString()
          };
          
          rtmChannelRef.current.sendMessage({ text: JSON.stringify(viewerJoinMsg) })
            .then(() => {
              console.log('Successfully sent viewer_join notification');
            })
            .catch(err => {
              console.error('Failed to send viewer_join notification:', err);
              // Try legacy format if modern format fails
              try {
                // @ts-ignore - For backward compatibility
                rtmChannelRef.current?.sendMessage(JSON.stringify(viewerJoinMsg));
                console.log('Sent viewer_join notification via legacy API');
              } catch (legacyErr) {
                console.error('Legacy sendMessage also failed:', legacyErr);
              }
            });
        } catch (notifyErr) {
          console.error('Error in viewer join notification:', notifyErr);
          // Continue even if notification fails
        }
      }
      
      setIsJoined(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Error joining Agora channel:", err);
      setError(err instanceof Error ? err.message : "Failed to join stream");
      setIsLoading(false);
    }
  }, [appId, channelName, token, uid, role]);
  
  // Auto-join for audience role
  useEffect(() => {
    if (role === 'audience' && clientRef.current && !isJoined && !isLoading) {
      console.log('Audience auto-joining stream');
      // Small delay to ensure client is ready
      const timer = setTimeout(() => {
        console.log('Executing audience auto-join now...');
        joinChannel();
      }, 800); // Increased delay for client readiness
      return () => clearTimeout(timer);
    }
  }, [role, isJoined, isLoading, joinChannel]);

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
      console.log("Ending stream...");
      
      // Stop and unpublish screen sharing if active
      if (isScreenSharing && screenTrackRef.current) {
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
      
      console.log('Preparing to send chat message:', messageObj);
      
      // Always add message locally first for immediate feedback
      addLocalMessage(uid.toString(), userName, chatInput, myColor, role === 'host');
      
      // Try to send via RTM if available
      if (rtmChannelRef.current) {
        try {
          // Add debug information
          console.log('RTM status:', rtmChannelRef.current?.channelId ? 'Connected to ' + rtmChannelRef.current.channelId : 'Not connected');
          
          // Send message via RTM
          const stringifiedMessage = JSON.stringify(messageObj);
          console.log('Sending RTM message:', stringifiedMessage);
          
          // Use explicit format to ensure message is properly sent
          // The message method is different depending on the version of Agora RTM SDK
          try {
            // First try the new API format
            const result = await rtmChannelRef.current.sendMessage({ text: stringifiedMessage });
            console.log("Message successfully sent via RTM (new API). Result:", result);
          } catch (apiError) {
            // If the above fails, try the legacy format
            console.log("Falling back to legacy RTM API format");
            // @ts-ignore - This is for backward compatibility with older RTM SDK
            await rtmChannelRef.current.sendMessage(stringifiedMessage);
            console.log("Message sent via RTM (legacy API)");
          }
        } catch (rtmError) {
          console.error("Failed to send message via RTM:", rtmError);
          // Message is already added locally, so we don't need to do it again
        }
      } else {
        // RTM is not available - message is already added locally
        console.warn('RTM channel not available - message only visible locally');
      }
      
      // Clear input regardless
      setChatInput('');
    } catch (err) {
      console.error("Error in overall send message process:", err);
    }
  };
  
  // Helper to add a message locally (without RTM)
  const addLocalMessage = (userId: string, name: string, message: string, color: string, isHost: boolean = false) => {
    setChatMessages(prev => {
      const newMessages = [{
        userId,
        name,
        message,
        color,
        isHost
      }, ...prev];
      
      // Keep only the latest 8 messages
      if (newMessages.length > 8) {
        return newMessages.slice(0, 8);
      }
      return newMessages;
    });
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
  
  // Toggle screen sharing
  const toggleScreenSharing = async () => {
    if (!clientRef.current) {
      console.error("Agora client is not initialized");
      return;
    }
    
    if (isScreenSharing) {
      // Stop screen sharing
      try {
        console.log("Stopping screen share...");
        if (screenTrackRef.current) {
          await clientRef.current.unpublish(screenTrackRef.current);
          screenTrackRef.current.close();
          screenTrackRef.current = null;
        }
        // Re-enable camera video
        if (videoTrackRef.current) {
          await videoTrackRef.current.setEnabled(true);
          await clientRef.current.publish(videoTrackRef.current);
          setIsVideoOn(true);
        }
        setIsScreenSharing(false);
        console.log("Screen sharing stopped successfully");
      } catch (error) {
        console.error("Error stopping screen sharing:", error);
      }
    } else {
      // Start screen sharing
      try {
        console.log("Starting screen share...");
        
        // Unpublish camera track first to avoid issues
        if (videoTrackRef.current && clientRef.current) {
          await videoTrackRef.current.setEnabled(false);
          await clientRef.current.unpublish(videoTrackRef.current);
        }
        
        // Create screen track with specific options
        let screenShare;
        try {
          screenShare = await AgoraRTC.createScreenVideoTrack({
            encoderConfig: "1080p_2",
            optimizationMode: "detail"
          });
          console.log("Screen track created successfully");
        } catch (e) {
          console.error("Failed to create screen track:", e);
          // Re-enable camera if screen sharing fails
          if (videoTrackRef.current && clientRef.current) {
            await videoTrackRef.current.setEnabled(true);
            await clientRef.current.publish([videoTrackRef.current]);
          }
          return;
        }
        
        // Handle the different return types from createScreenVideoTrack
        if (Array.isArray(screenShare)) {
          // If an array is returned (contains both video and audio)
          const [videoTrack] = screenShare;
          screenTrackRef.current = videoTrack;
          console.log("Screen track is an array, using video track");
        } else {
          // If only video track is returned
          screenTrackRef.current = screenShare;
          console.log("Screen track is a single track");
        }
        
        // Publish screen track
        try {
          await clientRef.current.publish(screenTrackRef.current);
          console.log("Published screen track successfully");
          setIsScreenSharing(true);
          
          // Handle screen sharing stopped by user through browser UI
          screenTrackRef.current.on("track-ended", async () => {
            console.log("Screen sharing track ended by browser");
            if (screenTrackRef.current && clientRef.current) {
              await clientRef.current.unpublish(screenTrackRef.current);
              screenTrackRef.current.close();
              screenTrackRef.current = null;
            }
              
            // Re-enable camera
            if (videoTrackRef.current && clientRef.current) {
              await videoTrackRef.current.setEnabled(true);
              await clientRef.current.publish([videoTrackRef.current]);
              setIsVideoOn(true);
            }
              
            setIsScreenSharing(false);
          });
        } catch (pubError) {
          console.error("Failed to publish screen track:", pubError);
          // Clean up and re-enable camera if publishing fails
          if (screenTrackRef.current) {
            screenTrackRef.current.close();
            screenTrackRef.current = null;
          }
          
          if (videoTrackRef.current && clientRef.current) {
            await videoTrackRef.current.setEnabled(true);
            await clientRef.current.publish([videoTrackRef.current]);
          }
        }
      } catch (error) {
        console.error("Error in screen sharing process:", error);
        // Ensure camera is re-enabled in case of errors
        if (videoTrackRef.current && clientRef.current) {
          await videoTrackRef.current.setEnabled(true);
          await clientRef.current.publish([videoTrackRef.current]);
        }
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-6 w-6 text-[#A67D44] animate-spin mb-2" />
          <p className="text-sm text-[#CDBCAB]">Connecting to stream...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center max-w-md p-4 bg-black/20 rounded-xl backdrop-blur-sm">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mx-auto mb-3">
            <X className="w-6 h-6 text-[#EFE9E1]" />
          </div>
          <h3 className="text-lg font-medium text-[#CDBCAB] mb-1">Stream Error</h3>
          <p className="text-sm text-[#CDBCAB] mb-3">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-1.5 text-sm bg-gradient-to-r from-[#A67D44] to-[#5D1C34] rounded-lg text-[#EFE9E1] hover:shadow-md transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Not joined yet - different screens for host and audience
  if (!isJoined) {
    // For audience, show connecting view and automatically try to join
    if (role === 'audience') {
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          <style>{customStyles}</style>
          <div className="text-center max-w-md mx-auto p-4">
            <div className="w-14 h-14 rounded-full mx-auto bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mb-3">
              <Loader2 className="w-7 h-7 text-[#EFE9E1] animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-[#CDBCAB] mb-1">Connecting to Stream</h3>
            <p className="text-sm text-[#CDBCAB] mb-3">
              Joining the livestream. This may take a moment...
            </p>
          </div>
        </div>
      );
    }
    
    // For host, show the "Go Live" button
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <style>{customStyles}</style>
        <div className="text-center max-w-md mx-auto p-4">
          <div className="w-14 h-14 rounded-full mx-auto bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mb-3">
            <Video className="w-7 h-7 text-[#EFE9E1]" />
          </div>
          <h3 className="text-lg font-medium text-[#CDBCAB] mb-1">Ready to Stream</h3>
          <p className="text-sm text-[#CDBCAB] mb-3">
            You're about to go live as <strong>{userName}</strong>. Click "Go Live" to start streaming.
          </p>
          
          {/* Preview of local video */}
          {videoTrackRef.current && (
            <div className="mb-4 relative rounded-lg overflow-hidden shadow-lg">
              <div className="w-full pb-[56.25%] relative"> {/* 16:9 aspect ratio */}
                <div className="absolute inset-0">
                  <VideoPlayer videoTrack={videoTrackRef.current} />
                </div>
              </div>
            </div>
          )}
          
          {/* Controls */}
          <div className="mb-4 flex justify-center space-x-3">
            <button 
              onClick={toggleAudio}
              className="p-2 rounded-full bg-[#242428] hover:bg-[#2C2C32] text-white"
            >
              {isAudioOn ? <Mic size={16} /> : <MicOff size={16} className="text-red-500" />}
            </button>
            <button 
              onClick={toggleVideo}
              className="p-2 rounded-full bg-[#242428] hover:bg-[#2C2C32] text-white"
            >
              {isVideoOn ? <Camera size={16} /> : <CameraOff size={16} className="text-red-500" />}
            </button>
          </div>
          
          <button 
            onClick={joinChannel}
            className="px-5 py-2 text-sm bg-gradient-to-r from-[#A67D44] to-[#5D1C34] hover:from-[#B68D54] hover:to-[#6D2C44] rounded-lg text-[#EFE9E1] hover:shadow-md transition-all"
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
      
      {/* Main video stream - show screen share when active, remote user video for audience, or regular video */}
      <div className="absolute inset-0 bg-black rounded-lg overflow-hidden">
        {isScreenSharing && screenTrackRef.current ? (
          // For screen sharing track
          <ScreenPlayer videoTrack={screenTrackRef.current} />
        ) : role === 'audience' ? (
          // For audience, show remote streams (the host)
          <div id={"remote-stream-" + remoteUsers[0]?.uid} className="w-full h-full">
            {!(remoteUsers.length > 0 && remoteUsers[0].videoTrack) && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-sm text-white">Waiting for host video...</div>
              </div>
            )}
          </div>
        ) : (
          // For host camera track
          videoTrackRef.current && <VideoPlayer videoTrack={videoTrackRef.current} />
        )}
      </div>
      
      {/* PIP camera view when screen sharing */}
      {isScreenSharing && videoTrackRef.current && (
        <div className="absolute top-4 left-4 w-40 h-24 rounded-lg overflow-hidden border border-gray-700 z-20">
          <VideoPlayer videoTrack={videoTrackRef.current} />
        </div>
      )}
      
      {/* Custom controls - centered at the bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-5 bg-black/40 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
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
          onClick={toggleScreenSharing}
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
            <span 
              className="text-white text-xs viewer-count-display"
              data-count={viewers} // Added data attribute for easier debugging
              key={Date.now()} // Force re-render on every render to ensure updates
              ref={(el) => {
                if (el) {
                  // Always make sure the element text matches the state
                  el.textContent = String(viewers);
                  console.log('Viewer count element rendered with value:', viewers);
                }
              }}
            >
              {viewers}
            </span>
          </div>
        </div>

        {/* Share button with transparent background */}
        <button
          onClick={() => {
            // Generate a shareable link with both host ID and channel name
            const baseUrl = window.location.origin;
            let shareUrl = '';
            
            // Get the current user's ID (host ID) through an API call
            fetch('/api/user')
              .then(response => {
                if (response.ok) {
                  return response.json();
                } else {
                  throw new Error('Not authenticated');
                }
              })
              .then(userData => {
                const hostId = userData.id.toString();
                // Create a share URL with host ID and channel name
                shareUrl = `${baseUrl}/view-stream/${hostId}?channel=${channelName}`;
                console.log('Generated share URL:', shareUrl);
                
                // Try to copy to clipboard, but handle errors without breaking
                try {
                  return navigator.clipboard.writeText(shareUrl);
                } catch (clipboardError) {
                  console.error('Could not copy to clipboard:', clipboardError);
                  // Just show the URL in a toast if copying fails
                  return Promise.resolve();
                }
              })
              .catch(err => {
                console.error('Error getting user data:', err);
                // Fallback to using channelName if user data can't be fetched
                shareUrl = `${baseUrl}/view-stream/channel-${channelName}`;
                try {
                  return navigator.clipboard.writeText(shareUrl);
                } catch (clipboardError) {
                  console.error('Could not copy to clipboard:', clipboardError);
                  // Just show the URL in a toast if copying fails
                  return Promise.resolve();
                }
              })
              .then(() => {
                // Show toast notification
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-sm py-2 px-4 rounded-full backdrop-blur-sm z-50';
                
                if (shareUrl) {
                  // If we couldn't copy, show the URL in the toast
                  toast.innerHTML = `<span>Stream link: <strong>${shareUrl}</strong></span>`;
                } else {
                  toast.textContent = 'Stream link copied to clipboard!';
                }
                
                document.body.appendChild(toast);
                
                // Remove the toast after 3 seconds (longer to read the URL if needed)
                setTimeout(() => {
                  toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
                  setTimeout(() => document.body.removeChild(toast), 300);
                }, 3000);
              });
          }}
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
    </div>
  );
}

export default AgoraVideo;