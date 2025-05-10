import React, { createContext, useState, useContext, useCallback, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

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
          const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
          
          // Create transaction
          const transaction = new Transaction();
          
          // Parse amount to lamports (SOL's smallest unit)
          const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
          
          // Add transfer instruction
          transaction.add(
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
        throw new Error(error instanceof Error ? error.message : 'Failed to send transaction');
      }
    },
    [wallet]
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