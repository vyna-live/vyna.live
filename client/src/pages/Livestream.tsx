import React, { useState } from 'react';
import { useLocation } from 'wouter';
import StreamSetup from '@/components/StreamSetup';
import StreamingRoom from '@/components/StreamingRoom';
import { Button } from '@/components/ui/button';

interface StreamSettings {
  title: string;
  description?: string;
  privacy: 'public' | 'unlisted' | 'private';
  multiplatform: boolean;
  platforms?: {
    name: 'youtube' | 'twitch' | 'facebook' | 'custom';
    enabled: boolean;
    rtmpUrl: string;
    streamKey: string;
  }[];
}

export default function LivestreamPage() {
  const [streamActive, setStreamActive] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [streamSettings, setStreamSettings] = useState<StreamSettings | null>(null);
  const [channelName, setChannelName] = useState<string>(`channel-${Date.now()}`);
  const [location, setLocation] = useLocation();
  
  // Process RTMP destinations for multiplatform streaming
  const getRtmpDestinations = (): string[] => {
    if (!streamSettings?.multiplatform || !streamSettings.platforms) {
      return [];
    }
    
    return streamSettings.platforms
      .filter(p => p.enabled)
      .map(p => {
        // Combine RTMP URL and stream key according to platform format
        if (p.name === 'youtube') {
          return p.rtmpUrl.endsWith('/') ? `${p.rtmpUrl}${p.streamKey}` : `${p.rtmpUrl}/${p.streamKey}`;
        } else if (p.name === 'twitch') {
          return p.rtmpUrl.endsWith('/') ? `${p.rtmpUrl}${p.streamKey}` : `${p.rtmpUrl}/${p.streamKey}`;
        } else if (p.name === 'facebook') {
          return p.rtmpUrl.endsWith('/') ? `${p.rtmpUrl}${p.streamKey}` : `${p.rtmpUrl}/${p.streamKey}`;
        } else {
          // Custom format
          return p.rtmpUrl.includes('?') ? `${p.rtmpUrl}&key=${p.streamKey}` : `${p.rtmpUrl}?key=${p.streamKey}`;
        }
      });
  };
  
  // Handle stream setup completion
  const handleSetupComplete = (data: StreamSettings) => {
    setStreamSettings(data);
    setSetupCompleted(true);
    setStreamActive(true);
  };
  
  // Handle ending the stream
  const handleEndStream = () => {
    setStreamActive(false);
    setLocation('/');
  };
  
  if (!setupCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-8">Start a New Stream</h1>
          <StreamSetup 
            onComplete={handleSetupComplete}
            onCancel={() => setLocation('/')}
          />
        </div>
      </div>
    );
  }
  
  if (streamActive && streamSettings) {
    return (
      <StreamingRoom 
        channelName={channelName}
        title={streamSettings.title}
        description={streamSettings.description}
        rtmpDestinations={getRtmpDestinations()}
        onEnd={handleEndStream}
      />
    );
  }
  
  // Stream ended state
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Stream Ended</h1>
        <p className="text-muted-foreground mb-8">
          Your livestream has ended. You can start a new stream or return to the dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline"
            onClick={() => setLocation('/')}
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => {
              setSetupCompleted(false);
              setChannelName(`channel-${Date.now()}`);
            }}
          >
            Start New Stream
          </Button>
        </div>
      </div>
    </div>
  );
}