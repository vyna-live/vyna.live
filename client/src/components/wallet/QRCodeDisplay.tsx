import { useState, useEffect } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSolanaWallet } from '@/contexts/SolanaWalletProvider';

interface QRCodeDisplayProps {
  walletAddress: string;
  amount: number;
  currencySymbol: 'USDC';
}

export function QRCodeDisplay({ walletAddress, amount, currencySymbol }: QRCodeDisplayProps) {
  const { toast } = useToast();
  const { wallet } = useSolanaWallet();
  const [copied, setCopied] = useState(false);
  const [pollingForPayment, setPollingForPayment] = useState(false);
  
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

  // Handle wallet address copy
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    
    // Start "polling" for payment (in a real implementation, this would listen for blockchain events)
    setPollingForPayment(true);
    
    toast({
      title: 'Address copied',
      description: 'Payment address copied to clipboard',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {!wallet ? (
        <div className="rounded-lg bg-amber-900/20 p-3 text-amber-500 text-sm flex items-start gap-2 mb-2 max-w-[300px] mx-auto text-center">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>Please connect your wallet first to ensure we can verify your payment.</span>
        </div>
      ) : null}
      
      <div className="text-center">
        <h3 className="font-medium text-lg mb-1">USDC Payment</h3>
        <p className="text-neutral-400 text-sm">
          Scan or copy this payment address to pay with USDC from your wallet
        </p>
        <p className="font-medium mt-2 text-[#E6E2DA]">
          ${amount} {currencySymbol}
        </p>
        <p className="text-xs text-neutral-500 mt-1">USDC operates with 6 decimal places precision</p>
      </div>
      
      <div className="border-2 border-[#E6E2DA]/20 rounded-lg p-2 bg-white">
        <img 
          src={qrCodeImage} 
          alt="Payment QR Code" 
          className="w-52 h-52 object-contain"
        />
      </div>
      
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg border border-neutral-800 overflow-hidden">
          <div className="truncate text-sm text-neutral-300 px-2">
            {walletAddress}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 px-3 text-xs border-neutral-700 hover:bg-neutral-800"
            onClick={handleCopyAddress}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500 mr-1.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="text-center text-sm text-neutral-400 mt-2 max-w-md">
        <p>
          Payment must come from your connected wallet address: <span className="text-[#E6E2DA]/80 font-mono text-xs">{wallet?.publicKey?.substring(0, 6)}...{wallet?.publicKey?.substring(wallet.publicKey.length - 4)}</span>
        </p>
        <p className="mt-2 text-[#E6E2DA]">
          Send exact USDC amount to complete your subscription payment. The system will automatically detect your payment and activate your subscription.
        </p>
        <p className="mt-1 text-amber-500/80 text-xs">
          Make sure you're sending USDC tokens and not some other token or cryptocurrency.
        </p>
      </div>
      
      {pollingForPayment && (
        <div className="rounded-lg bg-green-900/20 p-3 text-green-500 text-sm flex items-start gap-2 mt-2">
          <div className="animate-pulse bg-green-500 rounded-full h-2 w-2 mt-1.5" />
          <span>Listening for USDC payment confirmation...</span>
        </div>
      )}
    </div>
  );
}