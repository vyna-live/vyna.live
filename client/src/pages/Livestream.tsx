import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { StreamFormData } from "@/components/CreateStreamDialog";
import StreamVideoProvider from "@/providers/StreamVideoProvider";
import StreamingSetup from "@/components/StreamingSetup";
import StreamingRoom from "@/components/StreamingRoom";
import Logo from "@/components/Logo";

export default function Livestream() {
  const [location, setLocation] = useLocation();
  const [teleprompterText, setTeleprompterText] = useState<string>("");
  const [streamLink, setStreamLink] = useState<string | null>(null);
  const [isJoiningStream, setIsJoiningStream] = useState<boolean>(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [egressSettings, setEgressSettings] = useState<StreamFormData['egressSettings']>();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [call, setCall] = useState<any>(null);
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
        // This is a simplified example - in a real app, you'd have more robust parsing
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
    }, 1500);
  }, [toast]);
  
  // If no stream ID yet, show loading
  if (!streamId || isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black">
        <Logo variant="light" size="lg" className="mb-8" />
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <div className="mt-4 text-gray-300 text-xl">Preparing your stream...</div>
      </div>
    );
  }
  
  // Check if we want to use actual streaming (only when credentials are available)
  const [hasStreamCredentials, setHasStreamCredentials] = useState(false);
  
  // Check if we can access the GetStream API
  useEffect(() => {
    async function checkCredentials() {
      try {
        const response = await fetch('/api/stream/key');
        if (response.ok) {
          const data = await response.json();
          if (data.apiKey) {
            setHasStreamCredentials(true);
            return;
          }
        }
        // If we got here, we don't have valid credentials
        setHasStreamCredentials(false);
      } catch (error) {
        console.error("Failed to check GetStream credentials:", error);
        setHasStreamCredentials(false);
      }
    }
    
    checkCredentials();
  }, []);
  
  // If we don't have credentials, show a placeholder/fallback UI
  if (!hasStreamCredentials) {
    return (
      <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-gray-800/50 backdrop-blur-md rounded-xl p-8 shadow-xl">
          <Logo variant="light" size="lg" className="mx-auto mb-8" />
          
          <h1 className="text-3xl font-bold text-center mb-6">Livestreaming Demo Mode</h1>
          
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-8">
            <p className="text-center text-red-200">
              GetStream API credentials are not configured. This is a demo view of the streaming interface.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1 bg-black rounded-lg overflow-hidden relative min-h-[240px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-500">No video available in demo mode</div>
              </div>
            </div>
            
            <div className="w-full md:w-1/3 bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium mb-3">Teleprompter</h3>
              <div className="bg-gray-900 rounded-md p-4 h-[180px] overflow-auto">
                <p className="text-gray-300">{teleprompterText || "Welcome to Vyna.live! In a real stream, you would see your teleprompter text here."}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
            >
              Back to Dashboard
            </button>
            
            <button 
              onClick={() => toast({
                title: "GetStream Required",
                description: "To enable livestreaming, please add GetStream API credentials.",
              })}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-md"
            >
              Try with Credentials
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // With credentials, render the actual streaming UI
  return (
    <StreamVideoProvider>
      <div className="h-screen">
        {!isSetupComplete ? (
          <StreamingSetup 
            setIsSetupComplete={setIsSetupComplete}
            callId={streamId}
          />
        ) : (
          <StreamingRoom 
            isPersonalRoom={isJoiningStream} 
            initialTeleprompterText={teleprompterText} 
          />
        )}
      </div>
    </StreamVideoProvider>
  );
}