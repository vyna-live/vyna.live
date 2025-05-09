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
      {/* Background curved lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-10">
          <div className="absolute top-0 right-0 w-full h-full border-[1px] border-[#A67D44] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-3/4 h-3/4 border-[1px] border-[#A67D44] rounded-full"></div>
        </div>
      </div>

      {/* Logo */}
      {showLogo && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
          <div className="flex items-center">
            <div className="w-6 h-6 relative">
              <div className="w-full h-full rounded-full border-2 border-black"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#8A1538]"></div>
            </div>
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

      {/* Branding Element - "JUST GO LIVE" */}
      {showBranding && (
        <div className="absolute bottom-4 right-4 z-10">
          <span className="text-sm font-bold text-[#8A1538]">
            {isTeleprompter ? "JUST GO LIVE" : "VYNA LIVE"}
          </span>
        </div>
      )}
    </Card>
  );
};

export default VynaCard;