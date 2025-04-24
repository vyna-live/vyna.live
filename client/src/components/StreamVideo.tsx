import React, { useState, useEffect } from 'react';
import { Loader2, Video, X } from 'lucide-react';
import {
  Call,
  CallControls,
  SpeakerLayout,
  CallingState,
  useCall,
  ParticipantView,
  StreamVideoClient,
  DeviceSettings,
  useStreamVideoClient,
  StreamVideo as StreamVideoSdk
} from '@stream-io/video-react-sdk';

// Import styling from the package
import '@stream-io/video-react-sdk/dist/css/styles.css';

interface StreamVideoComponentProps {
  apiKey: string;
  token: string;
  userId: string;
  callId: string;
  userName: string;
}

// This component uses the proper GetStream SDK integration
export function StreamVideoComponent({ apiKey, token, userId, callId, userName }: StreamVideoComponentProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Define custom CSS for the GetStream components
  const customStyles = `
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
    
    .str-video__button {
      background: #A67D44;
      color: #EFE9E1;
    }
    
    .str-video__button:hover {
      background: #B68D54;
    }
    
    .str-video__button--muted {
      background: #dd2e44;
    }
    
    .str-video__participant-details {
      background: linear-gradient(to top, rgba(15, 16, 21, 0.9) 0%, transparent 100%);
    }
  `;

  // Initialize Stream client
  useEffect(() => {
    let videoClient: StreamVideoClient | null = null;
    
    const initializeClient = async () => {
      try {
        setIsConnecting(true);
        
        if (!apiKey || !token || !userId) {
          throw new Error('Missing Stream configuration parameters');
        }
        
        // Create new StreamVideoClient
        videoClient = new StreamVideoClient({
          apiKey,
          user: {
            id: userId, 
            name: userName || 'Livestreamer'
          },
          token,
        });
        
        // No need to call connectUser - it's already done in the constructor
        // This fixes TypeScript errors and works with the SDK
        setClient(videoClient);
        setIsConnecting(false);
      } catch (err) {
        console.error('Error initializing Stream client:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to the streaming service');
        setIsConnecting(false);
      }
    };
    
    initializeClient();
    
    // Clean up on unmount
    return () => {
      if (videoClient) {
        videoClient.disconnectUser()
          .catch(err => console.error('Error disconnecting user:', err));
      }
    };
  }, [apiKey, token, userId, userName]);
  
  if (isConnecting) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-[#A67D44] animate-spin mb-2" />
          <p className="text-[#CDBCAB]">Connecting to GetStream...</p>
        </div>
      </div>
    );
  }
  
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
  
  if (!client) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mb-4">
            <Video className="w-10 h-10 text-[#EFE9E1]" />
          </div>
          <h3 className="text-xl font-medium text-[#CDBCAB] mb-2">Stream Client Not Initialized</h3>
          <p className="text-[#CDBCAB] mb-6 max-w-md mx-auto">
            There was a problem initializing the streaming client. Please try refreshing the page.
          </p>
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
  
  return (
    <>
      <style>{customStyles}</style>
      <LivestreamCall client={client} callId={callId} callType="livestream" />
    </>
  );
}

// Component to handle the actual livestream call
function LivestreamCall({ 
  client, 
  callId,
  callType 
}: { 
  client: StreamVideoClient; 
  callId: string;
  callType: string;
}) {
  const [call, setCall] = useState<any>(null);
  
  useEffect(() => {
    const setupCall = async () => {
      try {
        // Get call instance
        const callInstance = client.call(callType, callId);
        
        // Get or create the call
        await callInstance.getOrCreate();
        
        setCall(callInstance);
      } catch (error) {
        console.error('Error setting up call:', error);
      }
    };
    
    setupCall();
  }, [client, callId, callType]);

  if (!call) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#A67D44] animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="h-full">
      <CallContent call={call} />
    </div>
  );
}

// Component to handle the call content once created
function CallContent({ call }: { call: any }) {
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  
  const handleJoinCall = async () => {
    if (!call) return;
    
    try {
      setIsJoining(true);
      await call.join();
      setHasJoined(true);
    } catch (error) {
      console.error('Error joining call:', error);
    } finally {
      setIsJoining(false);
    }
  };
  
  // Check if already in call state
  useEffect(() => {
    if (call?.state?.callingState === CallingState.JOINED) {
      setHasJoined(true);
    }
  }, [call?.state?.callingState]);
  
  if (!hasJoined) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mb-4">
            <Video className="w-10 h-10 text-[#EFE9E1]" />
          </div>
          <h3 className="text-xl font-medium text-[#CDBCAB] mb-2">Ready to Stream</h3>
          <p className="text-[#CDBCAB] mb-4 max-w-md mx-auto">
            Your stream is ready to go live. Configure your camera and microphone settings below.
          </p>
          
          {/* Add device settings component for camera preview */}
          <div className="mb-6 max-w-md mx-auto">
            <DeviceSettings />
          </div>
          
          <button 
            onClick={handleJoinCall}
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
  
  return (
    <div className="h-full">
      <div className="h-full flex flex-col relative">
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="h-full w-full">
              {/* Call participants/video area */}
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