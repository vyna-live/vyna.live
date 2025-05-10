import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import TransactionProcessor from './TransactionProcessor';
import { type SubscriptionTier } from '@/services/subscriptionService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscriptionTier: SubscriptionTier | null;
}

export default function PaymentModal({ 
  isOpen, 
  onClose,
  onSuccess,
  subscriptionTier
}: PaymentModalProps) {
  const { publicKey } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<Error | null>(null);

  // Handle payment initiation
  const handleInitiatePayment = () => {
    setIsProcessing(true);
    setPaymentError(null);
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    setIsProcessing(false);
    onSuccess();
  };

  // Handle payment error
  const handlePaymentError = (error: Error) => {
    setPaymentError(error);
    setIsProcessing(false);
  };

  // Handle payment cancellation
  const handlePaymentCancel = () => {
    setIsProcessing(false);
  };

  if (!subscriptionTier) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0c0c0c] border-[#cdbcab]/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Complete Your Subscription</DialogTitle>
          <DialogDescription className="text-gray-400">
            You're subscribing to the {subscriptionTier.name} plan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col py-4">
          {isProcessing ? (
            <TransactionProcessor
              amount={subscriptionTier.priceSol}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          ) : (
            <>
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-[#1f1f1f] rounded-full flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-[#A67D44]" />
                </div>
              </div>
              
              <div className="mb-6 space-y-4">
                <div className="bg-[#121212] p-4 rounded-md">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-400">Subscription</span>
                    <span>{subscriptionTier.name} Plan</span>
                  </div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-400">Duration</span>
                    <span>1 Month</span>
                  </div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-400">Wallet</span>
                    <span className="truncate max-w-[180px]">{publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-4)}</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-[#333] flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <div className="text-right">
                      <div className="font-bold text-lg">{subscriptionTier.priceSol} SOL</div>
                      <div className="text-xs text-gray-400">≈ ${subscriptionTier.priceUsdc} USD</div>
                    </div>
                  </div>
                </div>
                
                {paymentError && (
                  <div className="p-3 bg-red-950/20 border border-red-800/30 rounded-md text-sm text-red-400">
                    <p className="font-medium">Payment failed</p>
                    <p>{paymentError.message}</p>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleInitiatePayment}
                className="w-full bg-[#A67D44] hover:bg-[#8A6836] text-black"
              >
                Confirm Payment
              </Button>
              
              <div className="mt-4 text-xs text-gray-500 text-center">
                By confirming, you agree to make a payment of {subscriptionTier.priceSol} SOL from your connected wallet.
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}