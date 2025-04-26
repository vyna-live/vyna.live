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
  
  /**
   * Initialize Agora RTC client with caching to prevent duplicate API calls
   */
  const init = useCallback(async (options: InitOptions = {}) => {
    try {
      // If we're already making a request, don't make another one
      if (apiRequestInProgressRef.current) {
        return {
          channelName: channelNameRef.current || '',
          uid: uidRef.current || '',
          appId: appIdRef.current || ''
        };
      }
      
      // If already initialized with the same channel, just return the existing config
      if (
        initializedRef.current &&
        clientRef.current &&
        appIdRef.current &&
        channelNameRef.current === options.channelName &&
        uidRef.current
      ) {
        return {
          channelName: channelNameRef.current,
          uid: uidRef.current,
          appId: appIdRef.current
        };
      }
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      apiRequestInProgressRef.current = true;
      
      try {
        // Create Agora client if it doesn't exist
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({ mode, codec });
        }
        
        // Get app ID from server if we don't have it cached
        if (!appIdRef.current) {
          const appIdResponse = await fetch('/api/agora/app-id');
          const appIdData = await appIdResponse.json();
          
          if (!appIdData.appId) {
            throw new Error('Failed to get Agora App ID from server');
          }
          
          appIdRef.current = appIdData.appId;
        }
        
        // Initialize channel from server
        const channelName = options.channelName || `channel-${Date.now()}`;
        channelNameRef.current = channelName;
        
        // Only make the channel API call if we need a new channel
        if (!uidRef.current || channelNameRef.current !== options.channelName) {
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
          
          uidRef.current = channelData.uid;
        }
        
        // Create local tracks
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        
        // Update state with initial tracks
        setState(prev => ({
          ...prev,
          localAudioTrack: audioTrack,
          localVideoTrack: videoTrack,
          isLoading: false,
          isConnected: false
        }));
        
        initializedRef.current = true;
        
        return {
          channelName: channelNameRef.current,
          uid: uidRef.current,
          appId: appIdRef.current
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
   * Join a channel
   */
  const join = useCallback(async (channelName?: string) => {
    try {
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
      
      // Set up event handlers
      client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          // Add the new user to the remoteUsers array
          setState(prev => ({
            ...prev,
            remoteUsers: [...prev.remoteUsers, user]
          }));
        }
        
        if (mediaType === 'audio') {
          // Play audio
          user.audioTrack?.play();
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
      
      // Join the channel
      const uid = uidRef.current || undefined;
      await client.join(appIdRef.current, finalChannelName, null, uid as UID);
      
      // Publish local tracks if in host mode
      if (role === 'host' && state.localAudioTrack && state.localVideoTrack) {
        await client.publish([state.localAudioTrack, state.localVideoTrack]);
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
    } catch (error: any) {
      console.error('Error joining channel:', error);
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