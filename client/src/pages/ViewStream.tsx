import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Loader2 } from "lucide-react";
import ViewerStreamInterface from "@/components/ViewerStreamInterface";

export default function ViewStream() {
  const [_, params] = useRoute('/view-stream/:hostId');
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  type StreamInfoType = {
    appId: string | null;
    token: string | null;
    channelName: string | null;
    uid: number | null;
    streamTitle: string | null;
    hostName: string | null;
    hostId: string | number | null;
    isActive: boolean;
  };
  
  const [streamInfo, setStreamInfo] = useState<StreamInfoType>({
    appId: null,
    token: null,
    channelName: null,
    uid: null,
    streamTitle: null,
    hostName: null,
    hostId: null,
    isActive: false
  });
  
  // Fetch stream data using the hostId and channel from URL parameters
  useEffect(() => {
    async function fetchStreamData() {
      try {
        if (!params?.hostId) {
          throw new Error('Host ID is missing');
        }
        
        setIsLoading(true);
        setError(null);
        
        // Check if there's a channel parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const channelParam = urlParams.get('channel');
        
        // This is the host's user ID
        const hostId = params.hostId;
        console.log(`Fetching stream data for host ID: ${hostId}, channel: ${channelParam || 'not specified'}`);
        
        // If we don't have a channel parameter, we can't connect
        if (!channelParam) {
          throw new Error('Channel information is missing. The stream link is incomplete.');
        }
        
        // First try to find channel using both host ID and channel name
        const fetchStreamSession = async () => {
          try {
            // Try to fetch the channel information first by channel name
            const channelResponse = await fetch(`/api/stream/channel/${channelParam}`);
            
            // If successful, return that data
            if (channelResponse.ok) {
              const channelData = await channelResponse.json();
              if (channelData && channelData.isActive) {
                return channelData;
              }
              throw new Error('Channel exists but stream is not active');
            }
            
            // Otherwise, try directly with host ID
            const validateUrl = `/api/livestreams/${hostId}/validate?channel=${encodeURIComponent(channelParam)}`;
            const validateResponse = await fetch(validateUrl);
            
            if (!validateResponse.ok) {
              const errorData = await validateResponse.json();
              throw new Error(errorData.error || 'Failed to find active stream for this host');
            }
            
            return await validateResponse.json();
          } catch (error) {
            console.error('Error in fetchStreamSession:', error);
            throw error;
          }
        };
        
        // Fetch the stream session data
        const streamData = await fetchStreamSession();
        
        // Check if the stream is active
        if (!streamData.isActive) {
          throw new Error('This host does not have an active stream at the moment. Please try again later.');
        }
        
        // Get credentials to join the stream
        const requestAudienceToken = async () => {
          try {
            // Request an audience token for this channel
            const audienceResponse = await fetch('/api/stream/audience-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                channelName: streamData.channelName
              })
            });
            
            if (!audienceResponse.ok) {
              const errorData = await audienceResponse.json();
              throw new Error(errorData.error || 'Failed to get audience token');
            }
            
            return await audienceResponse.json();
          } catch (error) {
            console.error('Error in requestAudienceToken:', error);
            throw error;
          }
        };
        
        // Get API key for agora
        const fetchApiKey = async () => {
          try {
            const keyResponse = await fetch('/api/stream/key');
            
            if (!keyResponse.ok) {
              throw new Error('Failed to fetch API key');
            }
            
            return await keyResponse.json();
          } catch (error) {
            console.error('Error in fetchApiKey:', error);
            throw error;
          }
        };
        
        // Fetch both in parallel
        const [tokenData, apiKeyData] = await Promise.all([
          requestAudienceToken(),
          fetchApiKey()
        ]);
        
        // Set stream information for viewer
        setStreamInfo({
          appId: apiKeyData.apiKey,
          token: tokenData.token,
          channelName: streamData.channelName,
          uid: Math.floor(Math.random() * 1000000), // Generate a random uid for the audience
          streamTitle: streamData.streamTitle || streamData.title || 'Live Stream',
          hostName: streamData.hostName || 'Host',
          hostId: params.hostId, // Use the host ID from URL params
          isActive: streamData.isActive
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching stream data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load stream');
        setIsLoading(false);
      }
    }
    
    fetchStreamData();
  }, [params]);
  
  // If there's an error, show an error screen with a button to go back
  if (error) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1C1C1C] rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-xl mb-4">Stream Error</div>
          <p className="text-white mb-6">{error}</p>
          <button
            onClick={() => setLocation('/join-stream')}
            className="px-4 py-2 bg-[#D8C6AF] text-black font-medium rounded hover:bg-opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D8C6AF]" />
        <span className="ml-2 text-white">Loading stream...</span>
      </div>
    );
  }
  
  // Render the viewer interface
  return (
    <ViewerStreamInterface 
      streamInfo={streamInfo}
    />
  );
}
