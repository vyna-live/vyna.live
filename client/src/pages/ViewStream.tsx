import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import ViewerStreamInterface from '../components/ViewerStreamInterface';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamParams {
  channelName?: string;
  streamId?: string;
}

// Helper to check if a string is a valid stream ID format
function isValidStreamId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{6,}$/.test(id);
}

export default function ViewStream() {
  const [, setLocation] = useLocation();
  const params = useParams<StreamParams>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Stream information with proper types
  interface StreamData {
    appId: string;
    rtcToken: string;
    rtmToken: string;
    channelName: string;
    streamTitle: string;
    hostName: string;
    hostAvatar?: string;
    viewerCount?: number;
    uid?: number;
  }
  
  // Define TokenData interface to better handle the token response
  interface TokenResponse {
    rtcToken?: string;
    rtmToken?: string;
    appId?: string;
    channelName?: string;
    uid?: number;
    role?: string;
  }
  
  // Define a type for use with validated token data
  interface ValidatedTokenData {
    rtcToken: string;
    rtmToken: string;
    appId?: string;
    channelName?: string;
    uid?: number;
    role?: string;
  }
  
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  
  // Get audience token and stream info
  useEffect(() => {
    const fetchStreamInfo = async () => {
      try {
        console.log('ViewStream: Trying to load stream with params:', params);
        
        // Determine if we're using streamId or channelName
        let channelName = params.channelName;
        let streamId = params.streamId;
        
        // Start by validating the stream ID if we have one
        if (streamId) {
          console.log('ViewStream: Validating stream ID:', streamId);
          
          // First validate the stream - this checks if it's active
          const validateResponse = await fetch(`/api/livestreams/${streamId}/validate`);
          
          if (!validateResponse.ok) {
            throw new Error('Stream cannot be found or is no longer active');
          }
          
          const validateData = await validateResponse.json();
          
          if (!validateData.isActive) {
            throw new Error('This stream is not currently active');
          }
          
          // Now get the full stream details
          console.log('ViewStream: Getting stream details for:', streamId);
          const streamLookupResponse = await fetch(`/api/livestreams/${streamId}`);
          
          if (!streamLookupResponse.ok) {
            throw new Error('Stream not found or no longer active');
          }
          
          const streamInfo = await streamLookupResponse.json();
          channelName = streamInfo.channelName;
          
          console.log('ViewStream: Found channel name:', channelName);
          
          if (!channelName) {
            throw new Error('Invalid stream data - missing channel information');
          }
        }
        
        if (!channelName) {
          throw new Error('No channel name specified');
        }
        
        console.log('ViewStream: Getting Agora App ID');
        // First get the app ID
        const appIdResponse = await fetch('/api/agora/app-id');
        if (!appIdResponse.ok) {
          throw new Error('Failed to get Agora App ID');
        }
        const appIdData = await appIdResponse.json();
        
        // Generate a random UID for the audience member
        const audienceUid = Math.floor(Math.random() * 1000000);
        
        console.log('ViewStream: Getting Agora audience token for channel:', channelName);
        // Get audience token
        const tokenResponse = await fetch('/api/agora/audience-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channelName,
            uid: audienceUid,
            role: 'audience'
          })
        });
        
        if (!tokenResponse.ok) {
          throw new Error('Failed to get audience token');
        }
        
        const tokenData = await tokenResponse.json() as TokenResponse;
        console.log('ViewStream: Received audience token data:', {
          ...tokenData,
          rtcToken: tokenData.rtcToken ? `${tokenData.rtcToken.substring(0, 20)}...` : 'missing',
          rtmToken: tokenData.rtmToken ? `${tokenData.rtmToken.substring(0, 20)}...` : 'missing'
        });
        
        // Update channel name from token response (important for any mapping/remapping that happened on server)
        if (tokenData.channelName && tokenData.channelName !== channelName) {
          console.log(`ViewStream: Channel name updated from ${channelName} to ${tokenData.channelName}`);
          channelName = tokenData.channelName;
        }
        
        console.log('ViewStream: Getting stream details for channel:', channelName);
        // Get stream details from our API
        const streamDetailsResponse = await fetch(`/api/streams/${channelName}`);
        
        if (!streamDetailsResponse.ok) {
          throw new Error('Failed to get stream details');
        }
        
        const streamDetails = await streamDetailsResponse.json();
        
        console.log('ViewStream: Joining stream:', channelName);
        // Track that this viewer joined the stream to increment the count
        await fetch(`/api/streams/${channelName}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('ViewStream: Setting stream data', {
          appId: appIdData.appId,
          channelName,
          streamTitle: streamDetails.title,
          hostName: streamDetails.hostName,
        });
        
        if (!tokenData.rtcToken || !tokenData.rtmToken) {
          throw new Error('Invalid tokens received from server');
        }
        
        // After our check, we can safely assert these will be strings
        const validatedTokenData: ValidatedTokenData = {
          ...tokenData,
          rtcToken: tokenData.rtcToken, // TypeScript now knows this is a string
          rtmToken: tokenData.rtmToken  // TypeScript now knows this is a string
        };
        
        setStreamData({
          appId: appIdData.appId,
          rtcToken: validatedTokenData.rtcToken, // Using the validated RTC token
          rtmToken: validatedTokenData.rtmToken, // Using the validated RTM token
          channelName,
          streamTitle: streamDetails.title,
          hostName: streamDetails.hostName,
          hostAvatar: streamDetails.hostAvatar,
          viewerCount: streamDetails.viewerCount,
          uid: audienceUid
        });
        
        // Setup leaving event handler
        const handleBeforeUnload = () => {
          // Track that this viewer left the stream
          fetch(`/api/streams/${channelName}/leave`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            // Use keepalive to ensure the request completes even if the page is unloading
            keepalive: true
          });
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        setIsLoading(false);
        
        // Cleanup function
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          handleBeforeUnload();
        };
      } catch (err) {
        console.error('Error fetching stream info:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stream');
        setIsLoading(false);
        
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to load stream',
          variant: 'destructive'
        });
      }
    };
    
    fetchStreamInfo();
  }, [params.channelName, params.streamId, toast]);
  
  if (isLoading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 text-white animate-spin mb-4" />
        <div className="text-white text-xl">Loading Stream...</div>
      </div>
    );
  }
  
  if (error || !streamData) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black p-4">
        <div className="text-red-500 text-2xl mb-4">Stream Error</div>
        <div className="text-white text-lg mb-6">{error || 'Unable to load stream'}</div>
        <button 
          onClick={() => setLocation('/')}
          className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-full h-screen overflow-hidden bg-black">
      <ViewerStreamInterface
        appId={streamData.appId}
        channelName={streamData.channelName}
        rtcToken={streamData.rtcToken}
        rtmToken={streamData.rtmToken}
        username="Viewer" // In a real app, this would be the logged-in user's name
        streamTitle={streamData.streamTitle}
        hostName={streamData.hostName}
        hostAvatar={streamData.hostAvatar}
        viewerCount={streamData.viewerCount}
      />
    </div>
  );
}
