import React, { useState } from 'react';
import { useWallet } from '@/contexts/SolanaWalletProvider';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Check, 
  X, 
  CreditCard, 
  ArrowRight, 
  Wallet, 
  RefreshCcw 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Subscription tier interface
interface SubscriptionTier {
  id: string;
  name: string;
  headline: string;
  description: string;
  priceSol: number;
  priceUsdc: number;
  features: string[];
  mostPopular?: boolean;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscriptionTier: SubscriptionTier | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subscriptionTier
}) => {
  const { wallet, simulateTransaction } = useWallet();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'sol' | 'usdc'>('sol');
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success' | 'error'>('details');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  
  if (!subscriptionTier) {
    return null;
  }

  const price = paymentMethod === 'sol' ? subscriptionTier.priceSol : subscriptionTier.priceUsdc;
  const walletAddress = wallet?.address || 'Not connected';
  const displayAddress = wallet ? 
    `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}` : 
    'Not connected';

  const handlePay = async () => {
    if (!wallet) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setPaymentStep('processing');
      
      // Simulate a transaction with Solana
      const signature = await simulateTransaction(price, paymentMethod);
      setTransactionSignature(signature);
      
      // Call the API to create a subscription
      await apiRequest('POST', '/api/subscription', {
        tierId: subscriptionTier.id,
        paymentMethod,
        amount: price.toString(),
        transactionSignature: signature,
      });
      
      // Simulate a delay for transaction confirmation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPaymentStep('success');
    } catch (error) {
      console.error('Payment error', error);
      setPaymentStep('error');
      setErrorMessage(error instanceof Error ? error.message : 'Transaction failed');
    }
  };

  const handleTryAgain = () => {
    setPaymentStep('details');
    setErrorMessage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0c0c0c] border-[#cdbcab]/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Complete Your Subscription</DialogTitle>
          <DialogDescription className="text-gray-400">
            {`You're subscribing to the ${subscriptionTier.name} plan.`}
          </DialogDescription>
        </DialogHeader>

        {paymentStep === 'details' && (
          <div className="py-4">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-[#1f1f1f] rounded-full flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-[#A67D44]" />
              </div>
            </div>
            
            <div className="mb-6">
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
                  <span className="truncate max-w-[180px]">{displayAddress}</span>
                </div>
                
                <div className="pt-3 mt-3 border-t border-[#333]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Payment Method</span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        variant={paymentMethod === 'sol' ? 'default' : 'outline'}
                        className={paymentMethod === 'sol' 
                          ? "bg-[#A67D44] hover:bg-[#8A6836] text-black"
                          : "bg-transparent hover:bg-[#1a1a1a] border border-[#333]"
                        }
                        onClick={() => setPaymentMethod('sol')}
                      >
                        SOL
                      </Button>
                      <Button 
                        size="sm"
                        variant={paymentMethod === 'usdc' ? 'default' : 'outline'}
                        className={paymentMethod === 'usdc' 
                          ? "bg-[#A67D44] hover:bg-[#8A6836] text-black"
                          : "bg-transparent hover:bg-[#1a1a1a] border border-[#333]"
                        }
                        onClick={() => setPaymentMethod('usdc')}
                      >
                        USDC
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {price} {paymentMethod.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-400">
                        ≈ ${paymentMethod === 'sol' ? subscriptionTier.priceUsdc : subscriptionTier.priceUsdc} USD
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handlePay}
              className="w-full bg-[#A67D44] hover:bg-[#8A6836] text-black"
            >
              Confirm Payment
            </Button>
            
            <div className="mt-4 text-xs text-gray-500 text-center">
              By confirming, you agree to make a payment of {price} {paymentMethod.toUpperCase()} from your connected wallet.
            </div>
          </div>
        )}

        {paymentStep === 'processing' && (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="h-12 w-12 animate-spin text-[#A67D44] mb-4" />
            <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
            <p className="text-sm text-gray-400 text-center mb-4">
              Please wait while we process your transaction...
            </p>
            
            <div className="w-full bg-[#222] rounded-full h-2.5 mb-4">
              <div className="bg-[#A67D44] h-2.5 rounded-full" style={{ width: '65%' }}></div>
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              This may take a few moments to complete.
            </div>
          </div>
        )}

        {paymentStep === 'success' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Payment Successful!</h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              Your subscription has been successfully activated.
            </p>
            
            <div className="bg-[#121212] p-3 rounded-md w-full mb-6">
              <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
              <div className="text-sm truncate">{transactionSignature}</div>
            </div>
            
            <Button 
              onClick={onSuccess}
              className="w-full bg-[#A67D44] hover:bg-[#8A6836] text-black"
            >
              Continue
            </Button>
          </div>
        )}

        {paymentStep === 'error' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Payment Failed</h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              {errorMessage || 'There was an error processing your payment.'}
            </p>
            
            <div className="flex gap-3 w-full">
              <Button 
                onClick={onClose}
                className="flex-1 bg-transparent hover:bg-[#1a1a1a] border border-[#333]"
                variant="outline"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleTryAgain}
                className="flex-1 bg-[#A67D44] hover:bg-[#8A6836] text-black"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;