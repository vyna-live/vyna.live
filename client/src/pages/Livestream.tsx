import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import LivestreamInterface from "@/components/LivestreamInterface";
import { MessageType } from "./Home";

export default function Livestream() {
  const [location, setLocation] = useLocation();
  const [teleprompterText, setTeleprompterText] = useState<string>("");
  const [streamInfo, setStreamInfo] = useState<{
    appId: string | null;
    token: string | null;
    channelName: string | null;
    uid: number | null;
  }>({
    appId: null,
    token: null,
    channelName: null,
    uid: null
  });
  
  // Get query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Get teleprompter text if available
    const text = params.get("text");
    if (text) {
      setTeleprompterText(decodeURIComponent(text));
    }
    
    // Get stream info if available
    const appId = params.get("appId");
    const token = params.get("token");
    const channelName = params.get("channelName");
    const uid = params.get("uid");
    
    if (appId && token && channelName) {
      setStreamInfo({
        appId,
        token,
        channelName,
        uid: uid ? parseInt(uid, 10) : null
      });
    }
  }, []);
  
  return (
    <LivestreamInterface 
      initialText={teleprompterText}
      streamInfo={streamInfo}
    />
  );
}