import React, { useState } from 'react';
import { X, CreditCard, Coins } from 'lucide-react';
import TransactionProcessor from './TransactionProcessor';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscriptionTier: {
    id: string;
    name: string;
    priceSol: number;
    priceUsdc: number;
  } | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subscriptionTier
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'sol' | 'usdc'>('sol');
  const [showProcessor, setShowProcessor] = useState(false);
  
  if (!isOpen || !subscriptionTier) return null;
  
  const handleStartPayment = () => {
    setShowProcessor(true);
  };
  
  const handlePaymentSuccess = () => {
    onSuccess();
  };
  
  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error);
    setShowProcessor(false);
  };
  
  const handlePaymentCancel = () => {
    setShowProcessor(false);
  };
  
  const price = paymentMethod === 'sol' ? subscriptionTier.priceSol : subscriptionTier.priceUsdc;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div className="bg-[#1A1A1A] rounded-xl shadow-xl w-full max-w-md mx-4 z-10 overflow-hidden animate-scaleIn">
        <div className="p-5 border-b border-[#333333] flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">
            {showProcessor ? 'Complete Payment' : 'Payment Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#999999] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {!showProcessor ? (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-md font-medium text-white mb-2">
                {subscriptionTier.name} Subscription
              </h3>
              <p className="text-[#BBBBBB] text-sm">
                You're about to subscribe to the {subscriptionTier.name} plan with premium features.
              </p>
            </div>
            
            <div className="bg-[#222222] rounded-lg p-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-[#BBBBBB] mb-2">Select payment method:</p>
                <div className="inline-flex rounded-md p-1 bg-[#333333]">
                  <button
                    onClick={() => setPaymentMethod('sol')}
                    className={`
                      px-4 py-1.5 rounded text-sm font-medium flex items-center
                      ${paymentMethod === 'sol' 
                        ? 'bg-[#DCC5A2] text-[#121212]' 
                        : 'text-[#BBBBBB]'}
                    `}
                  >
                    <Coins className="h-4 w-4 mr-1.5" />
                    SOL
                  </button>
                  <button
                    onClick={() => setPaymentMethod('usdc')}
                    className={`
                      px-4 py-1.5 rounded text-sm font-medium flex items-center
                      ${paymentMethod === 'usdc' 
                        ? 'bg-[#DCC5A2] text-[#121212]' 
                        : 'text-[#BBBBBB]'}
                    `}
                  >
                    <CreditCard className="h-4 w-4 mr-1.5" />
                    USDC
                  </button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-[#333333]">
                <div className="flex justify-between mb-2">
                  <span className="text-[#BBBBBB]">{subscriptionTier.name} (monthly):</span>
                  <span className="text-white font-medium">
                    {price} {paymentMethod.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-[#BBBBBB]">Network fee (estimated):</span>
                  <span className="text-[#DDDDDD]">
                    {paymentMethod === 'sol' ? '~0.000005 SOL' : '~0.01 USDC'}
                  </span>
                </div>
                <div className="border-t border-[#333333] my-2 pt-2 flex justify-between">
                  <span className="text-[#BBBBBB]">Total:</span>
                  <span className="text-white font-semibold">
                    {paymentMethod === 'sol' 
                      ? `${(price + 0.000005).toFixed(6)} SOL` 
                      : `${(price + 0.01).toFixed(2)} USDC`}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleStartPayment}
                className="w-full py-3 px-4 bg-[#DCC5A2] text-[#121212] rounded-lg font-medium hover:bg-[#C6B190] transition-colors"
              >
                Proceed to Payment
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-transparent text-[#DDDDDD] border border-[#333333] rounded-lg font-medium hover:bg-[#222222] transition-colors"
              >
                Cancel
              </button>
            </div>
            
            <div className="mt-4 text-center text-[#999999] text-xs">
              By proceeding, you agree to our Terms of Service and Subscription Policy.
            </div>
          </div>
        ) : (
          <div className="p-6">
            <TransactionProcessor
              amount={paymentMethod === 'sol' ? subscriptionTier.priceSol : subscriptionTier.priceUsdc}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;