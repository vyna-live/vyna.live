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
      // Extract stream ID from the link if it's a full URL
      let streamId = streamLink.trim();
      
      // If it's a full URL, extract just the ID
      if (streamLink.includes("/")) {
        // Extract the last part of the URL as the stream ID
        const parts = streamLink.split("/");
        streamId = parts[parts.length - 1];
      }

      // Validate the stream ID
      if (!streamId) {
        throw new Error("Invalid stream link. Please try again.");
      }

      // Fetch stream information using the ID
      const response = await fetch(`/api/stream/${streamId}/info`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join stream. The stream may not exist or is no longer active.");
      }

      // Redirect to the viewer stream page with the stream ID
      setLocation(`/view-stream/${streamId}`);
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
