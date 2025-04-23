import { useRef, useState, useEffect } from "react";

export default function useTeleprompter(text: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  
  const teleprompterTextRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const currentScrollPositionRef = useRef(0);

  useEffect(() => {
    // Reset state when text changes
    setIsPlaying(false);
    currentScrollPositionRef.current = 0;
    if (teleprompterTextRef.current) {
      teleprompterTextRef.current.style.transform = 'translateY(0)';
    }
    
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [text]);

  const animate = () => {
    if (!teleprompterTextRef.current || !containerRef.current) return;
    
    const textHeight = teleprompterTextRef.current.scrollHeight;
    const containerHeight = containerRef.current.clientHeight;
    const scrollDistance = textHeight - containerHeight;
    
    if (currentScrollPositionRef.current < scrollDistance) {
      // Adjust speed factor (higher number = faster)
      const speedFactor = speed * 0.1;
      currentScrollPositionRef.current += speedFactor;
      teleprompterTextRef.current.style.transform = `translateY(-${currentScrollPositionRef.current}px)`;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed]);

  const handleRestart = () => {
    setIsPlaying(false);
    currentScrollPositionRef.current = 0;
    if (teleprompterTextRef.current) {
      teleprompterTextRef.current.style.transform = 'translateY(0)';
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(parseInt(e.target.value));
  };

  return {
    teleprompterTextRef,
    containerRef,
    isPlaying,
    speed,
    togglePlayPause,
    handleRestart,
    handleSpeedChange
  };
}
