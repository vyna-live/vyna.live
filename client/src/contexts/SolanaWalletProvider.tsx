import React, { createContext, useState, useContext, useCallback, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';

// Create a special type for TransactionInstruction that can work with Uint8Array
// This helps us bypass TypeScript error with Buffer/Uint8Array when code runs in browser
interface CustomTransactionInstruction {
  keys: Array<any>;
  programId: PublicKey;
  data: Uint8Array;
}

// For adding a memo to each transaction to prevent duplicate processing
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// Define wallet object interface
interface Wallet {
  publicKey: string;
  name: string;
  provider: 'phantom' | 'solflare' | 'other';
}

// Define context interface
interface SolanaWalletContextType {
  wallet: Wallet | null;
  isConnecting: boolean;
  connectWallet: (provider?: 'phantom' | 'solflare') => Promise<boolean>;
  disconnectWallet: () => void;
  sendTransaction: (
    transaction: { amount: string; recipient: string; paymentMethod: 'sol' | 'usdc' }
  ) => Promise<{ signature: string }>;
}

// Create context with default values
export const SolanaWalletContext = createContext<SolanaWalletContextType>({
  wallet: null,
  isConnecting: false,
  connectWallet: async () => false,
  disconnectWallet: () => {},
  sendTransaction: async () => ({ signature: '' }),
});

// Custom hook for accessing wallet context
export const useSolanaWallet = () => useContext(SolanaWalletContext);

// Provider component
export const SolanaWalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Load saved wallet on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('solanaWallet');
    if (savedWallet) {
      try {
        setWallet(JSON.parse(savedWallet));
      } catch (error) {
        console.error('Failed to load saved wallet', error);
        localStorage.removeItem('solanaWallet');
      }
    }
  }, []);

  // Check if the browser has a Solana wallet extension
  const hasPhantomWallet = useCallback(() => {
    return typeof window !== 'undefined' && 'phantom' in window;
  }, []);

  const hasSolflareWallet = useCallback(() => {
    return typeof window !== 'undefined' && 'solflare' in window;
  }, []);

  // Connect to wallet
  const connectWallet = useCallback(async (provider: 'phantom' | 'solflare' = 'phantom'): Promise<boolean> => {
    try {
      setIsConnecting(true);
      
      if (provider === 'phantom' && hasPhantomWallet()) {
        try {
          const response = await window.phantom?.solana.connect();
          const publicKey = response?.publicKey.toString();
          
          if (!publicKey) {
            throw new Error('Failed to connect to Phantom wallet');
          }
          
          const connectedWallet = {
            publicKey,
            name: 'Phantom',
            provider: 'phantom' as const
          };
          
          setWallet(connectedWallet);
          localStorage.setItem('solanaWallet', JSON.stringify(connectedWallet));
          
          toast({
            title: 'Wallet connected',
            description: 'Successfully connected to Phantom wallet',
          });
          
          return true;
        } catch (error) {
          console.error('Phantom wallet connection error:', error);
          toast({
            title: 'Connection Failed',
            description: 'Failed to connect to Phantom wallet',
            variant: 'destructive'
          });
          return false;
        }
      } else if (provider === 'solflare' && hasSolflareWallet()) {
        try {
          const response = await window.solflare?.connect();
          const publicKey = response?.publicKey.toString();
          
          if (!publicKey) {
            throw new Error('Failed to connect to Solflare wallet');
          }
          
          const connectedWallet = {
            publicKey,
            name: 'Solflare',
            provider: 'solflare' as const
          };
          
          setWallet(connectedWallet);
          localStorage.setItem('solanaWallet', JSON.stringify(connectedWallet));
          
          toast({
            title: 'Wallet connected',
            description: 'Successfully connected to Solflare wallet',
          });
          
          return true;
        } catch (error) {
          console.error('Solflare wallet connection error:', error);
          toast({
            title: 'Connection Failed',
            description: 'Failed to connect to Solflare wallet',
            variant: 'destructive'
          });
          return false;
        }
      } else {
        toast({
          title: 'Wallet not found',
          description: `${provider === 'phantom' ? 'Phantom' : 'Solflare'} wallet extension not detected. Please install it first.`,
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Connection error',
        description: 'Failed to connect to wallet. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [hasPhantomWallet, hasSolflareWallet, toast]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      if (wallet?.provider === 'phantom' && window.phantom?.solana) {
        await window.phantom.solana.disconnect();
      } else if (wallet?.provider === 'solflare' && window.solflare) {
        await window.solflare.disconnect();
      }
      
      setWallet(null);
      localStorage.removeItem('solanaWallet');
      
      toast({
        title: 'Wallet disconnected',
        description: 'Your wallet has been disconnected',
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast({
        title: 'Disconnect error',
        description: 'Failed to disconnect wallet properly. Please try again.',
        variant: 'destructive',
      });
    }
  }, [wallet, toast]);

  // Send transaction
  const sendTransaction = useCallback(
    async ({ amount, recipient, paymentMethod }: { amount: string; recipient: string; paymentMethod: 'sol' | 'usdc' }) => {
      if (!wallet) {
        throw new Error('Wallet not connected');
      }

      try {
        // Only handle SOL transfers for now
        if (paymentMethod === 'sol') {
          // Set up connection to Solana devnet
          const connection = new Connection('https://api.testnet.solana.com', 'confirmed');
          
          // Create transaction
          const transaction = new Transaction();
          
          // Generate a unique transaction ID to prevent duplicates
          const uniqueId = Date.now().toString() + Math.random().toString().substring(2, 8);
          
          // Add a memo instruction with the unique ID to prevent duplicate transactions
          // Generate a simplified string message for the memo - no need for TextEncoder
          const memoMessage = `Vyna.live payment: ${uniqueId}`;
          
          // Create memo instruction with the message - directly creating Uint8Array from string chars
          const data = new Uint8Array(memoMessage.length);
          for (let i = 0; i < memoMessage.length; i++) {
            data[i] = memoMessage.charCodeAt(i);
          }
          
          // Create the instruction parameters with our custom interface
          const instructionParams: CustomTransactionInstruction = {
            keys: [],
            programId: MEMO_PROGRAM_ID,
            data: data
          };
          
          // Create the instruction using the parameters
          const memoInstruction = new TransactionInstruction(instructionParams);
          
          // Parse amount to lamports (SOL's smallest unit)
          const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
          
          // Add transfer instruction
          transaction.add(
            // Add memo first to ensure unique transaction
            memoInstruction,
            // Then add the actual transfer
            SystemProgram.transfer({
              fromPubkey: new PublicKey(wallet.publicKey),
              toPubkey: new PublicKey(recipient),
              lamports
            })
          );
          
          // Sign and send transaction based on wallet provider
          let signature = '';
          
          if (wallet.provider === 'phantom' && window.phantom?.solana) {
            // Get recent blockhash
            const blockhash = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash.blockhash;
            transaction.feePayer = new PublicKey(wallet.publicKey);
            
            // Send the transaction to the network
            try {
              // Sign the transaction with Phantom
              const signedTransaction = await window.phantom.solana.signTransaction?.(transaction);
              
              if (!signedTransaction) {
                throw new Error('Failed to sign transaction with Phantom wallet');
              }
              
              // Send the signed transaction
              const txSignature = await connection.sendRawTransaction(signedTransaction.serialize());
              signature = txSignature;
              
              // Wait for confirmation
              await connection.confirmTransaction({
                blockhash: blockhash.blockhash,
                lastValidBlockHeight: blockhash.lastValidBlockHeight,
                signature: txSignature
              });
              
              console.log('Transaction confirmed:', txSignature);
            } catch (error) {
              console.error('Transaction error:', error);
              
              // Check if the error is about a transaction already being processed
              const errorMessage = String(error).toLowerCase();
              if (errorMessage.includes('already been processed')) {
                // If the transaction was already processed, we can consider it a success
                toast({
                  title: 'Transaction Note',
                  description: 'This transaction appears to have already been processed successfully.',
                  variant: 'default',
                });
                
                // Return the most recent signature if available, or a placeholder
                return { signature: signature || 'ALREADY_PROCESSED' };
              }
              
              throw new Error('Transaction failed: ' + (error instanceof Error ? error.message : String(error)));
            }
          } else if (wallet.provider === 'solflare' && window.solflare) {
            // Get recent blockhash
            const blockhash = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash.blockhash;
            transaction.feePayer = new PublicKey(wallet.publicKey);
            
            // Send the transaction to the network
            try {
              // Sign the transaction with Solflare
              const signedTransaction = await window.solflare.signTransaction?.(transaction);
              
              if (!signedTransaction) {
                throw new Error('Failed to sign transaction with Solflare wallet');
              }
              
              // Send the signed transaction
              const txSignature = await connection.sendRawTransaction(signedTransaction.serialize());
              signature = txSignature;
              
              // Wait for confirmation
              await connection.confirmTransaction({
                blockhash: blockhash.blockhash,
                lastValidBlockHeight: blockhash.lastValidBlockHeight,
                signature: txSignature
              });
              
              console.log('Transaction confirmed:', txSignature);
            } catch (error) {
              console.error('Transaction error:', error);
              
              // Check if the error is about a transaction already being processed
              const errorMessage = String(error).toLowerCase();
              if (errorMessage.includes('already been processed')) {
                // If the transaction was already processed, we can consider it a success
                toast({
                  title: 'Transaction Note',
                  description: 'This transaction appears to have already been processed successfully.',
                  variant: 'default',
                });
                
                // Return the most recent signature if available, or a placeholder
                return { signature: signature || 'ALREADY_PROCESSED' };
              }
              
              throw new Error('Transaction failed: ' + (error instanceof Error ? error.message : String(error)));
            }
          } else {
            throw new Error('Unsupported wallet provider');
          }
          
          return { signature };
        } else {
          throw new Error('Only SOL payments are supported at this time');
        }
      } catch (error) {
        console.error('Error sending transaction:', error);
        
        // Check for already processed transactions at the global level as well
        const errorMessage = String(error).toLowerCase();
        if (errorMessage.includes('already been processed')) {
          toast({
            title: 'Transaction Note',
            description: 'This transaction appears to have already been processed successfully.',
            variant: 'default',
          });
          
          return { signature: 'ALREADY_PROCESSED' };
        }
        
        // More user-friendly error messages based on error type
        if (errorMessage.includes('insufficient funds')) {
          throw new Error('Insufficient funds in your wallet for this transaction');
        } else if (errorMessage.includes('rejected')) {
          throw new Error('Transaction was rejected. Please try again');
        } else if (errorMessage.includes('timeout')) {
          throw new Error('Transaction timed out. The network may be congested');
        } else {
          throw new Error(error instanceof Error ? error.message : 'Failed to send transaction');
        }
      }
    },
    [wallet, toast]
  );

  // Context value
  const value = {
    wallet,
    isConnecting,
    connectWallet,
    disconnectWallet,
    sendTransaction,
  };

  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
};

// Add types for wallet extensions to avoid TypeScript errors
declare global {
  interface Window {
    phantom?: {
      solana: {
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
        signTransaction?: (transaction: Transaction) => Promise<Transaction>;
        signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
      };
    };
    solflare?: {
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      signTransaction?: (transaction: Transaction) => Promise<Transaction>;
      signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
    };
  }
}