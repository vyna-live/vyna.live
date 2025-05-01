import { useState } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/Logo';

export default function JoinStream() {
  const [streamLink, setStreamLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const handleJoinStream = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!streamLink.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid stream link',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Extract stream ID from the link
      let streamId: string | null = null;
      
      // Check if it's a full URL or just the ID
      if (streamLink.includes('/')) {
        // It's a URL, extract the ID
        const urlParts = streamLink.split('/');
        streamId = urlParts[urlParts.length - 1];
      } else {
        // Assume it's already just the ID
        streamId = streamLink.trim();
      }
      
      if (!streamId) {
        throw new Error('Invalid stream link format');
      }
      
      // Validate that the stream exists and is active
      const response = await fetch(`/api/streams/${streamId}/validate`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'The stream does not exist or is no longer active');
      }
      
      // Navigate to the view stream page
      setLocation(`/view-stream/${streamId}`);
      
    } catch (error) {
      console.error('Error joining stream:', error);
      toast({
        title: 'Error joining stream',
        description: error instanceof Error ? error.message : 'Failed to join stream. Please check the link and try again.',
        variant: 'destructive',
      });
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
        <div className="bg-[#121212] rounded-lg shadow-xl w-full max-w-md p-6">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Join a Stream</h1>
          
          <form onSubmit={handleJoinStream}>
            <div className="mb-6">
              <label className="block text-zinc-400 text-sm mb-2" htmlFor="streamLink">
                Paste the stream link or ID
              </label>
              <Input
                id="streamLink"
                value={streamLink}
                onChange={(e) => setStreamLink(e.target.value)}
                placeholder="https://vyna.live/stream/123456 or 123456"
                className="bg-[#1E1E1E] border-zinc-700 text-white"
                autoComplete="off"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#D8C6AF] text-black hover:bg-opacity-90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>
                  Joining...
                </>
              ) : 'Join Stream'}
            </Button>
          </form>
          
          <div className="mt-6">
            <p className="text-zinc-500 text-sm text-center">
              Want to start your own stream? <a href="/" className="text-[#D8C6AF] hover:underline">Go to dashboard</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
