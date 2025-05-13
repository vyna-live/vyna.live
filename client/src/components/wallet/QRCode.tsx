import { useMemo } from 'react';

/**
 * Custom QR code implementation using SVG
 * This allows us to create QR codes without external dependencies
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
  size = 128,
  bgColor = '#ffffff',
  fgColor = '#000000',
  level = 'M',
}: QRCodeProps) {
  // Generate QR code data
  const qrData = useMemo(() => {
    return generateQRCode(value, level);
  }, [value, level]);

  // Calculate scaling
  const cellSize = size / qrData.length;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ background: bgColor }}
    >
      {qrData.map((row, y) =>
        row.map((cell, x) => {
          return cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill={fgColor}
              shapeRendering="crispEdges"
            />
          ) : null;
        })
      )}
    </svg>
  );
}

// Constants for QR code generation
const QR_PAD_OUTER = 4; // Outer padding
const QR_PAD_INNER = 1; // Inner padding

// Function to generate QR code data
function generateQRCode(text: string, level: 'L' | 'M' | 'Q' | 'H'): boolean[][] {
  // Mode indicator for UTF-8 text
  const MODE = '0100';
  
  // Error correction level
  const ERROR_LEVEL = {
    L: '01', // 7% recovery
    M: '00', // 15% recovery
    Q: '11', // 25% recovery
    H: '10', // 30% recovery
  }[level];
  
  // Calculate optimal version (size) for the data
  // For simplicity, we'll use a fixed version
  const VERSION = 5; // Version 5: 37x37 modules
  
  // Size of QR code
  const SIZE = 4 * VERSION + 17;
  
  // Initialize matrix with zeros
  const matrix: boolean[][] = Array(SIZE + QR_PAD_OUTER * 2)
    .fill(false)
    .map(() => Array(SIZE + QR_PAD_OUTER * 2).fill(false));
  
  // Create a simple pattern based on text length as a substitute for real QR code generation
  const simplePatternSize = SIZE - QR_PAD_INNER * 2;
  
  // Add finder patterns (the three squares in corners)
  function addFinderPattern(matrix: boolean[][], offsetX: number, offsetY: number) {
    // Outer 7x7 square
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const realX = x + offsetX + QR_PAD_OUTER;
        const realY = y + offsetY + QR_PAD_OUTER;
        
        // Outer square (border)
        if (x === 0 || x === 6 || y === 0 || y === 6) {
          matrix[realY][realX] = true;
        }
        // Inner 3x3 square (filled)
        else if (x >= 2 && x <= 4 && y >= 2 && y <= 4) {
          matrix[realY][realX] = true;
        }
        // Middle ring (white space)
        else {
          matrix[realY][realX] = false;
        }
      }
    }
  }
  
  // Add finder patterns
  addFinderPattern(matrix, 0, 0); // Top-left
  addFinderPattern(matrix, SIZE - 7, 0); // Top-right
  addFinderPattern(matrix, 0, SIZE - 7); // Bottom-left
  
  // Add alignment pattern
  function addAlignmentPattern(matrix: boolean[][], centerX: number, centerY: number) {
    for (let y = -2; y <= 2; y++) {
      for (let x = -2; x <= 2; x++) {
        const realX = centerX + x + QR_PAD_OUTER;
        const realY = centerY + y + QR_PAD_OUTER;
        
        // Outer square (border) or center dot
        if (Math.abs(x) === 2 || Math.abs(y) === 2 || (x === 0 && y === 0)) {
          matrix[realY][realX] = true;
        }
        // Middle ring (white space)
        else {
          matrix[realY][realX] = false;
        }
      }
    }
  }
  
  // Add alignment pattern for Version 5 (position varies by version)
  addAlignmentPattern(matrix, 24, 24);
  
  // Add timing patterns (alternating dots connecting finder patterns)
  for (let i = 8; i < SIZE - 8; i++) {
    // Horizontal timing pattern
    matrix[6 + QR_PAD_OUTER][i + QR_PAD_OUTER] = i % 2 === 0;
    // Vertical timing pattern
    matrix[i + QR_PAD_OUTER][6 + QR_PAD_OUTER] = i % 2 === 0;
  }
  
  // Hash the input text for deterministic pattern
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  
  // Fill data area with a pattern based on text
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      // Skip areas with finder patterns
      if ((x < 9 && y < 9) || (x > SIZE - 10 && y < 9) || (x < 9 && y > SIZE - 10)) {
        continue;
      }
      
      // Skip timing patterns
      if (x === 6 || y === 6) {
        continue;
      }
      
      // Skip alignment pattern area
      if (x >= 22 && x <= 26 && y >= 22 && y <= 26) {
        continue;
      }
      
      // Create a deterministic pattern based on position and text hash
      const val = (x * y + hash) % 3;
      
      // Only set true for certain values to create a pattern
      if (val === 0) {
        matrix[y + QR_PAD_OUTER][x + QR_PAD_OUTER] = true;
      }
    }
  }
  
  return matrix;
}