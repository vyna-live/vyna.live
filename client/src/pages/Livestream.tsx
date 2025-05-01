import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import LivestreamInterface from "@/components/LivestreamInterface";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Livestream() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [teleprompterText, setTeleprompterText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [streamInfo, setStreamInfo] = useState<{
    appId: string | null;
    token: string | null;
    channelName: string | null;
    uid: number | null;
    streamTitle: string | null;
  }>({
    appId: null,
    token: null,
    channelName: null,
    uid: null,
    streamTitle: null
  });
  
  // Fetch stream session data
  useEffect(() => {
    async function fetchStreamSession() {
      try {
        setIsLoading(true);
        
        // Fetch stream session data from server
        const sessionResponse = await fetch('/api/user/stream-session/data');
        
        if (!sessionResponse.ok) {
          throw new Error('Failed to fetch stream session data');
        }
        
        const sessionData = await sessionResponse.json();
        
        // Fetch Agora application ID
        const appIdResponse = await fetch('/api/agora/app-id');
        const appIdData = await appIdResponse.json();
        
        // Generate host token
        const tokenResponse = await fetch('/api/agora/host-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelName: sessionData.channelName
          }),
        });
        
        const tokenData = await tokenResponse.json();
        
        // Save the token to the stream session
        await fetch('/api/user/stream-session/update-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenHost: tokenData.token
          }),
        });
        
        // Set stream info with data from database
        setStreamInfo({
          appId: appIdData.appId,
          token: tokenData.token,
          channelName: sessionData.channelName,
          uid: 1, // Host is always uid 1
          streamTitle: sessionData.streamTitle
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching stream session:', error);
        setIsLoading(false);
      }
    }

    if (isAuthenticated && user) {
      fetchStreamSession();
    } else {
      // Not authenticated, redirect to join stream page
      setLocation('/join-stream');
    }
  }, [isAuthenticated, user, setLocation]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D8C6AF]" />
        <span className="ml-2 text-white">Loading stream...</span>
      </div>
    );
  }
  
  return (
    <LivestreamInterface 
      initialText={teleprompterText}
      streamInfo={streamInfo}
    />
  );
}