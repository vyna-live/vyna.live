import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

export default function JoinStream() {
  const [location, setLocation] = useLocation();
  const [streamLink, setStreamLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Parse the stream link to extract host ID and channel
      const linkStr = streamLink.trim();
      let hostId = null;
      let channelName = null;
      
      // Case 1: Full URL format with query parameter
      if (linkStr.includes('/view-stream/') && linkStr.includes('?channel=')) {
        // Extract host ID from path
        const urlObj = new URL(linkStr);
        const pathParts = urlObj.pathname.split('/');
        hostId = pathParts[pathParts.length - 1]; // Last part of the path
        
        // Extract channel name from query parameter
        channelName = urlObj.searchParams.get('channel');
      }
      // Case 2: Just the last path segment with query parameter
      else if (linkStr.includes('?channel=')) {
        const parts = linkStr.split('?');
        hostId = parts[0];
        const params = new URLSearchParams('?' + parts[1]);
        channelName = params.get('channel');
      }
      // Case 3: Legacy format or just the stream ID
      else {
        // If it's a full URL, extract just the path part
        if (linkStr.includes('://')) {
          const urlObj = new URL(linkStr);
          const pathParts = urlObj.pathname.split('/');
          hostId = pathParts[pathParts.length - 1]; // Last part of the path
        } else {
          // Just an ID or channel name
          hostId = linkStr;
        }
      }
      
      console.log(`Parsed link - Host ID: ${hostId}, Channel: ${channelName}`);
      
      // Must have at least a host ID to continue
      if (!hostId) {
        throw new Error("Invalid stream link. Please try again.");
      }
      
      // If we have both host ID and channel name, we can go directly to view stream
      if (hostId && channelName) {
        // Redirect to view stream with both parameters
        setLocation(`/view-stream/${hostId}?channel=${encodeURIComponent(channelName)}`);
        return;
      }
      
      // If we only have host ID, validate against our API
      try {
        const validateResponse = await fetch(`/api/livestreams/${hostId}/validate`);
        
        if (!validateResponse.ok) {
          const errorData = await validateResponse.json();
          throw new Error(errorData.error || "Failed to validate stream. It may not exist or is no longer active.");
        }
        
        const validateData = await validateResponse.json();
        
        // If we got channel name from validation, use that
        if (validateData.channelName) {
          channelName = validateData.channelName;
          setLocation(`/view-stream/${hostId}?channel=${encodeURIComponent(channelName)}`);
          return;
        } else {
          throw new Error("Stream exists but channel information is missing. Please use a complete link.");
        }
      } catch (validationError) {
        console.error("Stream validation error:", validationError);
        throw validationError;
      }
    } catch (error) {
      console.error("Error joining stream:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <a href="/" className="transition-opacity hover:opacity-80">
          <Logo variant="light" size="sm" className="h-6" />
        </a>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1C1C1C] rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Join a Livestream
          </h1>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-white mb-2 text-sm">
                Enter the stream link or ID
              </label>
              <input
                type="text"
                value={streamLink}
                onChange={(e) => setStreamLink(e.target.value)}
                placeholder="https://vyna.live/stream/abc123 or abc123"
                className="w-full p-3 bg-[#141414] text-white rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none"
                required
              />
              {error && (
                <p className="mt-2 text-red-500 text-sm">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#D8C6AF] text-black font-medium rounded hover:bg-opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                "Join Stream"
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a href="/" className="text-[#D8C6AF] text-sm hover:underline">
              Return to Homepage
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
