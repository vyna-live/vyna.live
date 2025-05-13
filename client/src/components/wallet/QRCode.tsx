import { useEffect, useRef } from 'react';

/**
 * QR code component using external QR code library
 * This uses the QRious library from a CDN
 */

// Declare type for the QRious constructor
declare global {
  interface Window {
    QRious: any;
  }
}

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
}

export function QRCode({
  value,
  size = 180,
  bgColor = '#ffffff', 
  fgColor = '#000000',
  level = 'M'
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrCodeLoaded = useRef<boolean>(false);

  // Add the QRious script to the document
  useEffect(() => {
    if (!qrCodeLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
      script.async = true;
      script.onload = () => {
        qrCodeLoaded.current = true;
        renderQRCode();
      };
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    } else {
      renderQRCode();
    }
  }, [value, size, bgColor, fgColor, level]);

  // Render the QR code when the library is loaded
  const renderQRCode = () => {
    if (qrCodeLoaded.current && canvasRef.current && window.QRious) {
      new window.QRious({
        element: canvasRef.current,
        value: value,
        size: size,
        backgroundAlpha: 1,
        foreground: fgColor,
        background: bgColor,
        level: level.toLowerCase(),
        padding: 10,
      });
    }
  };

  // Fallback rendering while QRious is loading
  const renderFallback = () => {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: fgColor,
          border: `1px solid ${fgColor}`,
          borderRadius: '4px',
          fontSize: '12px',
          textAlign: 'center',
          padding: '8px'
        }}
      >
        Loading QR Code...
      </div>
    );
  };

  return (
    <div style={{ width: size, height: size }}>
      {qrCodeLoaded.current ? (
        <canvas 
          ref={canvasRef} 
          width={size} 
          height={size} 
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      ) : (
        renderFallback()
      )}
    </div>
  );
}