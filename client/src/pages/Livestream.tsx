import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import LivestreamInterface from "@/components/LivestreamInterface";
import { MessageType } from "./Home";

export default function Livestream() {
  const [location, setLocation] = useLocation();
  const [teleprompterText, setTeleprompterText] = useState<string>("");
  
  // Get teleprompter text from query params if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const text = params.get("text");
    if (text) {
      setTeleprompterText(decodeURIComponent(text));
    }
  }, []);
  
  return (
    <LivestreamInterface initialText={teleprompterText} />
  );
}