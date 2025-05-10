import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletProvider';
import { SubscriptionTier } from '@/services/subscriptionService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier?: SubscriptionTier;
  onSuccess: (
    signature: string,
    amount: string,
    paymentMethod: 'sol' | 'usdc'
  ) => void;
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
      if (status !== 'processing') {
        onClose();
        // Reset state when modal closes
        setStatus('idle');
        setError(null);
      }
    }
  };

  const handlePayment = async () => {
    if (!wallet || !selectedTier) return;

    const amount = paymentMethod === 'sol' 
      ? selectedTier.priceSol 
      : selectedTier.priceUsdc;
    
    // Mock recipient address - in a real implementation this would be your app's payment address
    const recipient = 'VynaPaymentAddress123456789';
    
    setStatus('processing');
    setError(null);
    
    try {
      const result = await sendTransaction(amount, recipient, paymentMethod);
      
      if (result.success && result.signature) {
        setStatus('success');
        // Call the onSuccess callback with the transaction signature
        onSuccess(result.signature, amount.toString(), paymentMethod);
      } else {
        setStatus('error');
        setError(result.error || 'Transaction failed. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setStatus('error');
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during payment.'
      );
    }
  };

  if (!selectedTier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Subscribe to {selectedTier.name}
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            {selectedTier.headline}
          </DialogDescription>
        </DialogHeader>

        {status === 'idle' && (
          <>
            <div className="py-4 space-y-6">
              <div className="bg-black rounded-lg p-4 border border-neutral-800">
                <h3 className="font-semibold mb-2">Subscription Details</h3>
                <p className="text-sm text-neutral-400 mb-2">{selectedTier.description}</p>
                
                <div className="mt-3 pt-3 border-t border-neutral-800">
                  <h4 className="text-sm font-medium mb-2">Includes:</h4>
                  <ul className="space-y-1 text-sm text-neutral-400">
                    {selectedTier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Tabs defaultValue="sol" className="w-full" onValueChange={(v) => setPaymentMethod(v as 'sol' | 'usdc')}>
                <TabsList className="grid w-full grid-cols-2 bg-neutral-800">
                  <TabsTrigger value="sol">Pay with SOL</TabsTrigger>
                  <TabsTrigger value="usdc">Pay with USDC</TabsTrigger>
                </TabsList>
                <TabsContent value="sol" className="mt-4">
                  <div className="p-4 rounded-lg border border-neutral-800 text-center">
                    <div className="mb-2 text-sm text-neutral-400">Price</div>
                    <div className="text-2xl font-bold">{selectedTier.priceSol} SOL</div>
                    {wallet && (
                      <div className="mt-2 text-xs text-neutral-500">
                        Your balance: {wallet.balance.toFixed(4)} SOL
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="usdc" className="mt-4">
                  <div className="p-4 rounded-lg border border-neutral-800 text-center">
                    <div className="mb-2 text-sm text-neutral-400">Price</div>
                    <div className="text-2xl font-bold">{selectedTier.priceUsdc} USDC</div>
                    {wallet && (
                      <div className="mt-2 text-xs text-neutral-500">
                        USDC balance not available in mock wallet
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-md p-3 text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-neutral-700 text-white hover:bg-neutral-800 hover:text-white"
                disabled={status === 'processing'}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={status === 'processing' || !wallet || isPending}
                className="bg-[#E6E2DA] hover:bg-[#D6D2CA] text-black"
              >
                {isPending || status === 'processing' ? (
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
        )}

        {status === 'processing' && (
          <div className="py-8 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium">Processing Payment</h3>
            <p className="text-neutral-400 text-center mt-2">
              Please wait while we process your transaction...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8 flex flex-col items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium">Payment Successful!</h3>
            <p className="text-neutral-400 text-center mt-2">
              Your subscription to {selectedTier.name} has been activated.
            </p>
            <Button
              onClick={onClose}
              className="mt-6 bg-[#E6E2DA] hover:bg-[#D6D2CA] text-black"
            >
              Done
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8 flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium">Payment Failed</h3>
            <p className="text-red-400 text-center mt-2">
              {error || 'There was an error processing your payment.'}
            </p>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-neutral-700 text-white hover:bg-neutral-800 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setStatus('idle');
                  setError(null);
                }}
                className="bg-[#E6E2DA] hover:bg-[#D6D2CA] text-black"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}