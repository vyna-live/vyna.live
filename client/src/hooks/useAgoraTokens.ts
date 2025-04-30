import { useState, useEffect } from 'react';

interface AgoraTokensResponse {
  appId: string;
  rtcToken: string;
  rtmToken: string;
  channelName: string;
  uid: number;
  role: 'host' | 'audience';
}

export interface AgoraTokens {
  isLoading: boolean;
  error: Error | null;
  appId: string | null;
  rtcToken: string | null;
  rtmToken: string | null;
  channelName: string;
  uid: number | null;
  role: 'host' | 'audience';
  fetchHostToken: (channelName: string, uid?: number) => Promise<void>;
  fetchAudienceToken: (channelName: string, uid?: number) => Promise<void>;
  getAudienceTokens: (channelName: string, uid: number) => Promise<{
    appId: string;
    rtcToken: string;
    rtmToken: string;
    channelName: string;
    uid: number;
  } | null>;
  isTokenLoading: boolean;
  tokenError: Error | null;
  createLivestream: (title: string, userName: string) => Promise<{
    id: string;
    rtcToken: string;
    rtmToken: string;
    channelName: string;
    appId: string;
    uid: number;
  } | null>;
}

export default function useAgoraTokens(initialChannelName: string = ''): AgoraTokens {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState<Error | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [rtcToken, setRtcToken] = useState<string | null>(null);
  const [rtmToken, setRtmToken] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string>(initialChannelName);
  const [uid, setUid] = useState<number | null>(null);
  const [role, setRole] = useState<'host' | 'audience'>('host');

  // Fetch Agora App ID on component mount
  useEffect(() => {
    const fetchAppId = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/agora/app-id');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.appId) {
          setAppId(data.appId);
        } else {
          throw new Error('Failed to fetch Agora App ID');
        }
      } catch (err) {
        console.error('Error fetching Agora App ID:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch Agora App ID'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppId();
  }, []);

  // Fetch host token
  const fetchHostToken = async (channel: string, userId?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/agora/host-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelName: channel,
          uid: userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data) {
        setAppId(data.appId);
        setRtcToken(data.rtcToken);
        setRtmToken(data.rtmToken);
        setChannelName(data.channelName);
        setUid(data.uid);
        setRole('host');
      } else {
        throw new Error('Failed to fetch host token');
      }
    } catch (err) {
      console.error('Error fetching host token:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch host token'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch audience token
  const fetchAudienceToken = async (channel: string, userId?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/agora/audience-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelName: channel,
          uid: userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data) {
        setAppId(data.appId);
        setRtcToken(data.rtcToken);
        setRtmToken(data.rtmToken);
        setChannelName(data.channelName);
        setUid(data.uid);
        setRole('audience');
      } else {
        throw new Error('Failed to fetch audience token');
      }
    } catch (err) {
      console.error('Error fetching audience token:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch audience token'));
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new livestream
  const createLivestream = async (title: string, userName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/agora/livestream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          userName,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.success && data.livestream) {
        const { appId: newAppId, rtcToken, rtmToken, channelName: newChannel, uid: newUid } = data.livestream;
        
        setAppId(newAppId);
        setRtcToken(rtcToken);
        setRtmToken(rtmToken);
        setChannelName(newChannel);
        setUid(newUid);
        setRole('host');
        
        return data.livestream;
      } else {
        throw new Error('Failed to create livestream');
      }
    } catch (err) {
      console.error('Error creating livestream:', err);
      setError(err instanceof Error ? err : new Error('Failed to create livestream'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get audience tokens (separate function to avoid state updates)
  const getAudienceTokens = async (channel: string, userId: number) => {
    try {
      setIsTokenLoading(true);
      setTokenError(null);
      
      // First check if we already have the app ID, if not fetch it
      let currentAppId = appId;
      if (!currentAppId) {
        const appIdResponse = await fetch('/api/agora/app-id');
        if (!appIdResponse.ok) {
          throw new Error(`HTTP error getting App ID! Status: ${appIdResponse.status}`);
        }
        const appIdData = await appIdResponse.json();
        if (!appIdData.appId) {
          throw new Error('No App ID returned from server');
        }
        currentAppId = appIdData.appId;
      }
      
      // Now get the audience tokens
      const response = await fetch('/api/agora/audience-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelName: channel,
          uid: userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.rtcToken && data.rtmToken) {
        return {
          appId: currentAppId,
          rtcToken: data.rtcToken,
          rtmToken: data.rtmToken,
          channelName: channel,
          uid: userId
        };
      } else {
        throw new Error('Failed to get audience tokens');
      }
    } catch (err) {
      console.error('Error getting audience tokens:', err);
      setTokenError(err instanceof Error ? err : new Error('Failed to get audience tokens'));
      return null;
    } finally {
      setIsTokenLoading(false);
    }
  };

  return {
    isLoading,
    error,
    appId,
    rtcToken,
    rtmToken,
    channelName,
    uid,
    role,
    fetchHostToken,
    fetchAudienceToken,
    getAudienceTokens,
    isTokenLoading,
    tokenError,
    createLivestream,
  };
}