import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AgoraVideo } from "@/components/AgoraVideo";
import Logo from "@/components/Logo";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface ViewerStreamInterfaceProps {
  streamInfo: {
    appId: string | null;
    token: string | null;
    channelName: string | null;
    uid: number | null;
    streamTitle: string | null;
    hostName: string | null;
    hostId: string | number | null;
    isActive: boolean;
  };
}

export default function ViewerStreamInterface({
  streamInfo,
}: ViewerStreamInterfaceProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Check if viewport is mobile sized
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [userName, setUserName] = useState<string>(
    user ? user.displayName || user.username : "Anonymous Viewer"
  );

  // Update username when authentication state changes
  useEffect(() => {
    if (user) {
      setUserName(user.displayName || user.username);
    }
  }, [user]);

  // Handler for leaving the stream
  const handleLeaveStream = useCallback(() => {
    setLocation("/join-stream");
  }, [setLocation]);

  if (
    !streamInfo ||
    !streamInfo.appId ||
    !streamInfo.token ||
    !streamInfo.channelName
  ) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-xl mb-4">Stream Error</div>
          <p>Unable to load stream information.</p>
          <button
            onClick={() => setLocation("/join-stream")}
            className="mt-4 px-4 py-2 bg-[#D8C6AF] text-black rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative overflow-hidden bg-black p-4">
      {/* Top Navbar */}
      <div className="absolute top-4 left-4 right-4 h-12 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-between px-4 rounded-lg">
        <div className="flex items-center">
          <button
            onClick={handleLeaveStream}
            className="flex items-center text-white hover:text-[#D8C6AF] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Leave</span>
          </button>
        </div>

        <div className="flex-1 mx-4 text-center">
          <h1 className="text-white text-lg font-semibold truncate">
            {streamInfo.streamTitle || "Vyna.live Stream"}
          </h1>
        </div>

        <div className="flex items-center">
          <Logo variant="light" size="sm" className="h-6" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="h-full pt-12">
        <div className="flex h-full rounded-lg overflow-hidden">
          {/* Main livestream view */}
          <div className="w-full h-full bg-black relative rounded-lg overflow-hidden">
            {/* Stream content */}
            <AgoraVideo
              appId={streamInfo.appId}
              channelName={streamInfo.channelName}
              token={streamInfo.token}
              uid={streamInfo.uid || undefined}
              role="audience"
              userName={userName}
              hostId={streamInfo.hostId || ''}
              streamTitle={streamInfo.streamTitle || 'Live Stream'}
            />

            {/* Stream metadata overlay */}
            <div className="absolute bottom-4 left-4 z-20 bg-black/50 backdrop-blur-sm rounded-lg p-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#D8C6AF] flex items-center justify-center text-black font-bold">
                  {streamInfo.hostName ? streamInfo.hostName.charAt(0).toUpperCase() : "H"}
                </div>
                <div className="ml-2">
                  <div className="text-white text-sm font-medium">
                    {streamInfo.hostName || "Host"}
                  </div>
                  <div className="text-[#D8C6AF] text-xs">
                    Streaming Live
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
