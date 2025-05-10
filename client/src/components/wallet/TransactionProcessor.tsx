import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  TransactionSignature
} from '@solana/web3.js';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

// This would come from your environment variables in a real app
const VYNA_WALLET_ADDRESS = 'YourCompanySolanaWalletAddressHere';

interface TransactionProcessorProps {
  amount: number; // Amount in SOL
  onSuccess: () => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

type TransactionStatus = 'initial' | 'processing' | 'confirming' | 'success' | 'error';

const TransactionProcessor: React.FC<TransactionProcessorProps> = ({
  amount,
  onSuccess,
  onError,
  onCancel
}) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  
  const [status, setStatus] = useState<TransactionStatus>('initial');
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  
  // Estimated gas fees in SOL
  const estimatedFees = 0.000005;
  
  const processPayment = async () => {
    if (!publicKey) {
      setError('Wallet not connected');
      setStatus('error');
      return;
    }
    
    try {
      setStatus('processing');
      
      // Calculate the amount in lamports
      const amountInLamports = amount * LAMPORTS_PER_SOL;
      
      // Create a transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(VYNA_WALLET_ADDRESS),
          lamports: amountInLamports,
        })
      );
      
      // Setting a recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Send the transaction
      const txSignature = await sendTransaction(transaction, connection);
      setSignature(txSignature);
      setStatus('confirming');
      
      // Confirm the transaction
      const confirmation = await connection.confirmTransaction(txSignature);
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }
      
      setStatus('success');
      onSuccess();
      
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStatus('error');
      onError(err instanceof Error ? err : new Error('Unknown error occurred'));
    }
  };
  
  const retryTransaction = () => {
    setStatus('initial');
    setError(null);
    setSignature(null);
  };
  
  return (
    <div className="bg-[#1A1A1A] rounded-xl p-6 w-full max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4 text-white">Complete Your Payment</h3>
      
      <div className="bg-[#222222] rounded-lg p-4 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-[#BBBBBB]">Amount:</span>
          <span className="text-white font-medium">{amount} SOL</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-[#BBBBBB]">Estimated fees:</span>
          <span className="text-[#DDDDDD]">{estimatedFees} SOL</span>
        </div>
        <div className="border-t border-[#333333] my-2 pt-2 flex justify-between">
          <span className="text-[#BBBBBB]">Total:</span>
          <span className="text-white font-semibold">{(amount + estimatedFees).toFixed(6)} SOL</span>
        </div>
      </div>
      
      {status === 'initial' && (
        <div className="space-y-4">
          <button
            onClick={processPayment}
            className="w-full py-3 px-4 bg-[#DCC5A2] text-[#121212] rounded-lg font-medium hover:bg-[#C6B190] transition-colors"
          >
            Pay Now
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 px-4 bg-transparent text-[#DDDDDD] border border-[#333333] rounded-lg font-medium hover:bg-[#222222] transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
      
      {status === 'processing' && (
        <div className="text-center py-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-[#DCC5A2]" />
          <p className="text-[#DDDDDD]">Processing your payment...</p>
          <p className="text-[#999999] text-sm mt-2">Please approve the transaction in your wallet</p>
        </div>
      )}
      
      {status === 'confirming' && (
        <div className="text-center py-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-[#DCC5A2]" />
          <p className="text-[#DDDDDD]">Confirming transaction...</p>
          <p className="text-[#999999] text-sm mt-2">This may take a few moments</p>
          {signature && (
            <div className="mt-4 text-sm bg-[#222222] p-3 rounded overflow-hidden">
              <p className="text-[#999999] mb-1">Transaction ID:</p>
              <p className="text-[#BBBBBB] truncate">{signature}</p>
            </div>
          )}
        </div>
      )}
      
      {status === 'success' && (
        <div className="text-center py-4">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-4 text-green-500" />
          <p className="text-white font-medium">Payment Successful!</p>
          <p className="text-[#BBBBBB] text-sm mt-2">Your Pro subscription has been activated</p>
          {signature && (
            <div className="mt-4 text-sm bg-[#222222] p-3 rounded overflow-hidden">
              <p className="text-[#999999] mb-1">Transaction ID:</p>
              <p className="text-[#BBBBBB] truncate">{signature}</p>
            </div>
          )}
        </div>
      )}
      
      {status === 'error' && (
        <div className="py-4">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <p className="text-white font-medium text-center">Transaction Failed</p>
          <p className="text-[#BBBBBB] text-sm mt-2 text-center">
            {error || 'An error occurred while processing your payment'}
          </p>
          
          <div className="mt-6 space-y-3">
            <button
              onClick={retryTransaction}
              className="w-full py-2.5 px-4 bg-[#333333] text-white rounded-lg font-medium hover:bg-[#444444] transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
            
            <button
              onClick={onCancel}
              className="w-full py-2.5 px-4 bg-transparent text-[#DDDDDD] border border-[#333333] rounded-lg font-medium hover:bg-[#222222] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionProcessor;