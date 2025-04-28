import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';

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
        console.log("Fetching Stream credentials...");
        
        if (!apiKey) {
          const keyResponse = await fetch('/api/stream/key');
          if (!keyResponse.ok) throw new Error('Failed to get Stream API key');
          const keyData = await keyResponse.json();
          console.log("Fetched API key:", keyData.apiKey);
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
          console.log("Fetched token successfully");
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
    if (!apiKey || !token || !userId) {
      console.log("Missing required credentials for Stream client initialization");
      return;
    }
    
    try {
      console.log("Initializing Stream client with credentials");
      
      // Initialize the Stream client with the latest SDK patterns
      const streamClient = new StreamVideoClient({
        apiKey,
        user: {
          id: userId,
          name: userName || 'User',
          image: `https://getstream.io/random_svg/?id=${userId}&name=${userName}`,
        },
        token,
      });
      
      setClient(streamClient);
      setIsInitialized(true);
      setError(null);
      console.log("Stream client initialized successfully");
      
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
    console.log("No Stream client available yet, rendering children without provider");
    return <>{children}</>;
  }
  
  // Custom theme definition
  const customTheme = {
    colors: {
      primary: '#A67D44',
      secondary: '#5D1C34',
      error: '#dd2e44',
      success: '#3ba55c'
    }
  };
  
  return (
    <StreamVideoContext.Provider value={{ client, isInitialized, error }}>
      <StreamVideo client={client}>
        {children}
      </StreamVideo>
    </StreamVideoContext.Provider>
  );
}