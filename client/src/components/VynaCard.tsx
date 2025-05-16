import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import vynaLogoPath from '../assets/vyna-logo.png';
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const isMobile = useIsMobile();
  
  return (
    <Card className={cn(
      "vynacard-mobile relative overflow-hidden rounded-xl border-0 shadow-md w-full",
      "bg-gradient-to-br from-[#f7f2eb] to-[#efe6dc]",
      className
    )}>
      {/* Background watermark and curved lines */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large Vyna text watermark - hidden on mobile */}
        {!isMobile && (
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <span className="text-[25vw] font-bold text-[#1A1A1A]">Vyna</span>
          </div>
        )}
        {/* Decorative curved lines */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-10">
          <div className="absolute top-0 right-0 w-full h-full border-[1px] border-[#A67D44] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-3/4 h-3/4 border-[1px] border-[#A67D44] rounded-full"></div>
        </div>
      </div>

      {/* Logo - using the exact image provided, hide on mobile */}
      {showLogo && !isMobile && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10">
          <div className="w-[90px] h-[70px] flex items-center justify-center">
            <img 
              src={vynaLogoPath} 
              alt="Vyna Live Logo" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Content container with padding for logo - reduced padding on mobile */}
      <div className={cn(
        "relative z-10 p-4 sm:p-6",
        showLogo && !isMobile ? "pt-20" : "pt-4"
      )}>
        {children}
      </div>

      {/* Branding Element - Always use "JUST GO LIVE" for consistency, hide on mobile */}
      {showBranding && !isMobile && (
        <div className="absolute bottom-4 right-4 z-10">
          <span className="text-sm font-bold text-[#E8B85B]"> {/* Darker gold color for better contrast */}
            JUST GO LIVE
          </span>
        </div>
      )}
    </Card>
  );
};

export default VynaCard;