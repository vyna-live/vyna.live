import React, { createContext, useState, useContext, useCallback, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

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

      // For development/testing - create a mock wallet connection
      if (process.env.NODE_ENV === 'development') {
        // Using a setTimeout to simulate wallet connection delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockWallet = {
          publicKey: `mock_${Math.random().toString(36).substring(2, 10)}`,
          name: provider === 'phantom' ? 'Phantom' : 'Solflare',
          provider
        };
        
        setWallet(mockWallet);
        localStorage.setItem('solanaWallet', JSON.stringify(mockWallet));
        
        toast({
          title: 'Wallet connected',
          description: `Connected to mock ${mockWallet.name} wallet`,
        });
        
        return true;
      }

      // Actual wallet connection logic would go here
      // This would use the Solana wallet adapter in a real implementation
      if (provider === 'phantom' && hasPhantomWallet()) {
        // Phantom wallet connection
        const response = await window.phantom?.solana.connect();
        const newWallet = {
          publicKey: response.publicKey.toString(),
          name: 'Phantom',
          provider: 'phantom' as const
        };
        setWallet(newWallet);
        localStorage.setItem('solanaWallet', JSON.stringify(newWallet));
        return true;
      } else if (provider === 'solflare' && hasSolflareWallet()) {
        // Solflare wallet connection
        const response = await window.solflare.connect();
        const newWallet = {
          publicKey: response.publicKey.toString(),
          name: 'Solflare',
          provider: 'solflare' as const
        };
        setWallet(newWallet);
        localStorage.setItem('solanaWallet', JSON.stringify(newWallet));
        return true;
      } else {
        toast({
          title: 'Wallet not found',
          description: `${provider === 'phantom' ? 'Phantom' : 'Solflare'} wallet extension is not installed`,
          variant: 'destructive',
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
  const disconnectWallet = useCallback(() => {
    // In real implementation, we would also call the disconnect method on the wallet
    setWallet(null);
    localStorage.removeItem('solanaWallet');
    toast({
      title: 'Wallet disconnected',
      description: 'Your wallet has been disconnected',
    });
  }, [toast]);

  // Send transaction
  const sendTransaction = useCallback(
    async ({ amount, recipient, paymentMethod }: { amount: string; recipient: string; paymentMethod: 'sol' | 'usdc' }) => {
      if (!wallet) {
        throw new Error('Wallet not connected');
      }

      try {
        // For development/testing - simulate transaction process
        if (process.env.NODE_ENV === 'development') {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Return mock transaction signature
          return {
            signature: `mock_tx_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
          };
        }

        // Actual transaction logic would go here depending on the wallet provider
        // This would use the Solana web3.js library in a real implementation
        throw new Error('Real transaction sending not implemented');
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

// Add mock types for wallet extensions to avoid TypeScript errors
declare global {
  interface Window {
    phantom?: {
      solana: {
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
      };
    };
    solflare?: {
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
    };
  }
}