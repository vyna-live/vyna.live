import { use } from "react";

import { Suspense } from "react";
import Loader from "@/components/loader";
import StreamingPage from "../_components/streaming-page";
interface MeetingRoomProps {
  params: Promise<{
    id: string;
  }>;
}

const MeetRoom = ({ params }: MeetingRoomProps) => {
  const { id } = use(params);
  return (
    <div className="h-screen w-full">
      <StreamingPage id={id} />
    </div>
  );
};
export default MeetRoom;
