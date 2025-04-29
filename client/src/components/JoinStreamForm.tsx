import { useState } from 'react';
import { useLocation } from 'wouter';
import { X } from 'lucide-react';

interface JoinStreamFormProps {
  onClose?: () => void;
}

export default function JoinStreamForm({ onClose }: JoinStreamFormProps) {
  const [streamLink, setStreamLink] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!streamLink.trim()) {
      setError('Please enter a valid stream link');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Extract the stream ID from the link
      // Links could be in format: vyna.live/stream/[streamId] or just the streamId
      let streamId = streamLink.trim();
      
      if (streamId.includes('/')) {
        const parts = streamId.split('/');
        streamId = parts[parts.length - 1];
      }
      
      // Validate the stream ID
      const response = await fetch(`/api/livestreams/${streamId}/validate`);
      
      if (!response.ok) {
        throw new Error('Invalid stream link or stream is not active');
      }
      
      const data = await response.json();
      
      if (!data.isActive) {
        throw new Error('This stream is no longer active');
      }
      
      // Redirect to the stream view page
      setLocation(`/view-stream/${streamId}`);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-black/95 backdrop-blur-md rounded-xl border border-gray-800 p-6 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-[#5D1C34] to-[#A67D44] text-transparent bg-clip-text">Join Livestream</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="streamLink" className="block text-sm text-gray-400 mb-1">Stream Link or ID</label>
          <input
            id="streamLink"
            type="text"
            value={streamLink}
            onChange={(e) => setStreamLink(e.target.value)}
            placeholder="Enter vyna.live/stream/[id] or stream ID"
            className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5D1C34]/50 focus:border-transparent transition"
          />
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-500/20 border border-red-500/40 rounded text-red-200 text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading || !streamLink.trim()}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[#5D1C34] to-[#A67D44] rounded-lg text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:from-[#6D2C44] hover:to-[#B68D54] transition-colors"
        >
          {isLoading ? 'Connecting...' : 'Join Stream'}
        </button>
      </form>
      
      <div className="mt-4 text-center text-gray-500 text-xs">
        To join a stream, paste the stream link shared by the streamer or enter the stream ID
      </div>
    </div>
  );
}
