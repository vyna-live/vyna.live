import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { StreamFormData } from "@/components/CreateStreamDialog";
import StreamVideoProvider from "@/providers/StreamVideoProvider";
import { useStreamVideo } from "@/hooks/useStreamVideo";
import StreamingSetup from "@/components/StreamingSetup";
import StreamingRoom from "@/components/StreamingRoom";
import Logo from "@/components/Logo";
import { ArrowLeft } from "lucide-react";

export default function Livestream() {
  const [, setLocation] = useLocation();
  const [teleprompterText, setTeleprompterText] = useState<string>("");
  const [streamLink, setStreamLink] = useState<string | null>(null);
  const [isJoiningStream, setIsJoiningStream] = useState<boolean>(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [egressSettings, setEgressSettings] = useState<StreamFormData['egressSettings']>();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Get teleprompter text, stream link, and egress settings from query params if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check for teleprompter text
    const text = params.get("text");
    if (text) {
      setTeleprompterText(decodeURIComponent(text));
    }
    
    // Check for egress settings
    const egress = params.get("egress");
    if (egress) {
      try {
        const egressConfig = JSON.parse(decodeURIComponent(egress));
        setEgressSettings(egressConfig);
      } catch (error) {
        console.error("Error parsing egress settings:", error);
        toast({
          title: "Warning",
          description: "Could not parse egress settings. Multiplatform streaming will be disabled.",
          variant: "destructive",
        });
      }
    }
    
    // Check for stream link
    const stream = params.get("stream");
    if (stream) {
      setStreamLink(decodeURIComponent(stream));
      setIsJoiningStream(true);
      
      // Extract the stream ID from the stream link
      try {
        // Parse the stream link to extract an ID
        const streamIdMatch = decodeURIComponent(stream).match(/([a-zA-Z0-9-_]+)(?:\.vynna\.live)?$/);
        if (streamIdMatch && streamIdMatch[1]) {
          setStreamId(streamIdMatch[1]);
        } else {
          // Generate a fallback stream ID based on the link
          setStreamId(`stream-${Date.now()}`);
        }
      } catch (error) {
        console.error("Error parsing stream link:", error);
        toast({
          title: "Error",
          description: "Could not parse the stream link format. Using a generated stream ID.",
          variant: "destructive",
        });
        
        // Use a fallback stream ID
        setStreamId(`stream-${Date.now()}`);
      }
    } else {
      // If no stream link provided, we're starting a new stream
      setStreamId(`livestream-${Date.now()}`);
    }
    
    // Simulate loading for a smoother experience
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [toast]);
  
  // If no stream ID yet, show loading
  if (!streamId || isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <Logo variant="light" size="lg" className="mb-8" />
        <div className="animate-spin h-10 w-10 border-4 border-[#A67D44] border-t-transparent rounded-full"></div>
        <div className="mt-4 text-gray-300 text-xl">Preparing your stream...</div>
      </div>
    );
  }

  // We'll use a container component to check the Stream context
  const LivestreamContainer = () => {
    const { isInitialized, isDemoMode } = useStreamVideo();
    
    // Still initializing, show a loading state
    if (!isInitialized) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
          <Logo variant="light" size="lg" className="mb-8" />
          <div className="animate-spin h-10 w-10 border-4 border-[#A67D44] border-t-transparent rounded-full"></div>
          <div className="mt-4 text-gray-300 text-xl">Connecting to streaming service...</div>
        </div>
      );
    }
    
    // We're in demo mode
    if (isDemoMode) {
      return (
        <div className="h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-gray-800/40 backdrop-blur-md rounded-xl p-8 shadow-xl border border-gray-700/50">
            <Logo variant="light" size="lg" className="mx-auto mb-6" />
            
            <h1 className="text-2xl font-bold text-center mb-4">Vyna.live Demo Mode</h1>
            
            <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-4 mb-8">
              <p className="text-center text-amber-200">
                Unable to connect to GetStream API. Showing demo mode interface only.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="flex-1 bg-black/70 rounded-lg overflow-hidden relative min-h-[240px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-gray-500">Livestream preview unavailable</div>
                </div>
              </div>
              
              <div className="w-full md:w-1/3 bg-gray-800/60 rounded-lg p-4">
                <h3 className="font-medium mb-3 text-amber-300">Teleprompter</h3>
                <div className="bg-gray-900/60 rounded-md p-4 h-[180px] overflow-auto">
                  <p className="text-gray-300">{teleprompterText || "Welcome to Vyna.live! Your AI-powered livestreaming platform."}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={() => setLocation("/")}
                className="group flex items-center space-x-2 px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-all"
              >
                <ArrowLeft className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                <span>Back to Dashboard</span>
              </button>
              
              <button 
                onClick={() => {
                  toast({
                    title: "GetStream API Required",
                    description: "To enable livestreaming functionality, please provide valid GetStream API credentials.",
                    duration: 5000,
                  });
                }}
                className="px-5 py-2 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] hover:opacity-90 rounded-md transition-all"
              >
                Request API Access
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Normal streaming UI with GetStream connected
    return (
      <div className="h-screen">
        {!isSetupComplete ? (
          <StreamingSetup 
            setIsSetupComplete={setIsSetupComplete}
            callId={streamId!}
          />
        ) : (
          <StreamingRoom 
            isPersonalRoom={isJoiningStream} 
            initialTeleprompterText={teleprompterText} 
          />
        )}
      </div>
    );
  };

  // Wrap with the provider that handles connection status
  return (
    <StreamVideoProvider>
      <LivestreamContainer />
    </StreamVideoProvider>
  );
}