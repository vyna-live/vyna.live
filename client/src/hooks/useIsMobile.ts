import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if viewport width is mobile sized
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Consider viewports < 768px as mobile
    };

    // Run on mount
    checkMobile();

    // Add resize event listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
