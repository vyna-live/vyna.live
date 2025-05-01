import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Loader2 } from "lucide-react";
import ViewerStreamInterface from "@/components/ViewerStreamInterface";

export default function ViewStream() {
  const [_, params] = useRoute('/view-stream/:streamId');
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<{
    appId: string | null;
    token: string | null;
    channelName: string | null;
    uid: number | null;
    streamTitle: string | null;
    hostName: string | null;
    isActive: boolean;
  }>({  
    appId: null,
    token: null,
    channelName: null,
    uid: null,
    streamTitle: null,
    hostName: null,
    isActive: false
  });
  
  // Fetch stream data using the streamId and optional channel from URL
  useEffect(() => {
    async function fetchStreamData() {
      try {
        if (!params?.streamId) {
          throw new Error('Stream ID is missing');
        }
        
        setIsLoading(true);
        setError(null);
        
        // Check if there's a channel parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const channelParam = urlParams.get('channel');
        
        // Use either the channel from URL or stream ID as the identifier
        const streamIdOrChannel = channelParam || params.streamId;
        console.log(`Fetching stream data for ID: ${params.streamId}, channel: ${channelParam || 'not specified'}`);
        
        // Fetch stream information by ID
        const streamResponse = await fetch(`/api/stream/${streamIdOrChannel}/info`);
        
        if (!streamResponse.ok) {
          const errorData = await streamResponse.json();
          throw new Error(errorData.error || 'Failed to load stream data. The stream may not exist.');
        }
        
        const streamData = await streamResponse.json();
        
        // Check if stream is active
        if (!streamData.isActive) {
          throw new Error('This stream is not currently active. Please try again later.');
        }
        
        // Get join credentials (includes appId, token, and uid)
        // If we have a channel parameter, pass it as a query param
        let credentialsUrl = `/api/stream/${params.streamId}/join-credentials`;
        if (channelParam) {
          credentialsUrl += `?channel=${encodeURIComponent(channelParam)}`;
        }
        
        const credentialsResponse = await fetch(credentialsUrl);
        
        if (!credentialsResponse.ok) {
          const errorData = await credentialsResponse.json();
          throw new Error(errorData.error || 'Failed to get stream credentials');
        }
        
        const credentials = await credentialsResponse.json();
        
        // Set stream information for viewer
        setStreamInfo({
          appId: credentials.appId,
          token: credentials.token,
          channelName: credentials.channelName,
          uid: credentials.uid,
          streamTitle: streamData.streamTitle || 'Live Stream',
          hostName: streamData.hostName || 'Host',
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
