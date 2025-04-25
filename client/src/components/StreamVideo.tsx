import React, { useState, useEffect } from 'react';
import { Loader2, Video, X } from 'lucide-react';
import {
  StreamVideo,
  StreamVideoClient,
  Call, 
  CallControls,
  DeviceSettings,
  SpeakerLayout,
  CallingState,
  useStreamVideoClient,
  useCall,
  useCallStateHooks
} from '@stream-io/video-react-sdk';

// Import styling
import '@stream-io/video-react-sdk/dist/css/styles.css';

// Custom CSS for GetStream components
const customStyles = `
  :root {
    --str-video-primary-color: #A67D44;
    --str-video-secondary-color: #5D1C34;
    --str-video-text-color: #EFE9E1;
    --str-video-background-color: #16171d;
    --str-video-surface-color: #1a1b24;
  }
  
  .str-video__participant {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(205, 188, 171, 0.2);
  }
  
  .str-video__call {
    background-color: #0f1015;
    height: 100%;
    border-radius: 12px;
    overflow: hidden;
  }
  
  .str-video__call-controls {
    background: rgba(15, 16, 21, 0.6);
    border-radius: 9999px;
    padding: 8px;
    border: 1px solid rgba(205, 188, 171, 0.1);
    backdrop-filter: blur(8px);
  }
`;

interface StreamVideoComponentProps {
  apiKey: string;
  token: string;
  userId: string;
  callId: string;
  userName: string;
}

export function StreamVideoComponent({ 
  apiKey, 
  token, 
  userId, 
  callId, 
  userName 
}: StreamVideoComponentProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Initialize StreamVideo client
  useEffect(() => {
    let streamClient: StreamVideoClient | null = null;
    
    const initClient = async () => {
      try {
        console.log('Initializing StreamVideo client with:', { apiKey, userId });
        setIsConnecting(true);
        
        // Create the client
        streamClient = new StreamVideoClient({
          apiKey,
          user: {
            id: userId,
            name: userName || 'Livestreamer'
          },
          token,
        });
        
        setClient(streamClient);
        setIsConnecting(false);
      } catch (err) {
        console.error('StreamVideo client error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize streaming');
        setIsConnecting(false);
      }
    };
    
    if (apiKey && token && userId) {
      initClient();
    } else {
      setError('Missing required credentials');
      setIsConnecting(false);
    }
    
    // Cleanup function
    return () => {
      if (streamClient) {
        streamClient.disconnectUser().catch(console.error);
      }
    };
  }, [apiKey, token, userId, userName]);
  
  // Loading state
  if (isConnecting) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-[#A67D44] animate-spin mb-2" />
          <p className="text-[#CDBCAB]">Connecting to Stream Video...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-[#EFE9E1]" />
          </div>
          <h3 className="text-xl font-medium text-[#CDBCAB] mb-2">Stream Error</h3>
          <p className="text-[#CDBCAB] mb-4">{error}</p>
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
  
  // No client state
  if (!client) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mb-4">
            <Video className="w-10 h-10 text-[#EFE9E1]" />
          </div>
          <h3 className="text-xl font-medium text-[#CDBCAB] mb-2">Stream Client Not Initialized</h3>
          <p className="text-[#CDBCAB] mb-6">Could not initialize the streaming client</p>
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
  
  // Main component with StreamVideo SDK
  return (
    <>
      <style>{customStyles}</style>
      <StreamVideoWrapper client={client} callId={callId} />
    </>
  );
}

// Wrapper component for StreamVideo
function StreamVideoWrapper({ client, callId }: { client: StreamVideoClient; callId: string }) {
  return (
    <StreamVideo client={client}>
      <CallComponent callId={callId} />
    </StreamVideo>
  );
}

// Component to handle the call
function CallComponent({ callId }: { callId: string }) {
  const client = useStreamVideoClient();
  const [callCreated, setCallCreated] = useState(false);
  
  useEffect(() => {
    if (!client) return;
    
    const setupCall = async () => {
      try {
        console.log('Creating call with ID:', callId);
        
        // Get or create the call
        const call = client.call('livestream', callId);
        await call.getOrCreate();
        
        setCallCreated(true);
        console.log('Call created successfully:', callId);
      } catch (err) {
        console.error('Error creating call:', err);
      }
    };
    
    setupCall();
  }, [client, callId]);
  
  if (!callCreated) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#A67D44] animate-spin" />
      </div>
    );
  }
  
  return <CallContent callId={callId} />;
}

// Component for call content
function CallContent({ callId }: { callId: string }) {
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const call = useCall();
  
  // Initialize empty states to prevent destructuring errors
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  
  const joinCall = async () => {
    if (!call) return;
    
    try {
      setIsJoining(true);
      console.log('Joining call:', callId);
      
      // Enable camera and microphone permissions first
      try {
        await call.camera.enable();
        await call.microphone.enable();
      } catch (deviceErr) {
        console.warn('Could not enable camera/microphone:', deviceErr);
        // Continue anyway - the user can enable devices later
      }
      
      await call.join();
      setHasJoined(true);
    } catch (err) {
      console.error('Error joining call:', err);
    } finally {
      setIsJoining(false);
    }
  };
  
  // Check if we're already joined
  useEffect(() => {
    if (call?.state?.callingState === CallingState.JOINED) {
      console.log('Already joined call:', callId);
      setHasJoined(true);
    }
  }, [call?.state?.callingState, callId]);
  
  // "Go Live" screen
  if (!hasJoined) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mb-4">
            <Video className="w-10 h-10 text-[#EFE9E1]" />
          </div>
          <h3 className="text-xl font-medium text-[#CDBCAB] mb-2">Ready to Stream</h3>
          <p className="text-[#CDBCAB] mb-4">
            Configure your camera and microphone below, then click "Go Live" to start streaming.
          </p>
          
          {/* Device settings */}
          <div className="mb-6">
            <DeviceSettings />
          </div>
          
          <button 
            onClick={joinCall}
            disabled={isJoining}
            className="px-6 py-3 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] hover:from-[#B68D54] hover:to-[#6D2C44] rounded-lg text-[#EFE9E1] hover:shadow-md transition-all disabled:opacity-50"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                Joining...
              </>
            ) : (
              'Go Live'
            )}
          </button>
        </div>
      </div>
    );
  }
  
  // Live streaming view
  return (
    <div className="h-full">
      <div className="h-full flex flex-col relative">
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="h-full w-full">
              <SpeakerLayout />
            </div>
          </div>
        </div>
        <div className="p-4 flex justify-center">
          <CallControls />
        </div>
      </div>
    </div>
  );
}

export default StreamVideoComponent;