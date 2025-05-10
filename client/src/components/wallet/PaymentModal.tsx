import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Check, CreditCard, Coins } from 'lucide-react';
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
import { useSolanaWallet } from '@/contexts/SolanaWalletProvider';
import { SubscriptionTier } from '@/services/subscriptionService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: SubscriptionTier;
  onSuccess: (signature: string, amount: string, paymentMethod: 'sol' | 'usdc') => void;
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
  const [paymentMethod, setPaymentMethod] = useState<'sol' | 'usdc'>('sol');
  type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Reset state when tier changes
  useEffect(() => {
    if (selectedTier) {
      setStatus('idle');
      setError(null);
    }
  }, [selectedTier]);

  // Handle payment
  const handleSubmit = async () => {
    if (!wallet) {
      setError('Wallet not connected. Please connect your wallet first.');
      return;
    }

    setStatus('processing');
    setError(null);

    try {
      // Get amount based on payment method
      const amount = paymentMethod === 'sol' 
        ? selectedTier.priceSol.toString()
        : selectedTier.priceUsdc.toString();

      // Program wallet that receives the payment (would be configured in production)
      const recipient = process.env.NODE_ENV === 'development' 
        ? 'mock_program_wallet_address'  // Mock address for development
        : '5FHgaHwGCEW31KNu7Xv4KhQTQXTXBkREPgzAixRjUU56'; // Example Solana address
      
      // Create and send transaction
      const result = await sendTransaction({
        amount,
        recipient,
        paymentMethod,
      });

      // Show success and call the onSuccess callback
      setStatus('success');
      onSuccess(result.signature, amount, paymentMethod);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to process payment');
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

    // Default/idle state - payment form
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
              <span>{paymentMethod === 'sol' ? `${selectedTier.priceSol} SOL` : `${selectedTier.priceUsdc} USDC`}</span>
            </div>
          </div>

          <div>
            <div className="mb-2 font-medium">Payment Method</div>
            <RadioGroup 
              defaultValue="sol" 
              value={paymentMethod} 
              onValueChange={(value) => setPaymentMethod(value as 'sol' | 'usdc')}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem 
                  value="sol" 
                  id="sol" 
                  className="peer sr-only" 
                />
                <Label
                  htmlFor="sol"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800/50 hover:text-accent-foreground peer-data-[state=checked]:border-[#E6E2DA] [&:has([data-state=checked])]:border-[#E6E2DA]"
                >
                  <Coins className="mb-3 h-6 w-6 text-[#E6E2DA]" />
                  <div className="text-center">
                    <p className="font-medium">SOL</p>
                    <p className="text-sm text-neutral-400">Solana</p>
                  </div>
                </Label>
              </div>

              <div>
                <RadioGroupItem 
                  value="usdc" 
                  id="usdc" 
                  className="peer sr-only" 
                />
                <Label
                  htmlFor="usdc"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800/50 hover:text-accent-foreground peer-data-[state=checked]:border-[#E6E2DA] [&:has([data-state=checked])]:border-[#E6E2DA]"
                >
                  <CreditCard className="mb-3 h-6 w-6 text-[#27a0f2]" />
                  <div className="text-center">
                    <p className="font-medium">USDC</p>
                    <p className="text-sm text-neutral-400">USD Coin</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/20 p-3 text-red-500 text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-neutral-700 text-white hover:bg-neutral-800 hover:text-white"
            disabled={isPending || status === 'processing'}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isPending || status === 'processing'}
            className="bg-[#E6E2DA] hover:bg-[#D6D2CA] text-black"
          >
            {isPending || status === ('processing' as PaymentStatus) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${paymentMethod === 'sol' ? selectedTier.priceSol + ' SOL' : selectedTier.priceUsdc + ' USDC'}`
            )}
          </Button>
        </DialogFooter>
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