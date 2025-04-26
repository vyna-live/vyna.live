import React, { useEffect, useRef, useState } from 'react';
import { useAgora } from '../hooks/useAgora';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Share } from 'lucide-react';
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AgoraVideoProps {
  mode?: 'livestream' | 'conference';
  className?: string;
  onError?: (error: string) => void;
  channelName?: string;
  showControls?: boolean;
  enableMultiplatform?: boolean;
  rtmpDestinations?: string[];
}

export default function AgoraVideo({
  mode = 'livestream',
  className,
  onError,
  channelName,
  showControls = true,
  enableMultiplatform = false,
  rtmpDestinations = []
}: AgoraVideoProps) {
  // State
  const [isReady, setIsReady] = useState(false);
  const [isRtmpDialogOpen, setIsRtmpDialogOpen] = useState(false);
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [initError, setInitError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // References to video elements
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);

  // Get Agora client from hook
  const agora = useAgora({
    mode: 'rtc',
    codec: 'h264',
    role: mode === 'livestream' ? 'host' : 'audience'
  });
  
  // Initialize Agora on component mount with proper memoization
  useEffect(() => {
    // Prevent multiple initializations and API calls
    if (isReady) return;
    
    // Track if the component is still mounted
    let isMounted = true;
    const controller = new AbortController();
    
    const setupAgora = async () => {
      try {
        // Initialize Agora with channel name if provided
        await agora.init({ channelName });
        
        // Check if component is still mounted before proceeding
        if (!isMounted) return;
        
        // Join the channel
        await agora.join();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setIsReady(true);
        }
      } catch (error) {
        // Only update error state if component is still mounted
        if (!isMounted) return;
        
        console.error('Error setting up Agora:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error setting up livestream';
        setInitError(errorMsg);
        
        if (onError) {
          onError(errorMsg);
        }
      }
    };
    
    // Use a debounced initialization to prevent rapid consecutive calls
    const timeoutId = setTimeout(() => {
      setupAgora();
    }, 300);
    
    // Clean up on unmount or when dependencies change
    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
      
      // Only leave the channel if we were actually connected
      if (isReady) {
        agora.leave();
      }
    };
  }, [channelName, onError, agora, isReady]);
  
  // Add RTMP destinations for multiplatform streaming
  useEffect(() => {
    // Skip if not ready or if no destinations
    if (!isReady || !enableMultiplatform || rtmpDestinations.length === 0) {
      return;
    }
    
    // Track which destinations have been added to prevent duplicate calls
    const addedDestinations = new Set<string>();
    
    const addRtmpDestinations = async () => {
      for (const destination of rtmpDestinations) {
        // Skip if already added
        if (addedDestinations.has(destination)) {
          continue;
        }
        
        try {
          await agora.addRtmpDestination(destination);
          addedDestinations.add(destination);
          toast({
            title: 'Multiplatform streaming enabled',
            description: `Successfully connected to streaming destination`,
            variant: 'default',
          });
        } catch (error) {
          console.error('Error adding RTMP destination:', error);
          toast({
            title: 'Multiplatform streaming failed',
            description: 'Failed to connect to streaming destination',
            variant: 'destructive',
          });
        }
      }
    };
    
    addRtmpDestinations();
  }, [enableMultiplatform, isReady, rtmpDestinations, agora]);
  
  // Render local video
  useEffect(() => {
    if (agora.localVideoTrack && localVideoRef.current) {
      agora.localVideoTrack.play(localVideoRef.current);
      return () => {
        agora.localVideoTrack?.stop();
      };
    }
  }, [agora.localVideoTrack]);
  
  // Render remote videos when users join
  useEffect(() => {
    const container = remoteVideosRef.current;
    if (!container) return;
    
    // Clear existing videos
    container.innerHTML = '';
    
    // Create video elements for each remote user
    agora.remoteUsers.forEach(user => {
      if (user.videoTrack) {
        const playerContainer = document.createElement('div');
        playerContainer.className = 'remote-video-container w-full h-full';
        container.appendChild(playerContainer);
        user.videoTrack.play(playerContainer);
      }
    });
    
    return () => {
      // Clean up remote videos
      agora.remoteUsers.forEach(user => {
        if (user.videoTrack) {
          user.videoTrack.stop();
        }
      });
    };
  }, [agora.remoteUsers]);
  
  // Handle adding a custom RTMP destination
  const handleAddRtmpDestination = async () => {
    if (!rtmpUrl) {
      toast({
        title: 'RTMP URL Required',
        description: 'Please enter a valid RTMP URL',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await agora.addRtmpDestination(rtmpUrl);
      toast({
        title: 'RTMP Destination Added',
        description: 'Successfully added RTMP destination',
        variant: 'default',
      });
      setIsRtmpDialogOpen(false);
      setRtmpUrl('');
    } catch (error) {
      toast({
        title: 'Failed to Add RTMP Destination',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };
  
  // Render loading state or error
  if (agora.isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-64 bg-muted rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Initializing stream...</p>
        </div>
      </div>
    );
  }
  
  if (agora.error || initError) {
    return (
      <div className="flex items-center justify-center w-full h-64 bg-muted rounded-lg">
        <div className="flex flex-col items-center gap-2 p-4 text-center">
          <p className="text-destructive">Error: {agora.error || initError}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader className="p-2 border-b">
        <CardTitle className="text-sm flex justify-between items-center">
          <span>{agora.channelName || 'Live Stream'}</span>
          {agora.isConnected && (
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">LIVE</span>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 relative bg-black">
        {/* Main video area */}
        <div className="relative w-full">
          {/* Remote videos (displayed as main content) */}
          <div 
            ref={remoteVideosRef} 
            className={cn(
              "w-full h-full bg-black",
              agora.remoteUsers.length === 0 ? "hidden" : "block"
            )}
          />
          
          {/* If no remote videos, show local video as main */}
          <div 
            ref={localVideoRef}
            className={cn(
              "w-full aspect-video bg-black",
              agora.remoteUsers.length > 0 ? "absolute bottom-4 right-4 h-32 w-40 rounded-lg overflow-hidden border border-primary z-10" : "h-full"
            )}
          />
          
          {/* Indicator when video is off */}
          {!agora.isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <VideoOff className="h-12 w-12 text-white/50" />
            </div>
          )}
        </div>
      </CardContent>
      
      {showControls && (
        <CardFooter className="p-2 flex justify-between items-center bg-background/90 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={agora.toggleAudio}
              className={agora.isAudioEnabled ? "text-primary" : "text-destructive"}
            >
              {agora.isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={agora.toggleVideo}
              className={agora.isVideoEnabled ? "text-primary" : "text-destructive"}
            >
              {agora.isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          </div>
          
          {enableMultiplatform && (
            <div className="flex items-center">
              <Dialog open={isRtmpDialogOpen} onOpenChange={setIsRtmpDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <Share className="h-4 w-4" />
                    <span className="hidden sm:inline">Add RTMP Destination</span>
                  </Button>
                </DialogTrigger>
                
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add RTMP Destination</DialogTitle>
                    <DialogDescription>
                      Add an RTMP URL to stream to external platforms like YouTube, Twitch, or Facebook.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="rtmpUrl">RTMP URL</Label>
                      <Input 
                        id="rtmpUrl" 
                        placeholder="rtmp://..." 
                        value={rtmpUrl} 
                        onChange={(e) => setRtmpUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRtmpDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddRtmpDestination}>
                      Add Destination
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={agora.leave}
          >
            End Stream
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}