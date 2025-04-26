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

// Function to generate token via API
const tokenProvider = async (userId: string, userName: string) => {
  const response = await fetch('/api/stream/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userName }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get stream token: ${response.status}`);
  }
  
  const { token } = await response.json();
  return token;
};

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
    
    async function initClient() {
      try {
        console.log('Initializing Stream Video client...');
        
        // Fetch API key first - this is simpler than the token
        const keyResponse = await fetch('/api/stream/key');
        if (!keyResponse.ok) {
          throw new Error(`Failed to fetch Stream API key: ${keyResponse.status}`);
        }
        const { apiKey } = await keyResponse.json();
        
        if (!apiKey) {
          throw new Error('Invalid or missing Stream API key');
        }
        
        console.log('Fetched Stream API key:', apiKey);
        
        // Create the user info
        const userInfo = { 
          id: userId, 
          name: userName,
          image: `https://getstream.io/random_svg/?id=${userId}&name=${userName}`,
        };
        
        // Create the client with a token provider function instead of a token directly
        // This is more reliable as it will automatically refresh tokens when needed
        console.log('Creating StreamVideoClient with tokenProvider...');
        
        const videoClient = new StreamVideoClient({
          apiKey,
          user: userInfo,
          tokenProvider: () => tokenProvider(userId, userName),
        });
        
        // Wait a moment to ensure client initialization
        setTimeout(() => {
          if (isMounted) {
            setClient(videoClient);
            setIsInitialized(true);
            setIsDemoMode(false);
            
            console.log('Stream Video client initialized successfully');
            
            // Show toast for successful connection
            toast({
              title: "Connected to Streaming Service",
              description: "You're now ready to create or join a livestream.",
              duration: 3000,
            });
          }
        }, 1000);
        
        // Return cleanup function
        return () => {
          if (videoClient) {
            console.log('Disconnecting Stream Video client');
            videoClient.disconnectUser();
          }
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error initializing Stream Video');
        console.error('Error initializing Stream Video client:', error);
        
        if (isMounted) {
          setError(error);
          setIsDemoMode(true);
          setIsInitialized(true); // Mark as initialized so the app can proceed
          
          // Show error in toast
          toast({
            title: "Streaming Service Unavailable",
            description: "Unable to connect to streaming service. Using demo mode instead.",
            variant: "destructive",
            duration: 5000,
          });
          
          console.log('Entered demo mode due to connection issues');
        }
      }
    }
    
    // Initialize client and store cleanup function
    const cleanupPromise = initClient();
    
    // Cleanup on unmount
    return () => {
      isMounted = false;
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