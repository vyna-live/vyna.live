import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import ViewerStreamInterface from '../components/ViewerStreamInterface';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Minimal data needed to join a stream directly
interface DirectStreamData {
  appId: string;
  channelName: string;
  hostName: string;
  streamTitle: string;
  directAccess: boolean;
}

export default function DirectStream() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Stream information with tokens
  interface CompleteStreamData extends DirectStreamData {
    rtcToken: string;
    rtmToken: string;
    uid: number;
  }
  
  const [streamData, setStreamData] = useState<CompleteStreamData | null>(null);
  
  // Get audience token and prepare stream
  useEffect(() => {
    const fetchDirectStreamData = async () => {
      try {
        // Get stored stream data from session storage
        const storedData = sessionStorage.getItem('directStreamData');
        if (!storedData) {
          throw new Error('No direct stream data found. Please go back and enter stream details.');
        }
        
        // Parse the stored data
        const directData = JSON.parse(storedData) as DirectStreamData;
        console.log('DirectStream: Using direct access data:', directData);
        
        if (!directData.appId || !directData.channelName) {
          throw new Error('Invalid stream data. Missing required information.');
        }
        
        // Generate a random UID for the audience member
        const audienceUid = Math.floor(Math.random() * 1000000);
        
        console.log('DirectStream: Getting Agora audience token for channel:', directData.channelName);
        
        // Get audience token for this direct stream
        const tokenResponse = await fetch('/api/agora/audience-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channelName: directData.channelName,
            uid: audienceUid,
            role: 'audience'
          })
        });
        
        if (!tokenResponse.ok) {
          throw new Error('Failed to get audience token for direct stream');
        }
        
        const tokenData = await tokenResponse.json();
        console.log('DirectStream: Received audience token data:', {
          ...tokenData,
          rtcToken: tokenData.rtcToken ? `${tokenData.rtcToken.substring(0, 20)}...` : 'missing',
          rtmToken: tokenData.rtmToken ? `${tokenData.rtmToken.substring(0, 20)}...` : 'missing',
          channelName: tokenData.channelName,
          uid: tokenData.uid
        });
        
        // Additional validation of tokens
        if (!tokenData.rtcToken || tokenData.rtcToken.trim() === '') {
          throw new Error('Invalid or missing RTC token received from server');
        }
        
        if (!tokenData.rtmToken || tokenData.rtmToken.trim() === '') {
          throw new Error('Invalid or missing RTM token received from server');
        }
        
        // Combine the direct access data with the tokens
        setStreamData({
          ...directData,
          rtcToken: tokenData.rtcToken,
          rtmToken: tokenData.rtmToken,
          uid: audienceUid
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error preparing direct stream:', err);
        setError(err instanceof Error ? err.message : 'Failed to prepare direct stream access');
        setIsLoading(false);
        
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to prepare direct stream access',
          variant: 'destructive'
        });
      }
    };
    
    fetchDirectStreamData();
  }, [toast]);
  
  if (isLoading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 text-white animate-spin mb-4" />
        <div className="text-white text-xl">Connecting to Stream...</div>
      </div>
    );
  }
  
  if (error || !streamData) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black p-4">
        <div className="text-red-500 text-2xl mb-4">Stream Error</div>
        <div className="text-white text-lg mb-6">{error || 'Unable to connect to stream'}</div>
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
        viewerCount={1} // Default to 1 for direct access streams
      />
    </div>
  );
}