import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  StreamVideo, 
  StreamVideoClient,
  StreamTheme
} from '@stream-io/video-react-sdk';

interface StreamVideoProviderProps {
  children: React.ReactNode;
  apiKey?: string;
  token?: string;
  userId?: string;
  userName?: string;
}

interface StreamVideoContextValue {
  client: StreamVideoClient | null;
  isInitialized: boolean;
  error: Error | null;
}

const StreamVideoContext = createContext<StreamVideoContextValue>({
  client: null,
  isInitialized: false,
  error: null
});

export const useStreamVideoContext = () => useContext(StreamVideoContext);

export function StreamVideoProvider({ 
  children,
  apiKey: initialApiKey,
  token: initialToken,
  userId: initialUserId,
  userName: initialUserName
}: StreamVideoProviderProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // State for API credentials
  const [apiKey, setApiKey] = useState<string | undefined>(initialApiKey);
  const [token, setToken] = useState<string | undefined>(initialToken);
  const [userId, setUserId] = useState<string | undefined>(initialUserId);
  const [userName, setUserName] = useState<string | undefined>(initialUserName);
  
  // Fetch API key and token if not provided
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        if (!apiKey) {
          const keyResponse = await fetch('/api/stream/key');
          if (!keyResponse.ok) throw new Error('Failed to get Stream API key');
          const keyData = await keyResponse.json();
          setApiKey(keyData.apiKey);
        }
        
        if (!token && userId) {
          const tokenResponse = await fetch('/api/stream/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              userName: userName || 'User',
            }),
          });
          
          if (!tokenResponse.ok) throw new Error('Failed to generate Stream token');
          const tokenData = await tokenResponse.json();
          setToken(tokenData.token);
        }
      } catch (err) {
        console.error('Error fetching Stream credentials:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching credentials'));
      }
    };
    
    if (!apiKey || (!token && userId)) {
      fetchCredentials();
    }
  }, [apiKey, token, userId, userName]);
  
  // Initialize client once we have credentials
  useEffect(() => {
    if (!apiKey || !token || !userId) return;
    
    try {
      // Initialize the Stream client
      const streamClient = new StreamVideoClient({
        apiKey,
        user: {
          id: userId,
          name: userName || 'User',
        },
        token,
      });
      
      setClient(streamClient);
      setIsInitialized(true);
      setError(null);
      
      // Cleanup on unmount
      return () => {
        streamClient.disconnectUser().catch(console.error);
        setClient(null);
        setIsInitialized(false);
      };
    } catch (err) {
      console.error('Error initializing Stream client:', err);
      setError(err instanceof Error ? err : new Error('Unknown error initializing client'));
      setIsInitialized(false);
    }
  }, [apiKey, token, userId, userName]);
  
  // If we don't have a client yet, render children without the provider
  if (!client) {
    return <>{children}</>;
  }
  
  // Custom theme colors matching our application's earthy palette
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
  
  return (
    <StreamVideoContext.Provider value={{ client, isInitialized, error }}>
      <StreamVideo client={client}>
        <StreamTheme>
          {children}
        </StreamTheme>
      </StreamVideo>
    </StreamVideoContext.Provider>
  );
}