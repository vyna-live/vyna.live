"use client";
import { tokenProvider } from "@/actions/stream.actions";
import Loader from "@/components/loader";
import { useUser } from "@clerk/nextjs";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import { ReactNode, useEffect, useState } from "react";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
// const token =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL1NlbmF0b3JfQmFpbF9PcmdhbmEiLCJ1c2VyX2lkIjoiU2VuYXRvcl9CYWlsX09yZ2FuYSIsInZhbGlkaXR5X2luX3NlY29uZHMiOjYwNDgwMCwiaWF0IjoxNzQ1MzI1NjUzLCJleHAiOjE3NDU5MzA0NTN9.19PLfJ18hx7VBNRo1Gzn5zk3-PRG02TkBkgH-1P1xFg";
// const userId = "Senator_Bail_Organa";
// const callId = "te7WwF5hVHBo";

// // set up the user object
// const user: User = {
//   id: userId,
//   name: "Oliver",
//   image: "https://getstream.io/random_svg/?id=oliver&name=Oliver",
// };

// const client = new StreamVideoClient({ apiKey, user, token });
// const call = client.call("default", callId);
// await call.join({ create: true });
interface StreamVideoProps {
  children: ReactNode;
}

const StreamVideoProvider = ({ children }: StreamVideoProps) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, isLoaded } = useUser();
  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!apiKey) throw new Error("Stream API Key missing");

    const client = new StreamVideoClient({
      apiKey,
      user: {
        id: user?.id,
        name: user?.username || user?.id,
        image: user?.imageUrl,
      },
      tokenProvider,
    });

    setVideoClient(client);
  }, [user, isLoaded]);
  if (!videoClient) return <Loader />;
  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
