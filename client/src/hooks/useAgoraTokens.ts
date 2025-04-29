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
  token: string | null;
  channelName: string;
  uid: number | null;
  role: 'host' | 'audience';
  fetchHostToken: (channelName: string, uid?: number) => Promise<void>;
  fetchAudienceToken: (channelName: string, uid?: number) => Promise<void>;
  createLivestream: (title: string, userName: string) => Promise<{
    id: string;
    token: string;
    channelName: string;
    appId: string;
    uid: number;
  } | null>;
}

export default function useAgoraTokens(initialChannelName: string = ''): AgoraTokens {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
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
        setToken(data.token);
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
        setToken(data.token);
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
        const { appId: newAppId, token: newToken, channelName: newChannel, uid: newUid } = data.livestream;
        
        setAppId(newAppId);
        setToken(newToken);
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

  return {
    isLoading,
    error,
    appId,
    token,
    channelName,
    uid,
    role,
    fetchHostToken,
    fetchAudienceToken,
    createLivestream,
  };
}