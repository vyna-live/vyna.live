import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useLocation } from 'wouter';

// Import the logo variants
import logoDefault from '../assets/vp.png'; // Dark logo (dark outline)
import logoColor from '../assets/vpc.png'; // Colored logo for color mode
import logoLight from '../assets/vpw.png'; // Light logo for dark backgrounds
import logoFullLight from '../assets/vpww.png'; // Full logo with text

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light' | 'color' | 'full' | 'custom' | 'auto';
  className?: string;
  showText?: boolean;
}

export default function Logo({ 
  size = 'md', 
  variant = 'default' as LogoProps['variant'], 
  className = '',
  showText = true
}: LogoProps) {
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Check if a custom logo has been uploaded through API
    // This is kept for backward compatibility with custom logos
    if (variant === 'custom') {
      try {
        fetch('/api/logo')
          .then(response => {
            if (response.ok) {
              return response.json();
            }
            return { logoUrl: null };
          })
          .then(data => {
            if (data.logoUrl) {
              setCustomLogo(data.logoUrl);
            }
          })
          .catch(() => {
            // Fallback to default logo
          });
      } catch (error) {
        // Fallback to default logo
      }
    }
  }, [variant]);

  // Select the appropriate logo based on variant
  const getLogoSrc = () => {
    if (variant === 'custom' && customLogo) {
      return customLogo;
    }
    
    // For auto variant, pick based on theme
    if (variant === 'auto') {
      return isDarkMode ? logoColor : logoDefault;
    }
    
    switch (variant) {
      case 'color':
        return logoColor;
      case 'light':
        return logoLight;
      case 'full':
        return logoFullLight;
      case 'default':
      default:
        return logoDefault;
    }
  };

  const sizeClasses = {
    sm: showText ? 'h-6' : 'w-6 h-6',
    md: showText ? 'h-8' : 'w-8 h-8',
    lg: showText ? 'h-10' : 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  // Handle click on logo to navigate to home page
  const handleClick = () => {
    setLocation('/');
  };

  // If showing the full logo variant, we don't need to add the text separately
  if (variant === 'full') {
    return (
      <div 
        className={`flex items-center ${className} cursor-pointer`}
        onClick={handleClick}
      >
        <img 
          src={getLogoSrc()} 
          alt="vyna.live" 
          className={`h-auto max-w-[160px] ${size === 'sm' ? 'max-h-7' : size === 'lg' ? 'max-h-12' : 'max-h-9'}`} 
        />
      </div>
    );
  }
  
  return (
    <div 
      className={`flex items-center ${className} cursor-pointer`}
      onClick={handleClick}
    >
      <img 
        src={getLogoSrc()} 
        alt="vyna.live" 
        className={`${sizeClasses[size]} object-contain`} 
      />
      
      {showText && (
        <span className={`ml-2 ${textSizes[size]} font-semibold ${
          variant === 'light' ? 'text-[#EFE9E1]' : 'text-[hsl(var(--ai-text-primary))]'
        }`}>
          Vyna<span className="text-[#5D1C34]">.live</span>
        </span>
      )}
    </div>
  );
}