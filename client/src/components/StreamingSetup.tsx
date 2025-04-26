import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/Logo';
import { 
  DeviceSettings, 
  StreamCall,
  useCallStateHooks,
  CallingState,
} from '@stream-io/video-react-sdk';

interface StreamingSetupProps {
  setIsSetupComplete: (value: boolean) => void;
  callId: string;
}

const StreamingSetup: React.FC<StreamingSetupProps> = ({ 
  setIsSetupComplete,
  callId
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAudioDevice, setHasAudioDevice] = useState<boolean>(false);
  const [hasVideoDevice, setHasVideoDevice] = useState<boolean>(false);
  const { toast } = useToast();
  
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
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-white">Preparing your streaming setup...</span>
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
            onClick={() => window.location.href = '/'}
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
                : 'bg-red-600 hover:bg-red-700 transition-colors'
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