import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface VynaCardProps {
  children: React.ReactNode;
  className?: string;
  isTeleprompter?: boolean;
  showLogo?: boolean;
  showBranding?: boolean;
}

/**
 * VynaCard - A styled card component that matches the Vyna Live design aesthetic
 * 
 * This component provides the visual container for rich content with the Vyna
 * branding elements, subtle curves, and beige/cream background.
 */
const VynaCard: React.FC<VynaCardProps> = ({
  children,
  className,
  isTeleprompter = false,
  showLogo = true,
  showBranding = true
}) => {
  return (
    <Card className={cn(
      "relative overflow-hidden rounded-xl border-0 shadow-md",
      "bg-gradient-to-br from-[#f7f2eb] to-[#efe6dc]",
      className
    )}>
      {/* Background watermark and curved lines */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large Vyna text watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <span className="text-[25vw] font-bold text-[#1A1A1A]">Vyna</span>
        </div>
        {/* Decorative curved lines */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-10">
          <div className="absolute top-0 right-0 w-full h-full border-[1px] border-[#A67D44] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-3/4 h-3/4 border-[1px] border-[#A67D44] rounded-full"></div>
        </div>
      </div>

      {/* Logo */}
      {showLogo && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
          <div className="flex items-center">
            {/* Updated logo to match reference image */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12C5 8.13401 8.13401 5 12 5V12H19C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12Z" fill="#1A1A1A"/>
              <circle cx="12" cy="8" r="3" fill="#8A1538"/>
            </svg>
            <span className="ml-1 text-xl font-semibold text-black">Vyna</span>
          </div>
          <span className="text-xs tracking-widest uppercase text-black">LIVE</span>
        </div>
      )}

      {/* Content container with padding for logo */}
      <div className={cn(
        "relative z-10 p-6",
        showLogo && "pt-16"
      )}>
        {children}
      </div>

      {/* Branding Element - Always use "JUST GO LIVE" for consistency */}
      {showBranding && (
        <div className="absolute bottom-4 right-4 z-10">
          <span className="text-sm font-bold text-[#8A1538]">
            JUST GO LIVE
          </span>
        </div>
      )}
    </Card>
  );
};

export default VynaCard;