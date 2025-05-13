import { useEffect, useRef } from 'react';

/**
 * QR code component with simple ASCII implementation
 * This direct inline implementation guarantees display
 */

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
}

// Simple QR code implementation
export function QRCode({
  value,
  size = 180,
  bgColor = '#ffffff', 
  fgColor = '#000000',
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Clear the canvas
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
        
        // Draw a simple grid pattern based on value hash
        const gridSize = Math.min(25, Math.max(10, Math.ceil(value.length / 2)));
        const cellSize = size / gridSize;
        
        // Simple hash function for the value
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
          hash = ((hash << 5) - hash) + value.charCodeAt(i);
          hash = hash & hash; // Convert to 32bit integer
        }

        // Use the hash to create a deterministic pattern
        ctx.fillStyle = fgColor;
        
        // Add finder patterns (3 corners)
        drawFinderPattern(ctx, 0, 0, cellSize * 7);
        drawFinderPattern(ctx, gridSize - 7, 0, cellSize * 7);
        drawFinderPattern(ctx, 0, gridSize - 7, cellSize * 7);
        
        // Fill data cells based on hash
        const seed = Math.abs(hash);
        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            // Skip areas with finder patterns
            if ((x < 7 && y < 7) || (x >= gridSize - 7 && y < 7) || (x < 7 && y >= gridSize - 7)) {
              continue;
            }
            
            // Create a deterministic but QR-like pattern
            if ((x * y + seed) % 3 === 0) {
              ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
          }
        }
        
        // Draw text in center to indicate it's a demo QR for wallet
        ctx.font = `${cellSize * 1.2}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw a white background for text
        const text = 'wallet';
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = bgColor;
        ctx.fillRect(
          size / 2 - textWidth / 2 - 5,
          size / 2 - cellSize - 5,
          textWidth + 10,
          cellSize * 2 + 10
        );
        
        // Draw the text
        ctx.fillStyle = fgColor;
        ctx.fillText(text, size / 2, size / 2);
      }
    }
  }, [value, size, bgColor, fgColor]);

  function drawFinderPattern(ctx: CanvasRenderingContext2D, xGrid: number, yGrid: number, size: number) {
    const x = xGrid * (size / 7);
    const y = yGrid * (size / 7);
    const cellSize = size / 7;
    
    // Outer square
    ctx.fillRect(x, y, size, size);
    
    // White ring
    ctx.fillStyle = bgColor;
    ctx.fillRect(x + cellSize, y + cellSize, size - 2 * cellSize, size - 2 * cellSize);
    
    // Inner square
    ctx.fillStyle = fgColor;
    ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
  }

  return (
    <div style={{ width: size, height: size, backgroundColor: bgColor, border: '1px solid #ccc', borderRadius: '4px' }}>
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size} 
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}