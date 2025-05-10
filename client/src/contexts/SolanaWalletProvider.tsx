import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

// Wallet interface
export interface Wallet {
  address: string;
  balance: number;
  isConnected: boolean;
}

// Wallet context type
interface WalletContextType {
  wallet: Wallet | null;
  isConnecting: boolean;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  sendTransaction: (amount: number, recipient: string, currency: 'sol' | 'usdc') => Promise<{
    success: boolean;
    signature?: string;
    error?: string;
  }>;
}

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Custom hook to use the wallet context
export function useSolanaWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useSolanaWallet must be used within a SolanaWalletProvider');
  }
  return context;
}

// Props type for provider component
interface SolanaWalletProviderProps {
  children: ReactNode;
}

// Provider component
export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  // State for wallet
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for existing wallet connection on mount
  useEffect(() => {
    const storedWallet = localStorage.getItem('solanaWallet');
    if (storedWallet) {
      try {
        const parsedWallet = JSON.parse(storedWallet);
        setWallet(parsedWallet);
      } catch (error) {
        console.error('Failed to parse stored wallet:', error);
        localStorage.removeItem('solanaWallet');
      }
    }
  }, []);

  // Connect wallet function
  const connectWallet = async (): Promise<boolean> => {
    try {
      setIsConnecting(true);
      
      // In a real implementation, this would use the Solana wallet adapter
      // For now, we'll mock the connection with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock wallet data for development
      const mockWallet = {
        address: 'Fak3Addr355' + Math.floor(Math.random() * 10000),
        balance: Math.random() * 10,
        isConnected: true
      };
      
      setWallet(mockWallet);
      localStorage.setItem('solanaWallet', JSON.stringify(mockWallet));
      
      toast({
        title: 'Wallet connected',
        description: `Connected to ${mockWallet.address.slice(0, 6)}...${mockWallet.address.slice(-4)}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Connection failed',
        description: 'Could not connect to wallet. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setWallet(null);
    localStorage.removeItem('solanaWallet');
    toast({
      title: 'Wallet disconnected',
      description: 'Your wallet has been disconnected.',
    });
  };

  // Send transaction function
  const sendTransaction = async (
    amount: number,
    recipient: string,
    currency: 'sol' | 'usdc'
  ): Promise<{ success: boolean; signature?: string; error?: string }> => {
    if (!wallet || !wallet.isConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      // In a real implementation, this would use the Solana web3.js library
      // For now, we'll mock the transaction with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock a transaction signature
      const signature = 'txsig_' + Math.random().toString(36).substring(2, 15);
      
      // Update wallet balance
      if (wallet.balance >= amount) {
        setWallet(prev => prev ? {
          ...prev,
          balance: prev.balance - amount
        } : null);

        // Update localStorage
        if (wallet) {
          localStorage.setItem('solanaWallet', JSON.stringify({
            ...wallet,
            balance: wallet.balance - amount
          }));
        }
        
        toast({
          title: 'Transaction successful',
          description: `Sent ${amount} ${currency.toUpperCase()} to ${recipient.slice(0, 6)}...`,
        });
        
        return { success: true, signature };
      } else {
        return { success: false, error: 'Insufficient funds' };
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  };

  // Context value
  const value = {
    wallet,
    isConnecting,
    connectWallet,
    disconnectWallet,
    sendTransaction
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}