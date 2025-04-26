import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { StreamVideoClient } from '@stream-io/video-client';
import { useToast } from '@/hooks/use-toast';

interface StreamVideoContextType {
  client: StreamVideoClient | null;
  isInitialized: boolean;
  error: Error | null;
  isDemoMode: boolean;
  userId: string;
  userName: string;
}

// Create a context with default values
export const StreamVideoContext = createContext<StreamVideoContextType>({
  client: null,
  isInitialized: false,
  error: null,
  isDemoMode: false,
  userId: '',
  userName: ''
});

export function useStreamVideoContext() {
  return useContext(StreamVideoContext);
}

interface StreamVideoProviderProps {
  children: ReactNode;
}

const StreamVideoProvider: React.FC<StreamVideoProviderProps> = ({ children }) => {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [userId] = useState(`user-${Math.random().toString(36).substring(2, 9)}`);
  const [userName] = useState('Livestreamer');
  const { toast } = useToast();
  
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    async function initClient() {
      try {
        // Set a timeout for the API calls
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Connection timed out'));
          }, 5000);
        });
        
        // Try to fetch Stream credentials with a timeout
        const tokenPromise = fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userName }),
        });
        
        const response = await Promise.race([tokenPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Stream tokens: ${response.status}`);
        }
        
        const { token } = await response.json();
        
        // Also fetch the API key separately
        const keyResponse = await fetch('/api/stream/key');
        if (!keyResponse.ok) {
          throw new Error(`Failed to fetch Stream API key: ${keyResponse.status}`);
        }
        
        const { apiKey } = await keyResponse.json();
        
        if (!apiKey || !token) {
          throw new Error('Invalid Stream credentials received');
        }
        
        console.log('Successfully retrieved GetStream credentials');
        
        // Create and initialize the Stream Video client
        const videoClient = new StreamVideoClient({
          apiKey,
          user: { id: userId, name: userName },
          token,
          // Add some options to help with debugging
          options: {
            logLevel: 'info',
          }
        });
        
        if (isMounted) {
          setClient(videoClient);
          setIsInitialized(true);
          setIsDemoMode(false);
          
          console.log('Stream Video client initialized successfully');
        }
        
        // Cleanup function
        return () => {
          console.log('Disconnecting Stream Video client');
          videoClient.disconnectUser();
        };
      } catch (err) {
        clearTimeout(timeoutId);
        const error = err instanceof Error ? err : new Error('Unknown error initializing Stream Video');
        console.error('Error initializing Stream Video client:', error);
        
        if (isMounted) {
          setError(error);
          setIsDemoMode(true);
          setIsInitialized(true); // Mark as initialized so the app can proceed
          
          // Show more user-friendly toast
          toast({
            title: "Streaming API Unavailable",
            description: "Using demo mode for preview purposes. Actual streaming features will be limited.",
            variant: "default",
            duration: 5000,
          });
          
          console.log('Entered demo mode due to connection issues');
        }
      }
    }
    
    // Initialize client
    const cleanupPromise = initClient();
    
    // Cleanup on unmount
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [toast, userId, userName]);

  const contextValue: StreamVideoContextType = {
    client,
    isInitialized,
    error,
    isDemoMode,
    userId,
    userName
  };

  return (
    <StreamVideoContext.Provider value={contextValue}>
      {children}
    </StreamVideoContext.Provider>
  );
};

export default StreamVideoProvider;