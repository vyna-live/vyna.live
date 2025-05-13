import { useEffect, useRef } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  foregroundColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  padding?: number;
}

// Simple QR code implementation
export function QRCode({
  value,
  size = 200,
  backgroundColor = '#ffffff',
  foregroundColor = '#000000',
  level = 'M',
  padding = 10,
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // We'll use a canvas to generate the QR code but display as an image
    // This is a simplified implementation for a basic QR code
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);

    // Create a simple visual representation (this is not a real QR code)
    // In a real implementation, we would use a QR code generation library
    const cellSize = Math.floor((size - (padding * 2)) / 25); // 25x25 grid for simplified QR
    const startX = Math.floor((size - (cellSize * 25)) / 2);
    const startY = Math.floor((size - (cellSize * 25)) / 2);

    // Draw finder patterns (the three large squares in corners)
    const drawFinderPattern = (x: number, y: number) => {
      // Outer square
      ctx.fillStyle = foregroundColor;
      ctx.fillRect(
        startX + x * cellSize,
        startY + y * cellSize,
        cellSize * 7,
        cellSize * 7
      );
      
      // Inner white square
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        startX + (x + 1) * cellSize,
        startY + (y + 1) * cellSize,
        cellSize * 5,
        cellSize * 5
      );
      
      // Inner black square
      ctx.fillStyle = foregroundColor;
      ctx.fillRect(
        startX + (x + 2) * cellSize,
        startY + (y + 2) * cellSize,
        cellSize * 3,
        cellSize * 3
      );
    };

    // Draw the finder patterns at corners
    drawFinderPattern(0, 0); // Top-left
    drawFinderPattern(18, 0); // Top-right
    drawFinderPattern(0, 18); // Bottom-left

    // Draw timing patterns (the dotted lines between finder patterns)
    for (let i = 8; i < 17; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = foregroundColor;
      } else {
        ctx.fillStyle = backgroundColor;
      }
      
      // Horizontal timing pattern
      ctx.fillRect(
        startX + i * cellSize,
        startY + 6 * cellSize,
        cellSize,
        cellSize
      );
      
      // Vertical timing pattern
      ctx.fillRect(
        startX + 6 * cellSize,
        startY + i * cellSize,
        cellSize,
        cellSize
      );
    }

    // Create a pattern based on the input value (simplified)
    // In a real implementation, we would encode the value properly
    const hash = hashString(value);
    const pattern = generatePattern(hash, 25, 25);

    // Draw the data cells
    for (let y = 0; y < 25; y++) {
      for (let x = 0; x < 25; x++) {
        // Skip finder patterns and timing patterns
        if ((x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17) || (x === 6 || y === 6)) {
          continue;
        }

        if (pattern[y * 25 + x]) {
          ctx.fillStyle = foregroundColor;
          ctx.fillRect(
            startX + x * cellSize,
            startY + y * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }

    // Add a small Solana logo in the center
    const centerX = startX + 12.5 * cellSize;
    const centerY = startY + 12.5 * cellSize;
    const logoSize = cellSize * 5;
    
    // Draw background for logo
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(
      centerX - logoSize / 2,
      centerY - logoSize / 2,
      logoSize,
      logoSize
    );
    
    // Simple representation of Solana logo
    ctx.fillStyle = '#9945FF'; // Purple color for Solana
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoSize / 4, 0, 2 * Math.PI);
    ctx.fill();

  }, [value, size, backgroundColor, foregroundColor, level, padding]);

  return (
    <div 
      className="relative rounded-lg overflow-hidden"
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: backgroundColor,
      }}
    >
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size}
        className="absolute inset-0"
      />
      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 opacity-0">
        {value} {/* Hidden text for accessibility */}
      </div>
    </div>
  );
}

// Utility functions for our simple QR code
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function generatePattern(seed: number, width: number, height: number): boolean[] {
  const pattern = new Array(width * height).fill(false);
  const rng = seedRandom(seed);
  
  // Fill about 40% of cells with black
  for (let i = 0; i < width * height; i++) {
    if (rng() < 0.4) {
      pattern[i] = true;
    }
  }
  
  return pattern;
}

function seedRandom(seed: number) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}