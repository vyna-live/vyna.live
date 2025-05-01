import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import LivestreamInterface from "@/components/LivestreamInterface";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ViewStream() {
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<{
    appId: string | null;
    token: string | null;
    channelName: string | null;
    uid: number | null;
    streamTitle: string | null;
  }>({
    appId: null,
    token: null,
    channelName: null,
    uid: null,
    streamTitle: null
  });
  
  useEffect(() => {
    async function fetchStreamData() {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!params.id) {
          throw new Error('No stream ID provided');
        }
        
        // Fetch stream data by ID
        const streamResponse = await fetch(`/api/streams/${params.id}`);
        
        if (!streamResponse.ok) {
          const errorData = await streamResponse.json();
          throw new Error(errorData.message || 'Could not fetch stream data');
        }
        
        const streamData = await streamResponse.json();
        
        // Check if the stream is active
        if (!streamData.isLive) {
          throw new Error('This stream is not currently live');
        }
        
        // Fetch Agora application ID
        const appIdResponse = await fetch('/api/agora/app-id');
        const appIdData = await appIdResponse.json();
        
        // Generate audience token
        const tokenResponse = await fetch('/api/agora/audience-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelName: streamData.channelName
          }),
        });
        
        const tokenData = await tokenResponse.json();
        
        // Set stream info
        setStreamInfo({
          appId: appIdData.appId,
          token: tokenData.token,
          channelName: streamData.channelName,
          uid: Math.floor(Math.random() * 100000), // Generate random UID for audience
          streamTitle: streamData.streamTitle
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching stream data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load stream');
        setIsLoading(false);
        
        toast({
          title: 'Error loading stream',
          description: error instanceof Error ? error.message : 'Could not load stream data',
          variant: 'destructive'
        });
      }
    }

    fetchStreamData();
  }, [params.id, toast]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D8C6AF]" />
        <span className="ml-2 text-white">Loading stream...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="bg-[#121212] p-6 rounded-lg max-w-md text-center">
          <div className="text-red-500 mb-4 text-4xl">⚠️</div>
          <h2 className="text-white text-xl font-bold mb-3">Stream Error</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button 
            onClick={() => setLocation('/join-stream')} 
            className="px-4 py-2 bg-[#D8C6AF] text-black rounded hover:bg-opacity-90 transition-opacity"
          >
            Try Another Stream
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <LivestreamInterface 
      streamInfo={streamInfo}
      isAudience={true}
    />
  );
}