import { StreamVideoClient, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useContext } from 'react';
import { StreamVideoContext } from '@/providers/StreamVideoProvider';

// Enhanced hook that provides access to our extended context
export function useStreamVideo() {
  const context = useContext(StreamVideoContext);
  
  if (context === undefined) {
    throw new Error('useStreamVideo must be used within a StreamVideoProvider');
  }
  
  // The SDK hook, which might be null if not within a StreamVideo component
  const sdkClient = useStreamVideoClient();
  
  return {
    // Our context values
    client: context.client,
    isInitialized: context.isInitialized,
    error: context.error,
    isDemoMode: context.isDemoMode,
    userId: context.userId,
    userName: context.userName,
    
    // SDK-specific client (available when within StreamVideo components)
    sdkClient
  };
}