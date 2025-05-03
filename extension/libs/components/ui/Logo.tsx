import React from 'react';

type LogoSize = 'small' | 'medium' | 'large';
type LogoVariant = 'default' | 'light' | 'dark';

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
}

const sizeMap = {
  small: { width: 80, height: 28 },
  medium: { width: 120, height: 42 },
  large: { width: 160, height: 56 }
};

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  variant = 'default',
  className = ''
}) => {
  const { width, height } = sizeMap[size];
  
  // Color scheme based on variant
  const colors = {
    primary: variant === 'light' ? '#FFFFFF' : variant === 'dark' ? '#232323' : '#5D1C34',
    secondary: variant === 'light' ? '#E0E0E0' : variant === 'dark' ? '#333333' : '#A67D44'
  };

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 120 42" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stylized "V" from Vyna */}
      <path 
        d="M12.2 4L22 32H18L10.2 8.5L2.4 32H0L10.2 4H12.2Z" 
        fill={colors.primary} 
      />
      
      {/* The remaining letters "yna" */}
      <path 
        d="M36 16V32H33V16H24V13H44V16H36ZM51.3 32.4C49.4 32.4 47.7 32 46.2 31.2C44.7 30.4 43.5 29.3 42.7 27.8C41.9 26.3 41.5 24.6 41.5 22.7C41.5 20.8 41.9 19.1 42.7 17.6C43.5 16.1 44.7 15 46.2 14.2C47.7 13.4 49.4 13 51.3 13C53.2 13 54.9 13.4 56.4 14.2C57.9 15 59.1 16.1 59.9 17.6C60.7 19.1 61.1 20.8 61.1 22.7C61.1 24.6 60.7 26.3 59.9 27.8C59.1 29.3 57.9 30.4 56.4 31.2C54.9 32 53.2 32.4 51.3 32.4ZM51.3 29.7C52.5 29.7 53.6 29.4 54.5 28.9C55.4 28.4 56.1 27.6 56.6 26.7C57.1 25.7 57.3 24.5 57.3 23.2C57.3 21.9 57.1 20.8 56.6 19.8C56.1 18.8 55.4 18.1 54.5 17.6C53.6 17.1 52.5 16.8 51.3 16.8C50.1 16.8 49 17.1 48.1 17.6C47.2 18.1 46.5 18.8 46 19.8C45.5 20.8 45.3 21.9 45.3 23.2C45.3 24.5 45.5 25.7 46 26.7C46.5 27.6 47.2 28.4 48.1 28.9C49 29.4 50.1 29.7 51.3 29.7ZM78.1 25.4H81.3V32H78.4L78.1 30.2C77.6 30.9 76.9 31.4 76 31.8C75.1 32.2 74.1 32.4 73 32.4C71 32.4 69.5 31.9 68.3 30.8C67.1 29.7 66.5 28.1 66.5 26V13H70.3V25.5C70.3 26.7 70.6 27.6 71.3 28.3C72 29 72.9 29.3 74.1 29.3C75.4 29.3 76.4 28.9 77.2 28.1C78 27.3 78.4 26.2 78.4 24.7V13H82.1V25.4H78.1Z" 
        fill={colors.primary} 
      />
      
      {/* Decorative dot/accent */}
      <circle 
        cx="92" 
        cy="22" 
        r="6" 
        fill={colors.secondary} 
      />
    </svg>
  );
};

export default Logo;
