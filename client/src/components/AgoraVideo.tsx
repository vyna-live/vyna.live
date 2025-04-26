import React, { useRef, useEffect, useState } from 'react';
import { useAgora } from '../hooks/useAgora';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

  // Setup flag to track initialization attempt
  const initAttemptedRef = useRef(false);
  
  // Track audio retry attempts
  const audioRetryAttemptsRef = useRef(0);
  
  // Get Agora client from hook with memoized configuration
  const agora = useAgora({
    mode: 'rtc',
    codec: 'h264',
    role: mode === 'livestream' ? 'host' : 'audience'
  });
  
  // Log audio state for debugging
  useEffect(() => {
    if (agora.localAudioTrack) {
      console.log('Audio track enabled:', agora.isAudioEnabled);
      console.log('Audio track state:', agora.localAudioTrack.getStats());
    }
  }, [agora.localAudioTrack, agora.isAudioEnabled]);
  
  // Simple initialization that relies on the improved useAgora hook
  useEffect(() => {
    // Stop if we've already tried to initialize
    if (initAttemptedRef.current || isReady) return;
    
    // Mark that we've attempted initialization to prevent repeated attempts
    initAttemptedRef.current = true;
    
    // Track if the component is still mounted
    let isMounted = true;
    
    const setupAgora = async () => {
      if (!isMounted) return;
      
      try {
        console.log('Setting up Agora video...');
        
        // Initialize once
        await agora.init({ channelName });
        if (!isMounted) return;
        
        // Join the channel
        await agora.join();
        
        // Mark as ready
        if (isMounted) {
          setIsReady(true);
          console.log("Agora successfully connected and ready");
        }
      } catch (error) {
        if (!isMounted) return;
        
        // Handle "already connected" errors gracefully
        if (error instanceof Error && 
            error.message?.includes('already in connected/connecting state')) {
          console.log('Already connected to Agora, continuing...');
          setIsReady(true);
          return;
        }
        
        console.error('Error setting up Agora:', error);
        const errorMsg = error instanceof Error ? 
          error.message : 'Unknown error setting up livestream';
        
        setInitError(errorMsg);
        
        if (onError) {
          onError(errorMsg);
        }
      }
    };
    
    // Setup immediately
    setupAgora();
    
    // Clean up properly
    return () => {
      isMounted = false;
      
      // Only need to leave if we were connected
      if (isReady && agora.isConnected) {
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
  }, [enableMultiplatform, isReady, rtmpDestinations, agora, toast]);
  
  // Render local video
  useEffect(() => {
    if (agora.localVideoTrack && localVideoRef.current) {
      agora.localVideoTrack.play(localVideoRef.current);
      return () => {
        agora.localVideoTrack?.stop();
      };
    }
  }, [agora.localVideoTrack]);
  
  // Repeated attempts to ensure audio works
  useEffect(() => {
    if (!agora.localAudioTrack || !isReady) return;
    
    // Force enable audio track multiple times
    const forceEnableAudio = () => {
      if (agora.localAudioTrack) {
        try {
          agora.localAudioTrack.setEnabled(true);
          agora.localAudioTrack.setVolume(100); // Maximum volume
          console.log('Forced audio enable attempt:', audioRetryAttemptsRef.current);
          audioRetryAttemptsRef.current++;
        } catch (err) {
          console.error('Error enabling audio:', err);
        }
      }
    };
    
    // Immediately try once
    forceEnableAudio();
    
    // Try several more times with increasing delays
    const timers = [
      setTimeout(forceEnableAudio, 1000),
      setTimeout(forceEnableAudio, 2000),
      setTimeout(forceEnableAudio, 3000),
      setTimeout(forceEnableAudio, 5000)
    ];
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [agora.localAudioTrack, isReady]);
  
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
    <div className={cn("w-full h-full overflow-hidden relative", className)}>
      {/* Loading state */}
      {agora.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white">Connecting to stream...</p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {(agora.error || initError) && !agora.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
          <div className="flex flex-col items-center gap-2 p-6 text-center max-w-md">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4C12.96 4 4 12.96 4 24C4 35.04 12.96 44 24 44C35.04 44 44 35.04 44 24C44 12.96 35.04 4 24 4ZM26 34H22V30H26V34ZM26 26H22V14H26V26Z" fill="#F87171"/>
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
            <p className="text-white/80 mb-4">{agora.error || initError}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="bg-white text-black hover:bg-white/90 hover:text-black"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
      
      {/* Video containers */}
      <div className="w-full h-full relative">
        {/* Remote videos container */}
        <div 
          ref={remoteVideosRef} 
          className={cn(
            "w-full h-full bg-black",
            agora.remoteUsers.length === 0 ? "hidden" : "block"
          )}
        />
        
        {/* Local video container */}
        <div 
          ref={localVideoRef}
          className={cn(
            "w-full h-full bg-black",
            agora.remoteUsers.length > 0 ? "absolute bottom-8 right-8 h-32 w-40 rounded-md overflow-hidden border border-white/30 z-10" : ""
          )}
        />
      </div>
      
      {/* Muted video indicator */}
      {!agora.isVideoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="flex flex-col items-center gap-3">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4C12.96 4 4 12.96 4 24C4 35.04 12.96 44 24 44C35.04 44 44 35.04 44 24C44 12.96 35.04 4 24 4ZM8 24C8 15.18 15.18 8 24 8C27.72 8 31.14 9.28 33.86 11.5L11.5 33.86C9.28 31.14 8 27.72 8 24ZM24 40C20.28 40 16.86 38.72 14.14 36.5L36.5 14.14C38.72 16.86 40 20.28 40 24C40 32.82 32.82 40 24 40Z" fill="white" fillOpacity="0.5"/>
            </svg>
            <p className="text-white/70 text-sm">Video is disabled</p>
          </div>
        </div>
      )}
      
      {/* Custom video controls */}
      {showControls && agora.isConnected && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={agora.toggleAudio}
              className={`rounded-full ${agora.isAudioEnabled ? 'text-white bg-transparent hover:bg-white/10' : 'text-white bg-red-500 hover:bg-red-600'} h-10 w-10`}
            >
              {agora.isAudioEnabled ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 0.833374C11.3833 0.833374 12.5 1.95004 12.5 3.33337V10C12.5 11.3834 11.3833 12.5 10 12.5C8.61667 12.5 7.5 11.3834 7.5 10V3.33337C7.5 1.95004 8.61667 0.833374 10 0.833374Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.8333 8.33337V10C15.8333 13.225 13.225 15.8334 10 15.8334C6.77501 15.8334 4.16667 13.225 4.16667 10V8.33337" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 15.8334V19.1667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.66666 19.1666H13.3333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.66666 1.66663L18.3333 18.3333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 0.833374C11.3833 0.833374 12.5 1.95004 12.5 3.33337V10C12.5008 10.4603 12.3858 10.9124 12.1666 11.3166L7.68331 6.83337V3.33337C7.68331 1.95004 8.80831 0.833374 10.1833 0.833374H10Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.8333 8.33337V10C15.8333 10.3 15.8 10.5917 15.7417 10.875L12.7917 7.92504C12.8333 7.72504 12.8583 7.52504 12.8583 7.31671V5.00004C14.0583 5.00004 15.0417 5.59171 15.5667 6.49171C15.7417 7.06671 15.8333 7.68337 15.8333 8.33337Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.14166 12.9L4.59166 10.35C4.36666 10.2417 4.16666 10.125 3.98333 10C3.76666 9.85837 3.55833 9.69171 3.39166 9.50004C3.23333 9.31671 3.10833 9.10837 3.025 8.89171C2.94166 8.67504 2.9 8.45004 2.9 8.22504V8.33337C2.9 8.99171 2.99166 9.61671 3.16666 10.1917C3.43333 11.0167 3.90833 11.75 4.51666 12.35C5.125 12.9583 5.85833 13.4333 6.68333 13.7C7.26666 13.8833 7.88333 13.9834 8.53333 13.9917L7.14166 12.9Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 15.8334C8.45 15.8334 7.025 15.3667 5.84166 14.55L7.54166 16.25C8.31666 16.6167 9.14166 16.8334 10 16.8334C11.3 16.8334 12.5167 16.4084 13.5417 15.6917C13.15 15.1834 12.8333 14.6167 12.5917 14.0167L10.8083 12.2334C10.55 12.3334 10.275 12.3834 10 12.3834C8.61666 12.3834 7.5 11.2667 7.5 9.8834V9.65004L10 12.1584V15.8334Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 15.8334V19.1667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.66666 19.1666H13.3333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={agora.toggleVideo}
              className={`rounded-full ${agora.isVideoEnabled ? 'text-white bg-transparent hover:bg-white/10' : 'text-white bg-red-500 hover:bg-red-600'} h-10 w-10`}
            >
              {agora.isVideoEnabled ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.1667 5.83329L13.3333 10L19.1667 14.1666V5.83329Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.6667 4.16663H2.50001C1.5795 4.16663 0.833344 4.91279 0.833344 5.83329V14.1666C0.833344 15.0871 1.5795 15.8333 2.50001 15.8333H11.6667C12.5872 15.8333 13.3333 15.0871 13.3333 14.1666V5.83329C13.3333 4.91279 12.5872 4.16663 11.6667 4.16663Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.66666 1.66663L18.3333 18.3333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.3333 14.1666V14.1666C13.3333 15.0871 12.5872 15.8333 11.6667 15.8333H2.5C1.57953 15.8333 0.833328 15.0871 0.833328 14.1666V5.83329C0.833328 4.91282 1.57949 4.16663 2.49996 4.16663H3.33333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.5 3.33337L13.3333 6.66671V10L14.1667 10.8333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.3333 5.83329V14.1666" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.66666 4.16663H11.6667C12.5872 4.16663 13.3333 4.91279 13.3333 5.83329V10.8333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </Button>
            
            {enableMultiplatform && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRtmpDialogOpen(true)}
                className="rounded-full bg-transparent hover:bg-white/10 text-white h-10 w-10"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 18.3333C14.6024 18.3333 18.3334 14.6024 18.3334 10C18.3334 5.39763 14.6024 1.66667 10 1.66667C5.39765 1.66667 1.66669 5.39763 1.66669 10C1.66669 14.6024 5.39765 18.3333 10 18.3333Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.1667 10H5.83335" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 5.83333V14.1667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={agora.leave}
              className="rounded-full bg-red-500 hover:bg-red-600 text-white h-10 w-10"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5 10L11.6667 5.83333V8.33333H3.33334V11.6667H11.6667V14.1667L17.5 10Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1.66669 5V15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </div>
        </div>
      )}
      
      {/* RTMP Dialog */}
      <Dialog open={isRtmpDialogOpen} onOpenChange={setIsRtmpDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle>Add Streaming Destination</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Add an RTMP URL to stream to external platforms like YouTube, Twitch, or Facebook.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rtmpUrl" className="text-white">RTMP URL</Label>
              <Input 
                id="rtmpUrl" 
                placeholder="rtmp://..." 
                value={rtmpUrl} 
                onChange={(e) => setRtmpUrl(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRtmpDialogOpen(false)}
              className="bg-transparent border-neutral-700 text-white hover:bg-neutral-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddRtmpDestination}
              className="bg-white text-black hover:bg-white/90"
            >
              Add Destination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}