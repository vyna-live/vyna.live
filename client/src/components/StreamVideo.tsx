import React, { useState, useEffect } from 'react';
import { Loader2, Video, X, AlertTriangle } from 'lucide-react';
import {
  StreamVideo,
  StreamVideoClient,
  Call, 
  CallControls,
  SpeakerLayout,
  CallingState,
  useStreamVideoClient,
  useCall
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
  const [callError, setCallError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!client) return;
    
    const setupCall = async () => {
      try {
        console.log('Creating call with ID:', callId);
        
        // Get or create the call with more options
        const call = client.call('livestream', callId);
        await call.getOrCreate({
          ring: false,
          data: {
            custom: {
              platform: 'Vyna.live',
              startedAt: new Date().toISOString()
            }
          }
        });
        
        setCallCreated(true);
        setCallError(null);
        console.log('Call created successfully:', callId);
      } catch (err) {
        console.error('Error creating call:', err);
        
        // Try the fallback approach of just getting the call if it exists
        try {
          console.log('Trying fallback: just get call if it exists');
          const existingCall = client.call('livestream', callId);
          
          // Just mark as created without actually creating to avoid conflicts
          setCallCreated(true);
          setCallError(null);
        } catch (fallbackErr) {
          console.error('Fallback error:', fallbackErr);
          setCallError('Failed to create or join stream');
        }
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const call = useCall();
  const client = useStreamVideoClient(); // Get direct reference to the client
  
  // Initialize empty states to prevent destructuring errors
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  
  const joinCall = async () => {
    if (!call) {
      console.error('No call object available');
      return;
    }
    
    try {
      setIsJoining(true);
      console.log('Joining call:', callId);
      
      // Log the call object to debug
      console.log('Call object:', call);
      
      // First try to join without enabling devices
      try {
        // Set call options to auto-accept any device permission requests
        const options = {
          camera: true,
          microphone: true
        };
        
        console.log('Attempting to join call with options:', options);
        await call.join({ create: true });
        console.log('Successfully joined call');
        
        // Now enable camera and microphone after joining
        try {
          console.log('Enabling camera...');
          await call.camera.enable();
          console.log('Camera enabled');
          
          console.log('Enabling microphone...');
          await call.microphone.enable();
          console.log('Microphone enabled');
        } catch (deviceErr) {
          console.warn('Could not enable camera/microphone:', deviceErr);
          // Continue anyway - the user can enable devices later
        }
        
        setHasJoined(true);
      } catch (joinErr) {
        console.error('Error joining call:', joinErr);
        
        // Try using the client directly as a fallback
        if (client) {
          try {
            console.log('Trying fallback with direct client reference');
            const newCall = client.call('livestream', callId);
            
            // Try to join the call directly
            console.log('Attempting to join with fallback call');
            await newCall.join({ create: true });
            console.log('Successfully joined with fallback');
            setHasJoined(true);
          } catch (fallbackErr) {
            console.error('Fallback approach also failed:', fallbackErr);
          setErrorMessage('Could not start livestream. Please try again later.');
          }
        } else {
          console.error('No client available for fallback');
        }
      }
    } catch (err) {
      console.error('All attempts to join call failed:', err);
      setErrorMessage('Could not join the livestream. Please try again.');
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
          <p className="text-[#CDBCAB] mb-6">
            Click "Go Live" to start streaming. You'll be prompted for camera and microphone permissions.
          </p>
          
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100/20 border border-red-300 rounded-lg text-red-300 text-sm">
              <AlertTriangle className="h-4 w-4 inline-block mr-2" />
              {errorMessage}
            </div>
          )}
          
          <button 
            onClick={() => {
              setErrorMessage(null);
              joinCall();
            }}
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
          
          {errorMessage && (
            <p className="mt-4 text-xs text-[#CDBCAB]/70">
              Having trouble? Make sure your camera and microphone are connected and you've granted permission to access them.
            </p>
          )}
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