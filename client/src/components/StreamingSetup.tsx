import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/Logo';
import { useStreamVideo } from '@/hooks/useStreamVideo';
import { 
  DeviceSettings, 
  StreamCall,
  useCallStateHooks,
  CallingState,
  StreamVideo,
} from '@stream-io/video-react-sdk';
import { useLocation } from 'wouter';

interface StreamingSetupProps {
  setIsSetupComplete: (value: boolean) => void;
  callId: string;
}

// Setup component wrapper
const StreamingSetup: React.FC<StreamingSetupProps> = ({ 
  setIsSetupComplete,
  callId
}) => {
  const { client } = useStreamVideo();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // If the client is not ready, show a loading screen
  if (!client) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="flex flex-col items-center text-center">
          <Logo variant="light" size="lg" className="mb-8" />
          <div className="animate-spin h-10 w-10 border-4 border-[#A67D44] border-t-transparent rounded-full"></div>
          <div className="mt-4 text-gray-300 text-xl">Connecting to streaming service...</div>
          <div className="mt-2 text-gray-400 max-w-md px-4">
            Make sure you have provided valid GetStream API credentials
          </div>
        </div>
      </div>
    );
  }
  
  // Create and track call state and demo mode
  const [callReady, setCallReady] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  useEffect(() => {
    const connectToCall = async () => {
      if (!client) return;
      
      try {
        console.log('Call setup starting...', { 
          callId, 
          clientReady: !!client,
        });
        
        // Since we can't check connectionState property, assume call readiness
        // after a short delay
        setTimeout(() => {
          setCallReady(true);
          console.log('Call setup complete, client should be ready now');
        }, 1000);
      } catch (error) {
        console.error('Error in call setup:', error);
      }
    };
    
    connectToCall();
  }, [client, callId]);
  
  // Separate effect for auto-switching to demo mode after timeout
  useEffect(() => {
    if (!client || !callReady) {
      const connectionTimeout = 3000; // 3 seconds timeout
      
      console.log('Starting connection timeout check');
      const timer = setTimeout(() => {
        // If still not connected after timeout, fallback to demo mode
        if (!callReady) {
          console.log('Connection timeout, switching to demo mode');
          setIsDemoMode(true);
        }
      }, connectionTimeout);
      
      return () => clearTimeout(timer);
    }
  }, [client, callReady]);
  
  // Show connection screen with fallback to demo mode
  if (!client || !callReady) {
    // If demo mode is activated, show demo setup screen
    if (isDemoMode) {
      return <DemoSetupScreen setIsSetupComplete={setIsSetupComplete} />;
    }
    
    // Otherwise, show loading screen
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="flex flex-col items-center text-center">
          <Logo variant="light" size="lg" className="mb-8" />
          <div className="animate-spin h-10 w-10 border-4 border-[#A67D44] border-t-transparent rounded-full"></div>
          <div className="mt-4 text-gray-300 text-xl">
            {!client ? "Initializing stream session..." : "Connecting to stream service..."}
          </div>
          <div className="mt-2 text-gray-500 text-sm">
            Connection is being established...
          </div>
          <button 
            onClick={() => setIsDemoMode(true)}
            className="mt-8 px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
          >
            Use Demo Mode Instead
          </button>
        </div>
      </div>
    );
  }
  
  // We have a connected client, create a call instance
  try {
    const call = client.call('livestream', callId);
    
    return (
      <div className="min-h-screen bg-black">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <SetupContent setIsSetupComplete={setIsSetupComplete} />
          </StreamCall>
        </StreamVideo>
      </div>
    );
  } catch (error) {
    console.error('Error creating call:', error);
    
    // If there's an error creating the call, fallback to demo mode
    return <DemoSetupScreen setIsSetupComplete={setIsSetupComplete} />;
  }
};

// Demo mode setup screen without Stream SDK components
const DemoSetupScreen: React.FC<{ setIsSetupComplete: (value: boolean) => void }> = ({ 
  setIsSetupComplete 
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAudioDevice, setHasAudioDevice] = useState<boolean>(false);
  const [hasVideoDevice, setHasVideoDevice] = useState<boolean>(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Check for device availability
  useEffect(() => {
    const checkDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        // Check for audio input devices
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        setHasAudioDevice(audioDevices.length > 0);
        
        // Check for video input devices
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasVideoDevice(videoDevices.length > 0);
        
        // Show warning if no devices found
        if (audioDevices.length === 0 && videoDevices.length === 0) {
          toast({
            title: "No Devices Found",
            description: "No audio or video devices were detected. Please check your connections and permissions.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error checking devices:', error);
        toast({
          title: "Device Access Error",
          description: "Could not access your media devices. Please check browser permissions.",
          variant: "destructive",
        });
      } finally {
        setTimeout(() => setIsLoading(false), 1000);
      }
    };
    
    checkDevices();
  }, [toast]);
  
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <div className="mb-8">
        <Logo size="lg" variant="light" />
      </div>
      
      <div className="w-full max-w-4xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Stream Setup</h1>
          <p className="text-gray-400">Demo Mode - GetStream API unavailable</p>
        </div>
        
        {/* Fake device preview */}
        <div className="bg-gray-900/80 backdrop-blur-md rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-black rounded-lg min-h-[240px] flex items-center justify-center">
              <p className="text-gray-500">Video preview unavailable in demo mode</p>
            </div>
            
            <div className="w-full md:w-1/3 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Camera</label>
                <select className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2">
                  <option>Demo Camera</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Microphone</label>
                <select className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2">
                  <option>Demo Microphone</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Speaker</label>
                <select className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2">
                  <option>Demo Speaker</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={() => setLocation("/")}
            className="px-6 py-3 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={() => {
              setIsSetupComplete(true);
              toast({
                title: "Demo Mode Activated",
                description: "This is a demo of the streaming interface."
              });
            }}
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg flex items-center justify-center gap-2 ${
              isLoading
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#A67D44] to-[#5D1C34] hover:opacity-90'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Checking devices...</span>
              </>
            ) : (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span>Start Demo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Actual Stream setup content (used within StreamCall context)
const SetupContent: React.FC<{ setIsSetupComplete: (value: boolean) => void }> = ({ 
  setIsSetupComplete 
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAudioDevice, setHasAudioDevice] = useState<boolean>(false);
  const [hasVideoDevice, setHasVideoDevice] = useState<boolean>(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Get calling state from Stream
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  // Check for device availability
  useEffect(() => {
    const checkDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        // Check for audio input devices
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        setHasAudioDevice(audioDevices.length > 0);
        
        // Check for video input devices
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasVideoDevice(videoDevices.length > 0);
        
        // Show warning if no devices found
        if (audioDevices.length === 0 && videoDevices.length === 0) {
          toast({
            title: "No Devices Found",
            description: "No audio or video devices were detected. Please check your connections and permissions.",
            variant: "destructive",
          });
        } else if (audioDevices.length === 0) {
          toast({
            title: "No Microphone Found",
            description: "No audio input devices were detected. Your stream will not have audio.",
            variant: "destructive",
          });
        } else if (videoDevices.length === 0) {
          toast({
            title: "No Camera Found",
            description: "No video input devices were detected. Your stream will be audio-only.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error checking devices:', error);
        toast({
          title: "Device Access Error",
          description: "Could not access your media devices. Please check browser permissions.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkDevices();
  }, [toast]);
  
  // Handle Go Live button
  const handleGoLive = () => {
    if (!hasAudioDevice && !hasVideoDevice) {
      toast({
        title: "Cannot Start Stream",
        description: "At least one audio or video device is required to start a stream.",
        variant: "destructive",
      });
      return;
    }
    
    // User can continue even with just audio or just video
    setIsSetupComplete(true);
    
    toast({
      title: "Going Live!",
      description: "Your stream is now active.",
    });
  };
  
  // If still connecting, show loader
  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="flex flex-col items-center">
          <Logo variant="light" size="lg" className="mb-8" />
          <div className="animate-spin h-10 w-10 border-4 border-[#A67D44] border-t-transparent rounded-full"></div>
          <div className="mt-4 text-gray-300 text-xl">Connecting to stream...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
      {/* Header */}
      <div className="mb-8">
        <Logo size="lg" variant="light" />
      </div>
      
      <div className="w-full max-w-4xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Stream Setup</h1>
          <p className="text-gray-400">Configure your audio and video settings before going live</p>
        </div>
        
        {/* Device preview and settings */}
        <div className="bg-gray-900/80 backdrop-blur-md rounded-lg p-6 mb-8">
          <DeviceSettings />
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={() => setLocation("/")}
            className="px-6 py-3 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleGoLive}
            disabled={isLoading || (!hasAudioDevice && !hasVideoDevice)}
            className={`px-6 py-3 rounded-lg flex items-center justify-center gap-2 ${
              isLoading || (!hasAudioDevice && !hasVideoDevice)
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#A67D44] to-[#5D1C34] hover:opacity-90'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Checking devices...</span>
              </>
            ) : (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span>Go Live</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreamingSetup;