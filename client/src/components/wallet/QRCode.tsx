import { useEffect, useState } from 'react';

/**
 * Simple QR Code component using Google Charts API
 * This provides a reliable QR code that mobile scanners can detect
 */

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
}

export function QRCode({
  value,
  size = 250,
  bgColor = 'FFFFFF',
  fgColor = '000000',
}: QRCodeProps) {
  const [encodedValue, setEncodedValue] = useState('');
  
  useEffect(() => {
    // URL encode the value for the Google Charts API
    setEncodedValue(encodeURIComponent(value));
  }, [value]);
  
  // Google Charts API QR code URL
  // This is one of the most reliable QR code generators that works well with mobile scanners
  const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chl=${encodedValue}&chs=${size}x${size}&choe=UTF-8&chld=L|0&chco=${fgColor}`;
  
  return (
    <div className="flex flex-col items-center">
      {/* Add phantom deep link directly on the page */}
      <a 
        href={value} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs text-neutral-400 mb-2"
      >
        Open in Phantom App
      </a>
      
      {/* Google Charts QR code image */}
      <div className="border border-neutral-300 rounded-lg overflow-hidden">
        <img 
          src={qrCodeUrl} 
          alt="QR Code for wallet connection" 
          width={size} 
          height={size}
          style={{ display: 'block' }}
        />
      </div>
      
      {/* Display the URL as text for fallback */}
      <div className="mt-2 w-full text-center">
        <a
          href={value}
          className="text-xs text-blue-500 underline break-all"
          target="_blank"
          rel="noopener noreferrer"
        >
          {value.length > 40 ? value.substring(0, 40) + '...' : value}
        </a>
      </div>
    </div>
  );
}