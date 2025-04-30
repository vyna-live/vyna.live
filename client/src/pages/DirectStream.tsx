import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useParams } from 'wouter';
import { Loader2, AlertCircle } from 'lucide-react';
import ViewerStreamInterface from '../components/ViewerStreamInterface';
import useAgoraTokens from '../hooks/useAgoraTokens';

export default function DirectStream() {
  const params = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<{
    appId: string | null;
    channelName: string | null;
    uid: number | null;
    rtcToken: string | null;
    rtmToken: string | null;
    userName: string | null;
    streamTitle: string | null;
  }>({
    appId: null,
    channelName: null,
    uid: null,
    rtcToken: null,
    rtmToken: null,
    userName: null,
    streamTitle: 'Live Stream'
  });

  const { getAudienceTokens, isTokenLoading, tokenError } = useAgoraTokens();

  // Parse the stream code to get channelName from the URL parameter
  useEffect(() => {
    if (!params.code) {
      setError("No stream code provided");
      setIsLoading(false);
      return;
    }

    const fetchTokens = async () => {
      try {
        setIsLoading(true);
        
        // Generate a random visitor ID
        const visitorId = Math.floor(Math.random() * 1000000);
        const visitorName = `Viewer_${visitorId}`;
        
        // The code parameter is our channel name
        const channelName = params.code;
        
        // Get audience tokens for this channel
        const tokens = await getAudienceTokens(channelName, visitorId);
        
        if (tokens) {
          setStreamInfo({
            appId: tokens.appId,
            channelName: channelName,
            uid: visitorId,
            rtcToken: tokens.rtcToken,
            rtmToken: tokens.rtmToken,
            userName: visitorName,
            streamTitle: `${channelName}'s Live Stream`
          });
          setError(null);
        }
      } catch (err) {
        console.error("Error joining stream:", err);
        setError("Could not join the stream. Please check the code and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [params.code, getAudienceTokens]);
  
  // Handle token loading errors
  useEffect(() => {
    if (tokenError) {
      setError(`Error getting stream tokens: ${tokenError}`);
    }
  }, [tokenError]);

  // Redirect back to join page if there's an error
  const handleBackToJoin = () => {
    setLocation('/join');
  };
  
  if (isLoading || isTokenLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">Joining Stream...</h2>
        <p className="text-gray-400">Connecting to the live stream</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
        <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
        <h2 className="text-xl font-semibold mb-2">Could Not Join Stream</h2>
        <p className="text-gray-400 mb-4">{error}</p>
        <button 
          onClick={handleBackToJoin}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition"
        >
          Back to Join Page
        </button>
      </div>
    );
  }
  
  // If we have all the necessary stream info, render the ViewerStreamInterface
  if (
    streamInfo.appId && 
    streamInfo.channelName && 
    streamInfo.rtcToken &&
    streamInfo.uid
  ) {
    return (
      <ViewerStreamInterface
        appId={streamInfo.appId}
        channelName={streamInfo.channelName}
        rtcToken={streamInfo.rtcToken}
        rtmToken={streamInfo.rtmToken}
        uid={streamInfo.uid}
        userName={streamInfo.userName || 'Anonymous'}
        streamTitle={streamInfo.streamTitle || 'Live Stream'}
      />
    );
  }
  
  // Fallback rendering
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
      <AlertCircle className="w-12 h-12 mb-4 text-yellow-500" />
      <h2 className="text-xl font-semibold mb-2">Stream Information Missing</h2>
      <p className="text-gray-400 mb-4">Some required information is missing to join the stream.</p>
      <button 
        onClick={handleBackToJoin}
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition"
      >
        Back to Join Page
      </button>
    </div>
  );
}