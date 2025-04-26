import { useStreamVideoContext } from "@/providers/StreamVideoProvider";

/**
 * Hook to access the Stream Video context
 * Provides access to the StreamVideoClient and related state
 */
export const useStreamVideo = () => {
  const context = useStreamVideoContext();
  
  if (!context) {
    throw new Error('useStreamVideo must be used within a StreamVideoProvider');
  }
  
  return context;
};