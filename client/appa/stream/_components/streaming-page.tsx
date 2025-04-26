"use client";
import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useGetCallById } from "@/hooks/get-call-by-id";
import Loader from "@/components/loader";
import React, { useState } from "react";
import StreamingSetup from "./streaming-setup";
import StreamingRoom from "./streaming-room";
interface StreamingPageProps {
  id: string;
}

const StreamingPage = ({ id }: StreamingPageProps) => {
  const { user, isLoaded } = useUser();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { call, isLoading } = useGetCallById(id);
  console.log(call, isLoading);
  if (!isLoaded || isLoading) return <Loader />;
  return (
    <StreamCall call={call}>
      <StreamTheme>
        {!isSetupComplete ? (
          <StreamingSetup setIsSetupComplete={setIsSetupComplete} />
        ) : (
          <StreamingRoom />
        )}
      </StreamTheme>
    </StreamCall>
  );
};
export default StreamingPage;
