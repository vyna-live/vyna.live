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

      {/* Logo - using exact reference image */}
      {showLogo && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10">
          <div className="w-[90px] h-[70px]">
            <svg width="100%" height="100%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
              <path d="M235 220C235 165.817 278.817 122 333 122V220H431C431 274.183 387.183 318 333 318C278.817 318 235 274.183 235 220Z" fill="#1A1A1A"/>
              <circle cx="333" cy="170" r="48" fill="#8A1538"/>
            </svg>
          </div>
        </div>
      )}

      {/* Content container with padding for logo */}
      <div className={cn(
        "relative z-10 p-6",
        showLogo && "pt-20"
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