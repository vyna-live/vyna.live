import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, Share2 } from "lucide-react";

interface ShareStreamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hostId: string | number;
  channelName: string;
  streamTitle?: string;
}

export default function ShareStreamDialog({
  isOpen,
  onClose,
  hostId,
  channelName,
  streamTitle = 'My Stream'
}: ShareStreamDialogProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [sharableLink, setSharableLink] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      // Create a shareable link with hostId and channel parameters
      const baseUrl = window.location.origin;
      const streamLink = `${baseUrl}/view-stream/${hostId}?channel=${encodeURIComponent(channelName)}`;
      setSharableLink(streamLink);
    }
  }, [isOpen, hostId, channelName]);
  
  // Reset the copied state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsCopied(false);
    }
  }, [isOpen]);
  
  const handleCopy = () => {
    try {
      // Using a temporary textarea to avoid focus issues with clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = sharableLink;
      textarea.style.position = 'fixed'; // Avoid scrolling to bottom
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        setIsCopied(true);
        toast({
          title: "Link copied!",
          description: "The stream link has been copied to your clipboard.",
        });
        
        // Reset the copied state after 3 seconds
        setTimeout(() => {
          setIsCopied(false);
        }, 3000);
      } else {
        throw new Error('Copy command failed');
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for devices where execCommand might not work
      toast({
        title: "Copy your link manually",
        description: "Please select and copy the link manually.",
        variant: "default"
      });
    }
  };
  
  // Native share for mobile if available
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: streamTitle,
          text: `Join my livestream: ${streamTitle}`,
          url: sharableLink,
        });
        toast({
          title: "Shared successfully!",
          description: "Your stream link has been shared.",
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // If Web Share API is not available, fall back to copy
      handleCopy();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your stream</DialogTitle>
          <DialogDescription>
            Anyone with this link can join your stream as a viewer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 mt-4">
          <div className="flex items-center space-x-2">
            <div className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-2 text-sm flex-1 overflow-hidden">
              <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
                {sharableLink}
              </div>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              className="flex-shrink-0"
              onClick={handleCopy}
            >
              {isCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-32"
            >
              Close
            </Button>
            
            <Button
              type="button"
              onClick={handleShare}
              className="w-32"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
