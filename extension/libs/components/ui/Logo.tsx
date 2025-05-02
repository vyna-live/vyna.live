import React from 'react';

export interface LogoProps {
  size?: number;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 32, color = '#5D1C34' }) => {
  return (
    <div className="flex items-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M24 4C12.954 4 4 12.954 4 24C4 35.046 12.954 44 24 44C35.046 44 44 35.046 44 24C44 12.954 35.046 4 24 4Z"
          fill={color}
          fillOpacity="0.2"
        />
        <path
          d="M32 16H16V32H32V16Z"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 22L26 26"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M26 22L22 26"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M38 24C38 31.732 31.732 38 24 38C16.268 38 10 31.732 10 24C10 16.268 16.268 10 24 10C31.732 10 38 16.268 38 24Z"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="ml-2 font-bold text-xl" style={{ color }}>
        Vyna
      </span>
    </div>
  );
};

export default Logo;
