import { useState, useEffect, useRef } from 'react';
import { Copy, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSolanaWallet } from '@/contexts/SolanaWalletProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { apiRequest } from '@/lib/queryClient';

interface QRCodeDisplayProps {
  walletAddress: string;
  amount: number;
  currencySymbol: 'USDC';
  tierId: string;
  onPaymentConfirmed?: () => void;
}

export function QRCodeDisplay({ 
  walletAddress, 
  amount, 
  currencySymbol, 
  tierId,
  onPaymentConfirmed 
}: QRCodeDisplayProps) {
  const { toast } = useToast();
  const { wallet } = useSolanaWallet();
  const { refetchStatus } = useSubscription();
  const [copied, setCopied] = useState(false);
  const [pollingForPayment, setPollingForPayment] = useState(false);
  const [paymentFound, setPaymentFound] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  
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

  // Payment verification polling
  useEffect(() => {
    if (pollingForPayment && !paymentConfirmed && wallet?.publicKey) {
      // Start polling for payment
      const checkPayment = async () => {
        try {
          const response = await apiRequest('POST', '/api/subscription/check-payment', {
            tierId,
            expectedAmount: amount,
            signature: 'QR-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
            walletAddress: wallet.publicKey
          });
          
          const data = await response.json();
          
          if (data.paymentFound) {
            setPaymentFound(true);
            
            if (data.success) {
              setPaymentConfirmed(true);
              setPollingForPayment(false);
              
              toast({
                title: 'Payment confirmed',
                description: 'Your subscription has been activated!',
                variant: 'default'
              });
              
              // Refetch subscription status
              refetchStatus();
              
              // Notify parent component
              if (onPaymentConfirmed) {
                onPaymentConfirmed();
              }
            } else {
              setError(data.message || 'Payment found but could not be verified');
            }
          }
        } catch (err) {
          console.error('Error checking payment:', err);
        }
      };
      
      // Initial check
      checkPayment();
      
      // Set up polling interval
      pollingIntervalRef.current = window.setInterval(checkPayment, 10000); // Check every 10 seconds
      
      return () => {
        if (pollingIntervalRef.current !== null) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [pollingForPayment, paymentConfirmed, wallet, tierId, amount, toast, refetchStatus, onPaymentConfirmed]);

  // Handle wallet address copy
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    
    // Start polling for payment
    setPollingForPayment(true);
    
    toast({
      title: 'Address copied',
      description: 'Payment address copied to clipboard. Monitoring for payments...',
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
      
      {pollingForPayment && !paymentConfirmed && !error && (
        <div className="rounded-lg bg-green-900/20 p-3 text-green-500 text-sm flex items-start gap-2 mt-2">
          <Loader2 className="h-4 w-4 animate-spin mt-0.5" />
          <span>Monitoring blockchain for your payment... This may take a few minutes.</span>
        </div>
      )}
      
      {paymentFound && !paymentConfirmed && (
        <div className="rounded-lg bg-amber-900/20 p-3 text-amber-500 text-sm flex items-start gap-2 mt-2">
          <Loader2 className="h-4 w-4 animate-spin mt-0.5" />
          <span>Payment detected! Verifying transaction details...</span>
        </div>
      )}
      
      {paymentConfirmed && (
        <div className="rounded-lg bg-green-900/20 p-3 text-green-500 text-sm flex items-start gap-2 mt-2">
          <Check className="h-4 w-4 mt-0.5" />
          <span>Payment confirmed! Your subscription has been activated.</span>
        </div>
      )}
      
      {error && (
        <div className="rounded-lg bg-red-900/20 p-3 text-red-500 text-sm flex items-start gap-2 mt-2">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {pollingForPayment && !paymentConfirmed && (
        <Button
          variant="outline"
          className="mt-2 border-neutral-700 hover:bg-neutral-800 text-sm"
          onClick={() => window.location.href = '/'}
        >
          Back to Home
        </Button>
      )}
    </div>
  );
}