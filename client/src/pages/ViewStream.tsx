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
  
  // Fetch stream data using the hostId (now in streamId param) and optional channel from URL
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after unmount
    
    async function fetchStreamData() {
      try {
        if (!params?.streamId) {
          throw new Error('Host ID is missing');
        }
        
        if (isMounted) setIsLoading(true);
        if (isMounted) setError(null);
        
        // Check if there's a channel parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const channelParam = urlParams.get('channel');
        
        // The streamId param is now actually the hostId
        const hostId = params.streamId;
        console.log(`Validating host ID: ${hostId}, channel: ${channelParam || 'not specified'}`);
        
        // Fetch stream data from the host validation endpoint
        let validateUrl = `/api/livestreams/${hostId}/validate`;
        if (channelParam) {
          validateUrl += `?channel=${encodeURIComponent(channelParam)}`;
        }
        
        const validateResponse = await fetch(validateUrl);
        
        if (!validateResponse.ok) {
          const errorData = await validateResponse.json();
          throw new Error(errorData.error || 'Failed to find active stream for this host');
        }
        
        const validateData = await validateResponse.json();
        
        // Check if host has an active stream
        if (!validateData.isActive) {
          throw new Error('This host does not have an active stream at the moment. Please try again later.');
        }
        
        // Get join credentials from the active stream data
        let credentialsUrl = `/api/stream/${validateData.streamId}/join-credentials`;
        if (validateData.channelName) {
          credentialsUrl += `?channel=${encodeURIComponent(validateData.channelName)}`;
        }
        
        const credentialsResponse = await fetch(credentialsUrl);
        
        if (!credentialsResponse.ok) {
          const errorData = await credentialsResponse.json();
          throw new Error(errorData.error || 'Failed to get stream credentials');
        }
        
        const credentials = await credentialsResponse.json();
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Set stream information for viewer
          setStreamInfo({
            appId: credentials.appId,
            token: credentials.token,
            channelName: credentials.channelName,
            uid: credentials.uid,
            streamTitle: validateData.streamTitle || 'Live Stream',
            hostName: validateData.hostName || 'Host',
            isActive: validateData.isActive
          });
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching stream data:', error);
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to load stream');
          setIsLoading(false);
        }
      }
    }
    
    fetchStreamData();
    
    // Cleanup function
    return () => {
      isMounted = false; // Prevent state updates after unmount
    };
  }, [params?.streamId]); // Only depend on the streamId part of params
  
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
