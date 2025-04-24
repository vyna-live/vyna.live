import React, { useEffect, useState } from 'react';
import { 
  StreamVideo, 
  Call,
  CallRecording, 
  CallControls, 
  DeviceSettings, 
  CallParticipantsList, 
  SpeakerLayout, 
  useStreamVideoClient,
  StreamVideoClient
} from '@stream-io/video-react-sdk';
import '@stream-io/video-styling';
import { Loader2 } from 'lucide-react';

interface StreamVideoProps {
  apiKey: string;
  token: string;
  userId: string;
  callId: string;
  userName: string;
}

export function StreamVideo({ apiKey, token, userId, callId, userName }: StreamVideoProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize StreamVideo client
    const initClient = async () => {
      try {
        setIsConnecting(true);
        
        if (!apiKey || !token || !userId) {
          throw new Error('Missing required parameters');
        }
        
        const streamClient = new StreamVideoClient({
          apiKey,
          user: {
            id: userId,
            name: userName || userId,
          },
          token,
        });

        await streamClient.connectUser();
        setClient(streamClient);
        setIsConnecting(false);
      } catch (err) {
        console.error('Error connecting to Stream:', err);
        setError('Failed to connect to streaming service');
        setIsConnecting(false);
      }
    };

    initClient();

    // Cleanup on unmount
    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [apiKey, token, userId, userName]);
  
  const handleCallStarted = () => {
    console.log('Call started');
  };

  const handleCallEnded = () => {
    console.log('Call ended');
    if (client) {
      client.disconnectUser();
    }
  };

  if (isConnecting) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-[#A67D44] animate-spin mb-2" />
          <p className="text-[#CDBCAB]">Connecting to stream...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h3 className="text-xl font-medium text-[#CDBCAB] mb-2">Connection Error</h3>
          <p className="text-[hsl(var(--ai-text-secondary))] mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] rounded-lg text-[#EFE9E1] hover:shadow-md transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <StreamVideo client={client}>
      <Call 
        callId={callId}
        onCallStarted={handleCallStarted}
        onCallEnded={handleCallEnded}
      >
        <div className="stream-call-container flex flex-col h-full">
          {/* Main video area */}
          <div className="flex-1">
            <SpeakerLayout />
          </div>
          
          {/* Controls */}
          <div className="py-4 glassmorphic">
            <CallControls 
              enableRecording
              enableBackgroundBlur
              enabledMicrophone
              enabledCamera
              enabledScreenShare
            />
          </div>
        </div>
        
        {/* Additional UI (hidden by default) */}
        <div className="hidden">
          <CallParticipantsList />
          <DeviceSettings />
          <CallRecording />
        </div>
      </Call>
    </StreamVideo>
  );
}

export default StreamVideo;