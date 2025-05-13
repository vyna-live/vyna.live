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
  // Direct URL without state management
  const encodedValue = encodeURIComponent(value || '');
  const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chl=${encodedValue}&chs=${size}x${size}&choe=UTF-8&chld=L|0`;
  
  if (!value) {
    return <div className="w-full h-full flex items-center justify-center">No QR data available</div>;
  }
  
  return (
    <div className="flex flex-col items-center">
      {/* Direct URL for app handling */}
      <a 
        href={value} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs text-neutral-400 mb-2"
      >
        Open in Wallet App
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
      
      {/* Short URL preview */}
      <div className="mt-2 text-center">
        <a
          href={value}
          className="text-xs text-blue-500 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {value.length > 30 ? value.substring(0, 30) + '...' : value}
        </a>
      </div>
    </div>
  );
}