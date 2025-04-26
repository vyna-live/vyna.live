import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  UID
} from 'agora-rtc-sdk-ng';

interface AgoraState {
  localAudioTrack: IMicrophoneAudioTrack | null;
  localVideoTrack: ICameraVideoTrack | null;
  remoteUsers: IAgoraRTCRemoteUser[];
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AgoraConfig {
  mode?: 'rtc' | 'live';
  codec?: 'vp8' | 'h264';
  role?: 'host' | 'audience';
}

interface InitOptions {
  channelName?: string;
}

export function useAgora(config: AgoraConfig = {}) {
  const { 
    mode = 'rtc', 
    codec = 'vp8',
    role = 'host'
  } = config;

  // State
  const [state, setState] = useState<AgoraState>({
    localAudioTrack: null,
    localVideoTrack: null,
    remoteUsers: [],
    isAudioEnabled: true,
    isVideoEnabled: true,
    isConnected: false,
    isLoading: false,
    error: null
  });
  
  // Refs
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const channelNameRef = useRef<string | null>(null);
  const appIdRef = useRef<string | null>(null);
  const uidRef = useRef<string | null>(null);
  const initializedRef = useRef<boolean>(false);
  const apiRequestInProgressRef = useRef<boolean>(false);
  const isJoiningChannelRef = useRef<boolean>(false);
  const lastConnectionAttemptRef = useRef<number>(0);
  
  /**
   * Initialize Agora RTC client with caching to prevent duplicate API calls
   */
  const init = useCallback(async (options: InitOptions = {}) => {
    try {
      // Strict throttling - only allow one request per 2 seconds to prevent API flooding
      const now = Date.now();
      const timeSinceLastAttempt = now - lastConnectionAttemptRef.current;
      
      // If we're already making a request or we've made one too recently, return existing data
      if (apiRequestInProgressRef.current || timeSinceLastAttempt < 2000) {
        console.log(`Throttling API call - ${apiRequestInProgressRef.current ? 'request in progress' : `${timeSinceLastAttempt}ms since last call`}`);
        return {
          channelName: channelNameRef.current || '',
          uid: uidRef.current || '',
          appId: appIdRef.current || ''
        };
      }
      
      lastConnectionAttemptRef.current = now;
      
      // If already initialized with the same channel, just return the existing config
      if (
        initializedRef.current &&
        clientRef.current &&
        appIdRef.current &&
        channelNameRef.current === options.channelName &&
        uidRef.current
      ) {
        console.log('Using cached Agora configuration');
        return {
          channelName: channelNameRef.current,
          uid: uidRef.current,
          appId: appIdRef.current
        };
      }
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      apiRequestInProgressRef.current = true;
      
      let appId = appIdRef.current;
      let uid = uidRef.current;
      let channelName = options.channelName || `channel-${Date.now()}`;
      
      try {
        // Create Agora client if it doesn't exist
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({ mode, codec });
        }
        
        // Get app ID from server if we don't have it cached
        if (!appId) {
          const appIdResponse = await fetch('/api/agora/app-id');
          const appIdData = await appIdResponse.json();
          
          if (!appIdData.appId) {
            throw new Error('Failed to get Agora App ID from server');
          }
          
          appId = appIdData.appId;
          appIdRef.current = appId;
        }
        
        // Store channel name in ref
        channelNameRef.current = channelName;
        
        // Only make the channel API call if we need a new channel
        if (!uid || channelNameRef.current !== options.channelName) {
          const channelResponse = await fetch('/api/agora/channel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              channelName,
              role
            })
          });
          
          const channelData = await channelResponse.json();
          
          if (!channelData.uid) {
            throw new Error('Failed to initialize channel');
          }
          
          // For AgoraRTC we need to use numbers for UIDs
          // Convert the string UID to a number by hashing it
          const uidNumber = parseInt(channelData.uid.substring(0, 8), 16) % 1000000;
          uid = String(uidNumber);
          uidRef.current = uid;
          
          console.log('Channel initialized:', { 
            channelName, 
            originalUid: channelData.uid,
            convertedUid: uid 
          });
        }
        
        // Create local tracks with explicit configurations
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: {
            sampleRate: 48000,
            stereo: true,
            bitrate: 128 // Higher quality audio
          }
        });
        
        // Explicitly enable the audio track
        audioTrack.setEnabled(true);
        
        const videoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: {
            width: 1280,
            height: 720,
            frameRate: 30,
            bitrateMin: 600,
            bitrateMax: 1500
          }
        });
        
        // Explicitly enable the video track
        videoTrack.setEnabled(true);
        
        // Update state with initial tracks
        setState(prev => ({
          ...prev,
          localAudioTrack: audioTrack,
          localVideoTrack: videoTrack,
          isLoading: false,
          isConnected: false,
          isAudioEnabled: true,
          isVideoEnabled: true
        }));
        
        initializedRef.current = true;
        
        return {
          channelName,
          uid,
          appId
        };
      } finally {
        apiRequestInProgressRef.current = false;
      }
    } catch (error: any) {
      console.error('Error initializing Agora:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error initializing Agora'
      }));
      apiRequestInProgressRef.current = false;
      throw error;
    }
  }, [mode, codec, role]);
  
  /**
   * Join a channel with protection against multiple simultaneous join attempts
   */
  const join = useCallback(async (channelName?: string) => {
    try {
      // Check if we're already joining or if we've recently attempted to join
      if (isJoiningChannelRef.current) {
        console.log('Already joining a channel, ignoring duplicate call');
        return { channelName: channelNameRef.current };
      }
      
      // Throttle connection attempts - no more than one attempt every 2 seconds
      const now = Date.now();
      const timeSinceLastAttempt = now - lastConnectionAttemptRef.current;
      if (timeSinceLastAttempt < 2000) {
        console.log(`Throttling connection attempt (${timeSinceLastAttempt}ms since last attempt)`);
        return { channelName: channelNameRef.current };
      }
      
      lastConnectionAttemptRef.current = now;
      isJoiningChannelRef.current = true;
      
      // Check if client is already connected to avoid "already connected" errors
      if (clientRef.current?.connectionState === 'CONNECTED') {
        console.log('Client already connected, returning current state');
        setState(prev => ({
          ...prev,
          isConnected: true,
          isLoading: false,
          error: null
        }));
        isJoiningChannelRef.current = false;
        return { channelName: channelNameRef.current };
      }
      
      if (!clientRef.current) {
        throw new Error('Agora client not created. Call init() first.');
      }
      
      if (!appIdRef.current) {
        throw new Error('Agora not initialized. Call init() first.');
      }
      
      const client = clientRef.current;
      const finalChannelName = channelName || channelNameRef.current;
      
      if (!finalChannelName) {
        throw new Error('Channel name is required');
      }
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Only set up event handlers once - we'll use a simple approach by setting
        // a flag directly on the object
        const clientAny = client as any;
        const hasHandlers = clientAny._hasSetupEventHandlers === true;
        if (!hasHandlers) {
          // Set flag to indicate we've set up handlers
          clientAny._hasSetupEventHandlers = true;
          // Set up event handlers
          client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
            await client.subscribe(user, mediaType);
            
            if (mediaType === 'video') {
              // Add the new user to the remoteUsers array
              setState(prev => ({
                ...prev,
                remoteUsers: [...prev.remoteUsers.filter(u => u.uid !== user.uid), user]
              }));
            }
            
            if (mediaType === 'audio') {
              // Play audio explicitly with higher volume
              if (user.audioTrack) {
                try {
                  // Use a higher volume setting (between 0-100, default is 100)
                  user.audioTrack.setVolume(100); 
                  user.audioTrack.play();
                  console.log('Playing remote audio track');
                } catch (error) {
                  console.error('Failed to play remote audio track:', error);
                }
              }
            }
          });
          
          client.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
            if (mediaType === 'video') {
              // Remove the user from remoteUsers array
              setState(prev => ({
                ...prev,
                remoteUsers: prev.remoteUsers.filter(u => u.uid !== user.uid)
              }));
            }
          });
          
          client.on('user-left', (user: IAgoraRTCRemoteUser) => {
            // Remove the user from remoteUsers array
            setState(prev => ({
              ...prev,
              remoteUsers: prev.remoteUsers.filter(u => u.uid !== user.uid)
            }));
          });
          
          // Handle connection state changes
          client.on('connection-state-change', (state) => {
            console.log('Connection state changed to:', state);
            setState(prev => ({
              ...prev,
              isConnected: state === 'CONNECTED',
              isLoading: state === 'CONNECTING',
              error: state === 'DISCONNECTED' ? 'Disconnected from channel' : null
            }));
          });
        }
        
        // Join the channel - fix for Agora join parameter format
        // Convert the string UID to a number (Agora SDK requires number UIDs)
        const uidStr = uidRef.current || '';
        const uidNumber = uidStr ? parseInt(uidStr, 10) : null;
        
        console.log('Joining channel with params:', { 
          appId: appIdRef.current, 
          channel: finalChannelName, 
          token: null, 
          uidStr,
          uidNumber,
          connectionState: client.connectionState
        });
        
        try {
          // Check connection state again to be extra safe
          if (client.connectionState !== 'CONNECTED') {
            await client.join(appIdRef.current, finalChannelName, null, uidNumber);
            console.log('Successfully joined channel');
          }
          
          // Publish local tracks if in host mode
          if (role === 'host' && state.localAudioTrack && state.localVideoTrack) {
            // Only publish if we're connected and not already publishing
            if (client.connectionState === 'CONNECTED') {
              await client.publish([state.localAudioTrack, state.localVideoTrack]);
              console.log('Published local tracks');
            }
          }
          
          setState(prev => ({
            ...prev,
            isLoading: false,
            isConnected: true,
            error: null
          }));
          
          return {
            channelName: finalChannelName
          };
        } catch (joinError: any) {
          // Handle 'already connected' errors gracefully
          if (joinError.code === 'INVALID_OPERATION' && 
              joinError.message?.includes('already in connected/connecting state')) {
            console.log('Client already connected or connecting, treating as success');
            setState(prev => ({
              ...prev,
              isLoading: false,
              isConnected: true,
              error: null
            }));
            return { channelName: finalChannelName };
          } else {
            throw joinError;
          }
        }
      } finally {
        isJoiningChannelRef.current = false;
      }
    } catch (error: any) {
      console.error('Error joining channel:', error);
      isJoiningChannelRef.current = false;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error joining channel'
      }));
      throw error;
    }
  }, [role, state.localAudioTrack, state.localVideoTrack]);
  
  /**
   * Leave the current channel
   */
  const leave = useCallback(async () => {
    try {
      if (!clientRef.current) {
        return;
      }
      
      const client = clientRef.current;
      
      // Stop and close local tracks
      state.localAudioTrack?.stop();
      state.localAudioTrack?.close();
      state.localVideoTrack?.stop();
      state.localVideoTrack?.close();
      
      // Leave the channel
      await client.leave();
      
      setState(prev => ({
        ...prev,
        localAudioTrack: null,
        localVideoTrack: null,
        remoteUsers: [],
        isConnected: false
      }));
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  }, [state.localAudioTrack, state.localVideoTrack]);
  
  /**
   * Toggle local audio
   */
  const toggleAudio = useCallback(() => {
    if (state.localAudioTrack) {
      const enabled = !state.isAudioEnabled;
      state.localAudioTrack.setEnabled(enabled);
      setState(prev => ({ ...prev, isAudioEnabled: enabled }));
    }
  }, [state.localAudioTrack, state.isAudioEnabled]);
  
  /**
   * Toggle local video
   */
  const toggleVideo = useCallback(() => {
    if (state.localVideoTrack) {
      const enabled = !state.isVideoEnabled;
      state.localVideoTrack.setEnabled(enabled);
      setState(prev => ({ ...prev, isVideoEnabled: enabled }));
    }
  }, [state.localVideoTrack, state.isVideoEnabled]);
  
  /**
   * Add RTMP destinations for multiplatform streaming
   */
  const addRtmpDestination = useCallback(async (rtmpUrl: string) => {
    if (!channelNameRef.current) {
      throw new Error('Channel not initialized');
    }
    
    try {
      const response = await fetch('/api/agora/rtmp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: channelNameRef.current,
          rtmpUrl
        })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding RTMP destination:', error);
      throw error;
    }
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      state.localAudioTrack?.stop();
      state.localAudioTrack?.close();
      state.localVideoTrack?.stop();
      state.localVideoTrack?.close();
    };
  }, [state.localAudioTrack, state.localVideoTrack]);
  
  return {
    ...state,
    client: clientRef.current,
    channelName: channelNameRef.current,
    init,
    join,
    leave,
    toggleAudio,
    toggleVideo,
    addRtmpDestination
  };
}