import React, { useEffect, useRef, useState } from 'react';
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { Video } from 'lucide-react';

interface RemoteVideoPlayerProps {
  user: IAgoraRTCRemoteUser;
}

function RemoteVideoPlayer({ user }: RemoteVideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [hasVideo, setHasVideo] = useState<boolean>(!!user.videoTrack);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    console.log('RemoteVideoPlayer mounted for user:', user.uid);
    console.log('Remote user video track exists:', !!user.videoTrack);
    
    if (!videoRef.current) {
      console.error('Video ref is not available');
      return;
    }
    
    if (!user.videoTrack) {
      console.error('Remote user has no video track');
      setHasVideo(false);
      return;
    }
    
    try {
      console.log('Attempting to play remote video');
      user.videoTrack.play(videoRef.current);
      setHasVideo(true);
      console.log('Remote video playing successfully');
      
      // Try to get video dimensions
      const mediaTrack = user.videoTrack.getMediaStreamTrack();
      if (mediaTrack) {
        const settings = mediaTrack.getSettings();
        if (settings.width && settings.height) {
          setVideoDimensions({ width: settings.width, height: settings.height });
          console.log(`Remote video dimensions: ${settings.width}x${settings.height}`);
        }
      }
      
      // Setup track ended listener
      const onTrackEnded = () => {
        console.log('Remote video track ended');
        setHasVideo(false);
      };
      
      mediaTrack?.addEventListener('ended', onTrackEnded);
      
      return () => {
        mediaTrack?.removeEventListener('ended', onTrackEnded);
      };
    } catch (err) {
      console.error('Error playing remote video:', err);
      setHasVideo(false);
    }
    
    return () => {
      console.log('RemoteVideoPlayer unmounting for user:', user.uid);
      try {
        if (user.videoTrack) {
          user.videoTrack.stop();
          console.log('Stopped remote video track');
        }
      } catch (err) {
        console.error('Error stopping remote video:', err);
      }
    };
  }, [user]);
  
  return (
    <div className="w-full h-full relative">
      <div 
        ref={videoRef} 
        className="w-full h-full agora-video-player"
      ></div>
      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50">
          <div className="p-8 rounded-full bg-gray-800/50 mb-4">
            <Video className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-white text-center">No video stream available</p>
        </div>
      )}
      
      {hasVideo && videoDimensions.width > 0 && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {videoDimensions.width}×{videoDimensions.height}
        </div>
      )}
    </div>
  );
}

export default RemoteVideoPlayer;