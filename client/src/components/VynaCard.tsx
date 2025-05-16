import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import vynaLogoPath from '../assets/vyna-logo.png';

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
      "relative overflow-hidden rounded-xl border-0 shadow-md w-full",
      "bg-gradient-to-br from-[#f7f2eb] to-[#efe6dc]",
      "max-w-full mx-auto",
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

      {/* Logo - using the exact image provided */}
      {showLogo && (
        <div className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10">
          <div className="w-[70px] h-[50px] md:w-[90px] md:h-[70px] flex items-center justify-center">
            <img 
              src={vynaLogoPath} 
              alt="Vyna Live Logo" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Content container with padding for logo */}
      <div className={cn(
        "relative z-10 p-4 md:p-6",
        showLogo && "pt-16 md:pt-20"
      )}>
        <div className="w-full overflow-x-auto">
          {children}
        </div>
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