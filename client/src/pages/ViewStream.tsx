import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import ViewerStreamInterface from '../components/ViewerStreamInterface';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Helper function to parse URL query parameters
function getQueryParams(): Record<string, string> {
  const search = window.location.search.substring(1);
  return search
    .split('&')
    .map(param => {
      const [key, value] = param.split('=');
      return { key, value: value || '' };
    })
    .reduce((acc, { key, value }) => {
      if (key) acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);
}

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
  
  // Stream information
  const [streamData, setStreamData] = useState<{
    appId: string;
    token: string;
    channelName: string;
    streamTitle: string;
    hostName: string;
    hostAvatar?: string;
    viewerCount?: number;
    uid?: number;
  } | null>(null);
  
  // Get audience token and stream info
  useEffect(() => {
    const fetchStreamInfo = async () => {
      try {
        console.log('ViewStream: Trying to load stream with params:', params);
        
        // Get query parameters (e.g., ?channel=xyz)
        const queryParams = getQueryParams();
        console.log('ViewStream: Extracted query params:', queryParams);
        
        // Determine if we're using streamId or channelName
        let channelName = params.channelName || queryParams.channel;
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
        // Get audience token - make sure we pass the EXACT same channel name that the host used
        const tokenResponse = await fetch('/api/agora/audience-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channelName,
            uid: audienceUid
          })
        });
        
        if (!tokenResponse.ok) {
          throw new Error('Failed to get audience token');
        }
        
        const tokenData = await tokenResponse.json();
        console.log('ViewStream: Got token for channel:', tokenData.channelName);
        
        // Get stream details from our API
        console.log('ViewStream: Getting stream details for channel:', channelName);
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
        
        setStreamData({
          appId: appIdData.appId,
          token: tokenData.token,
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
    
    // We don't need to add queryParams to the dependency array because getQueryParams() 
    // reads directly from window.location.search which changes with the route
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
        <div className="max-w-lg bg-black/70 backdrop-blur-sm p-6 rounded-lg border border-red-500/30">
          <div className="text-red-500 text-2xl mb-4">Stream Error</div>
          <div className="text-white text-lg mb-4">{error || 'Unable to load stream'}</div>
          <div className="text-gray-400 text-sm mb-6">
            {error?.includes("not found") ? 
              "The stream you're looking for may have ended or never existed. Please check the stream link and try again." : 
            error?.includes("token") ?
              "Authentication failed. The stream may have expired or the streamer is no longer broadcasting." :
              "There was a problem connecting to the stream. Please check your connection and try again."}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={() => setLocation('/')}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-screen overflow-hidden bg-black">
      <ViewerStreamInterface
        appId={streamData.appId}
        channelName={streamData.channelName}
        token={streamData.token}
        username="Viewer" // In a real app, this would be the logged-in user's name
        streamTitle={streamData.streamTitle}
        hostName={streamData.hostName}
        hostAvatar={streamData.hostAvatar}
        viewerCount={streamData.viewerCount}
      />
    </div>
  );
}
