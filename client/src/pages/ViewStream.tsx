import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import ViewerStreamInterface from '../components/ViewerStreamInterface';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamParams {
  channelName?: string;
  streamId?: string;
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
        // Determine if we're using streamId or channelName
        let channelName = params.channelName;
        
        // If streamId is provided instead of channelName, fetch the channel from the database
        if (params.streamId && !channelName) {
          // Get stream details by streamId
          const streamLookupResponse = await fetch(`/api/livestreams/${params.streamId}`);
          
          if (!streamLookupResponse.ok) {
            throw new Error('Stream not found or no longer active');
          }
          
          const streamInfo = await streamLookupResponse.json();
          channelName = streamInfo.channelName;
          
          if (!channelName) {
            throw new Error('Invalid stream data - missing channel information');
          }
        }
        
        if (!channelName) {
          throw new Error('No channel name specified');
        }
        
        // First get the app ID
        const appIdResponse = await fetch('/api/agora/app-id');
        if (!appIdResponse.ok) {
          throw new Error('Failed to get Agora App ID');
        }
        const appIdData = await appIdResponse.json();
        
        // Generate a random UID for the audience member
        const audienceUid = Math.floor(Math.random() * 1000000);
        
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
        
        const tokenData = await tokenResponse.json();
        
        // Get stream details from our API
        const streamDetailsResponse = await fetch(`/api/streams/${channelName}`);
        
        if (!streamDetailsResponse.ok) {
          throw new Error('Failed to get stream details');
        }
        
        const streamDetails = await streamDetailsResponse.json();
        
        // Track that this viewer joined the stream to increment the count
        await fetch(`/api/streams/${channelName}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
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
        
        // Cleanup function
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          handleBeforeUnload();
        };
        
        setIsLoading(false);
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
