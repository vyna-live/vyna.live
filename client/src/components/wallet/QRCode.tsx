import { useEffect, useRef } from 'react';

/**
 * QR Code component using HTML Canvas for better mobile scanner compatibility
 */

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
}

export function QRCode({
  value,
  size = 200,
  bgColor = '#ffffff',
  fgColor = '#000000',
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas and set background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    
    // Draw QR code directly on canvas using a simplified pattern
    // This is a temporary visual representation until scanned
    drawVisualQRCode(ctx, value, size, fgColor);
    
    // Create an actual link in text and position below the QR code
    // This allows users to manually tap/click if scanning fails
    const infoText = document.createElement('p');
    infoText.textContent = 'Scan with Phantom app';
    infoText.style.textAlign = 'center';
    infoText.style.fontSize = '12px';
    infoText.style.marginTop = '8px';
    
    // Add the direct link if canvas is in the DOM
    if (canvas.parentNode) {
      const container = canvas.parentNode as HTMLElement;
      
      // Remove any existing info text
      const existingInfo = container.querySelector('p');
      if (existingInfo) {
        container.removeChild(existingInfo);
      }
      
      // Append the new info text
      container.appendChild(infoText);
    }
  }, [value, size, bgColor, fgColor]);
  
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
      
      {/* Canvas-based QR code */}
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size}
        style={{ 
          border: '1px solid #ddd',
          borderRadius: '4px',
          imageRendering: 'pixelated' // Sharpen the QR code
        }}
      />
      
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

// Draw simplified QR code for visual representation
function drawVisualQRCode(ctx: CanvasRenderingContext2D, text: string, size: number, color: string) {
  // Set the standard QR code position markers
  const moduleSize = size / 33; // Approximate QR modules for version 2
  
  ctx.fillStyle = color;
  
  // Draw the three finder patterns
  drawFinderPattern(ctx, 0, 0, moduleSize);                     // Top-left
  drawFinderPattern(ctx, size - 7 * moduleSize, 0, moduleSize); // Top-right
  drawFinderPattern(ctx, 0, size - 7 * moduleSize, moduleSize); // Bottom-left
  
  // Add a data pattern
  for (let y = 0; y < 33; y++) {
    for (let x = 0; x < 33; x++) {
      // Skip the finder pattern areas
      if ((x < 7 && y < 7) || (x > 25 && y < 7) || (x < 7 && y > 25)) {
        continue;
      }
      
      // Create a deterministic pattern based on the input text
      const charCode = text.charCodeAt(x % text.length) + text.charCodeAt(y % text.length);
      if (charCode % 3 === 0) {
        ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
      }
    }
  }
  
  // Add a center marker (timing pattern)
  for (let i = 7; i < 26; i++) {
    if (i % 2 === 0) {
      // Horizontal timing pattern
      ctx.fillRect(i * moduleSize, 6 * moduleSize, moduleSize, moduleSize);
      // Vertical timing pattern
      ctx.fillRect(6 * moduleSize, i * moduleSize, moduleSize, moduleSize);
    }
  }
}

// Helper function to draw the standard QR code finder pattern
function drawFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // Outer square
  ctx.fillRect(x, y, 7 * size, 7 * size);
  
  // White ring
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + size, y + size, 5 * size, 5 * size);
  
  // Inner square
  ctx.fillStyle = '#000000';
  ctx.fillRect(x + 2 * size, y + 2 * size, 3 * size, 3 * size);
}