import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import ViewerStreamInterface from '../components/ViewerStreamInterface';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamParams {
  channelName: string;
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
  } | null>(null);
  
  // Get audience token and stream info
  useEffect(() => {
    const fetchStreamInfo = async () => {
      try {
        if (!params.channelName) {
          throw new Error('No channel name specified');
        }
        
        // First get the app ID
        const appIdResponse = await fetch('/api/agora/app-id');
        if (!appIdResponse.ok) {
          throw new Error('Failed to get Agora App ID');
        }
        const appIdData = await appIdResponse.json();
        
        // Get audience token
        const tokenResponse = await fetch('/api/agora/audience-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channelName: params.channelName,
            role: 'audience'
          })
        });
        
        if (!tokenResponse.ok) {
          throw new Error('Failed to get audience token');
        }
        
        const tokenData = await tokenResponse.json();
        
        // For a real application, you'd fetch stream details from the database
        // using the channel name. For now, use placeholder values.
        setStreamData({
          appId: appIdData.appId,
          token: tokenData.token,
          channelName: params.channelName,
          streamTitle: 'Jaja Games', // This would come from the DB
          hostName: 'Divine Samuel', // This would come from the DB
          hostAvatar: 'https://randomuser.me/api/portraits/women/32.jpg' // This would come from the DB
        });
        
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
  }, [params.channelName, toast]);
  
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
      />
    </div>
  );
}
