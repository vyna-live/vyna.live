import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon';
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', variant = 'full' }) => {
  // Size mappings
  const sizes = {
    small: { width: variant === 'full' ? 80 : 24, height: 24 },
    medium: { width: variant === 'full' ? 120 : 32, height: 32 },
    large: { width: variant === 'full' ? 160 : 40, height: 40 },
  };
  
  const { width, height } = sizes[size];
  
  return (
    <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
      {/* Icon part */}
      <div className="logo-icon">
        <svg 
          width={height} 
          height={height} 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="40" height="40" rx="8" fill="#5D1C34" />
          <path d="M11 20C11 14.4772 15.4772 10 21 10C26.5228 10 31 14.4772 31 20C31 25.5228 26.5228 30 21 30C15.4772 30 11 25.5228 11 20Z" fill="#A67D44" />
          <path d="M15 17L27 17M15 23L27 23" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      
      {/* Text part (only shown in full variant) */}
      {variant === 'full' && (
        <div className="logo-text" style={{ marginLeft: '8px' }}>
          <svg 
            width={width - height - 8} 
            height={height} 
            viewBox="0 0 80 30" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M4.704 23L10.584 7.4H15.12L21 23H16.752L15.312 19H10.392L8.952 23H4.704ZM11.304 15.848H14.4L12.864 11.336H12.84L11.304 15.848Z" fill="#5D1C34" />
            <path d="M25.119 23L20.487 10.52H24.471L27.375 19.264H27.423L30.327 10.52H34.311L29.679 23H25.119Z" fill="#5D1C34" />
            <path d="M36.2497 23V10.52H40.1217V15.104H45.1217V10.52H48.9937V23H45.1217V18.464H40.1217V23H36.2497Z" fill="#5D1C34" />
            <path d="M55.1873 23L50.5553 10.52H54.5393L57.4433 19.264H57.4913L60.3953 10.52H64.3793L59.7473 23H55.1873Z" fill="#5D1C34" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default Logo;
