import { useEffect, useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light';
  className?: string;
}

export default function Logo({ size = 'md', variant = 'default', className = '' }: LogoProps) {
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if a custom logo has been uploaded
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
  }, []);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      {customLogo ? (
        <img 
          src={customLogo} 
          alt="vyna.live" 
          className={`${sizeClasses[size]} object-contain`} 
        />
      ) : (
        <div className={`${sizeClasses[size]} flex-shrink-0 bg-gradient-to-br from-[#40C4D0] to-[#133C40] rounded-lg flex items-center justify-center`}>
          <span className="font-bold text-white">V</span>
        </div>
      )}
      <span className={`ml-2 ${textSizes[size]} font-semibold ${variant === 'light' ? 'text-white' : 'text-[hsl(var(--ai-text-primary))]'}`}>
        vyna<span className="text-[hsl(var(--ai-accent))]">.live</span>
      </span>
    </div>
  );
}