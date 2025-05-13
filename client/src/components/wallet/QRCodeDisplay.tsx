import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  walletAddress: string;
  amount: number;
  currencySymbol: string;
}

export function QRCodeDisplay({ walletAddress, amount, currencySymbol }: QRCodeDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Import the QR code image - this is the one provided by the user
  const qrCodeImage = '/Untitled.png';
  
  // Reset the copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Handle address copy
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast({
      title: 'Address copied',
      description: 'Payment address copied to clipboard',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="text-center mb-2">
        <p className="text-neutral-400 text-sm">
          Scan this QR code to copy the payment address
        </p>
        <p className="font-medium mt-1">
          Amount: {amount} {currencySymbol}
        </p>
      </div>
      
      <div className="border border-neutral-800 rounded-lg p-2 bg-white">
        <img 
          src={qrCodeImage} 
          alt="Payment QR Code" 
          className="w-48 h-48 object-contain"
        />
      </div>
      
      <div className="w-full px-4">
        <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg border border-neutral-800 overflow-hidden">
          <div className="truncate text-sm text-neutral-300 w-full max-w-[180px]">
            {walletAddress}
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 px-2 text-xs"
            onClick={handleCopyAddress}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="text-center text-sm text-neutral-400 mt-2">
        <p>
          After payment, the transaction will be verified automatically.
        </p>
        <p className="mt-1">
          Please ensure you're paying from the wallet connected to this site.
        </p>
      </div>
    </div>
  );
}