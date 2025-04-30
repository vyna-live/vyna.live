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
  const [joinType, setJoinType] = useState<'link' | 'direct'>('link');
  const [directAccessData, setDirectAccessData] = useState({
    appId: '',
    channelName: '',
    hostName: 'Streamer',
    streamTitle: 'Live Stream'
  });
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (joinType === 'link') {
      if (!streamLink.trim()) {
        setError('Please enter a valid stream link');
        return;
      }

      setIsLoading(true);
      setError('');
      
      try {
        // Extract the stream ID from the link
        // Links could be in format: 
        // - domain.com/view-stream/streamId
        // - domain.com/livestream/streamId
        // - http(s)://domain.com/view-stream/streamId
        // - or just the streamId itself
        let streamId = streamLink.trim();
        
        // Check for full URL pattern
        if (streamId.includes('://')) {
          // Remove protocol
          const withoutProtocol = streamId.split('://')[1];
          
          // Split by slashes and get the last part as stream ID
          const parts = withoutProtocol.split('/');
          if (parts.length > 1) {
            streamId = parts[parts.length - 1];
          }
        } 
        // For non-URL but with slashes (like vyna.live/view-stream/streamId)
        else if (streamId.includes('/')) {
          const parts = streamId.split('/');
          streamId = parts[parts.length - 1];
        }
        
        console.log("Extracted Stream ID:", streamId);
        
        // Validate the stream ID
        const response = await fetch(`/api/livestreams/${streamId}/validate`);
        
        if (!response.ok) {
          throw new Error('Invalid stream link or stream is not active');
        }
        
        const data = await response.json();
        
        if (!data.isActive) {
          throw new Error('This stream is no longer active');
        }
        
        console.log("Stream is active, redirecting to:", `/view-stream/${streamId}`);
        
        // Redirect to the stream view page
        setLocation(`/view-stream/${streamId}`);
      } catch (error) {
        console.error("Join stream error:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Direct access mode - using stream code
      if (!directAccessData.channelName.trim() || !directAccessData.appId.trim()) {
        setError('Stream code and App ID are required');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        // Get app ID if not provided (use our default)
        let appId = directAccessData.appId;
        if (!appId) {
          const appIdResponse = await fetch('/api/agora/app-id');
          if (!appIdResponse.ok) {
            throw new Error('Failed to get App ID');
          }
          const appIdData = await appIdResponse.json();
          appId = appIdData.appId;
        }

        // Store the direct access data in sessionStorage
        sessionStorage.setItem('directStreamData', JSON.stringify({
          appId,
          channelName: directAccessData.channelName,
          hostName: directAccessData.hostName || 'Streamer',
          streamTitle: directAccessData.streamTitle || 'Live Stream',
          directAccess: true
        }));

        // Redirect to the special direct access page
        setLocation(`/direct-stream`);
      } catch (error) {
        console.error("Direct join error:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setIsLoading(false);
      }
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
      
      <div className="flex mb-4 border border-gray-800 rounded-lg overflow-hidden">
        <button
          onClick={() => setJoinType('link')}
          className={`flex-1 py-2 text-sm font-medium ${joinType === 'link' 
            ? 'bg-gradient-to-r from-[#5D1C34]/80 to-[#A67D44]/80 text-white' 
            : 'bg-gray-900/50 text-gray-400 hover:text-white'}`}
        >
          Stream Link
        </button>
        <button
          onClick={() => setJoinType('direct')}
          className={`flex-1 py-2 text-sm font-medium ${joinType === 'direct' 
            ? 'bg-gradient-to-r from-[#5D1C34]/80 to-[#A67D44]/80 text-white' 
            : 'bg-gray-900/50 text-gray-400 hover:text-white'}`}
        >
          Stream Code
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        {joinType === 'link' ? (
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
        ) : (
          <>
            <div className="mb-3">
              <label htmlFor="channelName" className="block text-sm text-gray-400 mb-1">Stream Code</label>
              <input
                id="channelName"
                type="text"
                value={directAccessData.channelName}
                onChange={(e) => setDirectAccessData({...directAccessData, channelName: e.target.value})}
                placeholder="Enter the stream code"
                className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5D1C34]/50 focus:border-transparent transition"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="appId" className="block text-sm text-gray-400 mb-1">App ID</label>
              <input
                id="appId"
                type="text"
                value={directAccessData.appId}
                onChange={(e) => setDirectAccessData({...directAccessData, appId: e.target.value})}
                placeholder="Enter Agora App ID (optional)"
                className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5D1C34]/50 focus:border-transparent transition"
              />
            </div>
            <div className="flex gap-2">
              <div className="mb-3 flex-1">
                <label htmlFor="hostName" className="block text-sm text-gray-400 mb-1">Host Name</label>
                <input
                  id="hostName"
                  type="text"
                  value={directAccessData.hostName}
                  onChange={(e) => setDirectAccessData({...directAccessData, hostName: e.target.value})}
                  placeholder="Enter host name"
                  className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5D1C34]/50 focus:border-transparent transition"
                />
              </div>
              <div className="mb-3 flex-1">
                <label htmlFor="streamTitle" className="block text-sm text-gray-400 mb-1">Stream Title</label>
                <input
                  id="streamTitle"
                  type="text"
                  value={directAccessData.streamTitle}
                  onChange={(e) => setDirectAccessData({...directAccessData, streamTitle: e.target.value})}
                  placeholder="Enter stream title"
                  className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5D1C34]/50 focus:border-transparent transition"
                />
              </div>
            </div>
          </>
        )}
        
        {error && (
          <div className="mb-4 p-2 bg-red-500/20 border border-red-500/40 rounded text-red-200 text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading || 
            (joinType === 'link' ? !streamLink.trim() : 
             !directAccessData.channelName.trim())
          }
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[#5D1C34] to-[#A67D44] rounded-lg text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:from-[#6D2C44] hover:to-[#B68D54] transition-colors"
        >
          {isLoading ? 'Connecting...' : 'Join Stream'}
        </button>
      </form>
      
      <div className="mt-4 text-center text-gray-500 text-xs">
        {joinType === 'link' 
          ? 'To join a stream, paste the stream link shared by the streamer or enter the stream ID'
          : 'Enter the stream code and App ID to directly connect to a stream'}
      </div>
    </div>
  );
}
