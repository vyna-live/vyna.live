import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Loader2, CheckCircle2, XCircle, ArrowLeftCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { createSubscriptionTransaction, confirmTransaction, activateSubscription } from '@/services/subscriptionService';

interface TransactionProcessorProps {
  amount: number; // Amount in USDC
  onSuccess: () => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

type TransactionStatus = 'initial' | 'processing' | 'confirming' | 'success' | 'error';

export default function TransactionProcessor({
  amount,
  onSuccess,
  onError,
  onCancel
}: TransactionProcessorProps) {
  const { publicKey, signTransaction } = useWallet();
  const [status, setStatus] = useState<TransactionStatus>('initial');
  const [progress, setProgress] = useState(0);
  const [signature, setSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Function to handle the payment process
  const processPayment = async () => {
    if (!publicKey || !signTransaction) {
      onError(new Error('Wallet not connected or unable to sign transactions'));
      return;
    }

    try {
      // Update status and start progress
      setStatus('processing');
      setProgress(10);

      // Create a transaction
      const transaction = await createSubscriptionTransaction(publicKey, amount);
      
      // Update progress
      setProgress(30);
      
      // Sign the transaction
      const signedTransaction = await signTransaction(transaction);
      
      // Update progress
      setProgress(50);
      
      // Get the transaction signature and confirm it
      const connection = transaction.recentBlockhash ? 
        transaction.feePayer?.equals(publicKey) : false;
      
      if (!connection) {
        throw new Error('Transaction connection error');
      }
      
      // Send the transaction
      const txSignature = await window.solana.sendTransaction(signedTransaction);
      setSignature(txSignature);
      
      // Update status and progress
      setStatus('confirming');
      setProgress(70);
      
      // Confirm the transaction
      const confirmed = await confirmTransaction(txSignature);
      
      if (!confirmed) {
        throw new Error('Transaction failed to confirm');
      }
      
      // Update progress
      setProgress(90);
      
      // Activate the subscription
      const activated = await activateSubscription(
        1, // TODO: Get actual user ID
        'pro', // Default to Pro tier
        txSignature
      );
      
      if (!activated) {
        throw new Error('Failed to activate subscription');
      }
      
      // Update status and progress
      setStatus('success');
      setProgress(100);
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
    } catch (error) {
      console.error('Payment error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      onError(error instanceof Error ? error : new Error('Payment processing failed'));
    }
  };

  // Start the payment process automatically
  useEffect(() => {
    processPayment();
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 text-center">
        {status === 'initial' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 text-[#A67D44] animate-spin mb-4" />
            <h3 className="text-lg font-medium mb-1">Preparing Transaction</h3>
            <p className="text-sm text-gray-400">Please wait while we prepare your transaction...</p>
          </>
        )}
        
        {status === 'processing' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 text-[#A67D44] animate-spin mb-4" />
            <h3 className="text-lg font-medium mb-1">Processing Payment</h3>
            <p className="text-sm text-gray-400">Please confirm the transaction in your wallet</p>
          </>
        )}
        
        {status === 'confirming' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 text-[#A67D44] animate-spin mb-4" />
            <h3 className="text-lg font-medium mb-1">Confirming Transaction</h3>
            <p className="text-sm text-gray-400">This may take a few moments to complete</p>
            {signature && (
              <p className="text-xs text-gray-500 mt-2 break-all">
                Transaction ID: {signature}
              </p>
            )}
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-1">Payment Successful!</h3>
            <p className="text-sm text-gray-400">Your subscription has been activated</p>
            {signature && (
              <p className="text-xs text-gray-500 mt-2 break-all">
                Transaction ID: {signature}
              </p>
            )}
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-1">Payment Failed</h3>
            <p className="text-sm text-red-400">{errorMessage || 'An error occurred during the payment process'}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={onCancel}
            >
              <ArrowLeftCircle className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </>
        )}
      </div>
      
      {(status === 'initial' || status === 'processing' || status === 'confirming') && (
        <div className="w-full">
          <Progress value={progress} className="h-2 bg-[#222]" />
          <p className="mt-2 text-xs text-gray-400 text-center">{progress}% complete</p>
        </div>
      )}
    </div>
  );
}