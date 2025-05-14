import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Check, CreditCard, Coins, Wallet, QrCode, Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSolanaWallet } from '@/contexts/SolanaWalletProvider';
import { SubscriptionTier } from '@/services/subscriptionService';
import { useToast } from '@/hooks/use-toast';

// Define payment status type at the top level
type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

// Helper function to check if status is processing (to avoid type errors)
const isProcessingStatus = (status: PaymentStatus): boolean => status === 'processing';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: SubscriptionTier;
  onSuccess: (signature: string, amount: string, paymentMethod: 'usdc') => void;
  isPending?: boolean;
}

export function PaymentModal({
  isOpen,
  onClose,
  selectedTier,
  onSuccess,
  isPending = false,
}: PaymentModalProps) {
  const { wallet, sendTransaction } = useSolanaWallet();
  const { toast } = useToast();
  // USDC is the only payment method now
  const paymentMethod = 'usdc';
  const [status, setStatus] = useState<PaymentStatus>('idle');
  // Keep track of processing status separately for button disabling
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentTab, setPaymentTab] = useState<'wallet' | 'qrcode'>('wallet');

  // Reset state when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state
      setStatus('idle');
      setIsProcessing(false);
      setError(null);
      setPaymentTab('wallet');
      onClose();
    }
  };

  // Reset state when tier changes
  useEffect(() => {
    if (selectedTier) {
      setStatus('idle');
      setIsProcessing(false);
      setError(null);
      setPaymentTab('wallet');
    }
  }, [selectedTier]);

  // Listen for payments on the blockchain (simulated for now)
  useEffect(() => {
    // Only run this effect if we're in QR code payment mode and status is 'idle'
    if (paymentTab === 'qrcode' && status === 'idle') {
      // In a real implementation, this would connect to a blockchain listener
      // For this demo, we'll simulate blockchain events with a timeout
      let checkInterval: NodeJS.Timeout;
      
      const checkForPayment = () => {
        // This is just for demo purposes
        // In a real implementation, we would check for actual blockchain events
        checkInterval = setTimeout(() => {
          // 10% chance of "detecting" a payment in each interval (for demo purposes)
          if (Math.random() < 0.1) {
            // Get the USDC amount with proper formatting
            const amount = selectedTier.priceUsdc.toString();
              
            // Simulate transaction signature
            const mockSignature = 'QR' + Math.random().toString(36).substring(2, 15);
            
            // Show success and call the onSuccess callback
            setStatus('success');
            onSuccess(mockSignature, amount, paymentMethod);
          }
        }, 5000); // Check every 5 seconds
      };
      
      checkForPayment();
      
      // Clean up on component unmount or when status/tab changes
      return () => {
        if (checkInterval) clearTimeout(checkInterval);
      };
    }
  }, [paymentTab, status, selectedTier, onSuccess]);

  // Handle direct wallet payment
  const handleSubmit = async () => {
    if (!wallet) {
      setError('Wallet not connected. Please connect your wallet first.');
      return;
    }

    setStatus('processing');
    setIsProcessing(true);
    setError(null);

    try {
      // Get USDC amount with 6 decimal places precision
      const amount = selectedTier.priceUsdc.toFixed(6);

      // Program wallet that receives the payment
      const recipient = 'HF7EHsCJAiQvuVyvEZpEXGAnbLk1hotBKuuTq7v9JBYU'; // Solana wallet address that receives payments
      
      // Create and send transaction
      const result = await sendTransaction({
        amount,
        recipient,
        paymentMethod,
      });

      // Check if this was a previously processed transaction
      if (result.signature === 'ALREADY_PROCESSED') {
        // Still mark as success but with a note (the toast will have already been shown by the wallet provider)
        console.log('Transaction was already processed previously');
        // No need for additional handling, just continue with success flow
      }

      // Show success and call the onSuccess callback
      setStatus('success');
      onSuccess(result.signature, amount, paymentMethod);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get content based on status
  const renderContent = () => {
    // Processing state
    if (status === 'processing') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-16 w-16 animate-spin text-[#E6E2DA] mb-4" />
          <h3 className="text-xl font-medium mb-2">Processing Payment</h3>
          <p className="text-neutral-400 text-center">
            Please confirm the transaction in your {wallet?.name} wallet.
            <br />
            Do not close this window.
          </p>
        </div>
      );
    }

    // Error state
    if (status === 'error') {
      return (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="rounded-full bg-red-900/20 p-3 mb-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">Transaction Failed</h3>
          <p className="text-neutral-400 text-center mb-4">
            {error || 'There was an error processing your payment. Please try again.'}
          </p>
          <Button onClick={() => setStatus('idle')} className="mt-2">
            Try Again
          </Button>
        </div>
      );
    }

    // Success state
    if (status === 'success') {
      return (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="rounded-full bg-green-900/20 p-3 mb-4">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">Payment Successful</h3>
          <p className="text-neutral-400 text-center">
            Thank you for subscribing to VynaAI {selectedTier.name}!
            <br />
            Your subscription is being activated.
          </p>
        </div>
      );
    }

    // Default/idle state - payment form with tabs
    return (
      <>
        <div className="space-y-4 py-2">
          <div className="bg-neutral-900 rounded-lg p-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-neutral-400">Plan</span>
              <span className="font-medium">{selectedTier.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-neutral-400">Billing</span>
              <span>Monthly</span>
            </div>
            <div className="flex justify-between font-medium text-lg pt-2 border-t border-neutral-800">
              <span>Total</span>
              <span>${selectedTier.priceUsdc} USDC</span>
            </div>
          </div>

          <div>
            <div className="mb-2 font-medium">Payment Method</div>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-[#27a0f2]/30 bg-neutral-900 p-4">
              <CreditCard className="mb-3 h-6 w-6 text-[#27a0f2]" />
              <div className="text-center">
                <p className="font-medium">USDC</p>
                <p className="text-sm text-neutral-400">USD Coin (SPL Token)</p>
              </div>
              <p className="text-xs text-neutral-500 mt-2">USDC operates with 6 decimal places precision</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-md border border-[#333]">
              <button 
                onClick={() => setPaymentTab('wallet')}
                className={`flex h-10 items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                  paymentTab === 'wallet' 
                    ? 'bg-[#252525] text-white' 
                    : 'bg-[#1a1a1a] text-neutral-400 hover:bg-[#252525]/30'
                }`}
              >
                <Wallet className="h-4 w-4" />
                Direct Payment
              </button>
              <button
                onClick={() => setPaymentTab('qrcode')}
                className={`flex h-10 items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                  paymentTab === 'qrcode' 
                    ? 'bg-[#252525] text-white' 
                    : 'bg-[#1a1a1a] text-neutral-400 hover:bg-[#252525]/30'
                }`}
              >
                <QrCode className="h-4 w-4" />
                QR Code
              </button>
            </div>
              
            {paymentTab === 'wallet' && (
              <div className="pt-4 pb-2">
                <p className="text-sm text-neutral-400 mb-4">
                  Pay directly using your connected wallet ({wallet?.name})
                </p>
                
                {error && (
                  <div className="rounded-lg bg-red-900/20 p-3 text-red-500 text-sm flex items-start gap-2 mt-4">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="border-neutral-700 text-white hover:bg-neutral-800 hover:text-white"
                    disabled={isPending || isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isPending || isProcessing}
                    className="bg-[#E6E2DA] hover:bg-[#D6D2CA] text-black"
                  >
                    {isPending || isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay ${selectedTier.priceUsdc} USDC`
                    )}
                  </Button>
                </div>
              </div>
            )}
              
            {paymentTab === 'qrcode' && (
              <div className="py-4 space-y-4">
                <div className="text-center">
                  <h3 className="font-medium mb-1">Mobile Payment</h3>
                  <p className="text-sm text-neutral-400">
                    Scan or copy this payment address to pay from your mobile wallet
                  </p>
                  <p className="font-medium mt-2">
                    {selectedTier.priceUsdc} USDC
                  </p>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className=" rounded-lg p-2 w-[200px] h-[200px]">
                    <img 
                      src="src/assets/qrcode.png" 
                      alt="Payment QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                
                <div className="mx-auto px-1">
                  <div className="flex items-center justify-between bg-[#1a1a1a] p-2 rounded-lg border border-[#333] overflow-hidden">
                    <div className="truncate text-sm text-neutral-300 pl-2">
                      HF7EHsCJAiQvuVyvEZpEXGAnbLk1hotBKuuTq7v9JBYU
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 px-3 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText("HF7EHsCJAiQvuVyvEZpEXGAnbLk1hotBKuuTq7v9JBYU");
                        toast({
                          title: "Address copied",
                          description: "Payment address copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-center text-xs text-neutral-400 px-1">
                  <p className="mb-1">
                    Payment must come from your connected wallet address: <span className="text-white font-mono">{wallet?.publicKey?.substring(0, 6)}...{wallet?.publicKey?.substring(wallet?.publicKey?.length - 4)}</span>
                  </p>
                  <p>
                    The system will automatically detect your payment and activate your subscription.
                  </p>
                </div>
                
                {error && (
                  <div className="rounded-lg bg-red-900/20 p-3 text-red-500 text-sm flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="border-[#333] text-white hover:bg-[#252525]"
                    disabled={isPending || isProcessing}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {status === 'processing' ? 'Processing Payment' : 
             status === 'success' ? 'Payment Successful' : 
             status === 'error' ? 'Payment Failed' : 
             'Complete Your Purchase'}
          </DialogTitle>
          {status === 'idle' && (
            <DialogDescription>
              Subscribe to VynaAI {selectedTier.name} using your connected wallet
            </DialogDescription>
          )}
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}