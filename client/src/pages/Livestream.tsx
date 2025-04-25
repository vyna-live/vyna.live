import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import LivestreamInterface from "@/components/LivestreamInterface";
import { MessageType } from "./Home";
import { StreamVideoProvider } from "@/providers/StreamVideoProvider";
import { useToast } from "@/hooks/use-toast";

export default function Livestream() {
  const [location, setLocation] = useLocation();
  const [teleprompterText, setTeleprompterText] = useState<string>("");
  const [streamLink, setStreamLink] = useState<string | null>(null);
  const [isJoiningStream, setIsJoiningStream] = useState<boolean>(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get teleprompter text and stream link from query params if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check for teleprompter text
    const text = params.get("text");
    if (text) {
      setTeleprompterText(decodeURIComponent(text));
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
  }, [toast]);
  
  // If no stream ID yet, show loading
  if (!streamId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-pulse text-gray-300 text-xl">Loading stream...</div>
      </div>
    );
  }
  
  return (
    <StreamVideoProvider>
      <LivestreamInterface 
        initialText={teleprompterText} 
        streamId={streamId}
        isJoiningMode={isJoiningStream}
        streamLink={streamLink}
      />
    </StreamVideoProvider>
  );
}