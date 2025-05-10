import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Simplified wallet types
type WalletProvider = 'phantom' | 'solflare' | 'slope' | 'sollet' | 'ledger' | 'other';

interface WalletInfo {
  address: string;
  provider: WalletProvider;
  connectedAt: Date;
}

interface WalletContextType {
  wallet: WalletInfo | null;
  connecting: boolean;
  connected: boolean;
  connectWallet: (provider: WalletProvider) => Promise<boolean>;
  disconnectWallet: () => void;
  simulateTransaction: (amount: number, currency: 'sol' | 'usdc') => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a SolanaWalletProvider');
  }
  return context;
};

interface SolanaWalletProviderProps {
  children: ReactNode;
}

const SolanaWalletProvider: React.FC<SolanaWalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  // Load wallet from localStorage on mount if available
  useEffect(() => {
    const savedWallet = localStorage.getItem('wallet');
    if (savedWallet) {
      try {
        const parsedWallet = JSON.parse(savedWallet) as WalletInfo;
        setWallet(parsedWallet);
      } catch (error) {
        console.error('Failed to parse wallet from localStorage', error);
        localStorage.removeItem('wallet');
      }
    }
  }, []);

  // For development purposes, simulate wallet connection
  const connectWallet = async (provider: WalletProvider): Promise<boolean> => {
    try {
      setConnecting(true);
      
      // In a real implementation, we would:
      // 1. Check if the wallet extension is installed
      // 2. Request connection to the wallet
      // 3. Get the wallet public key
      
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful connection
      const mockAddress = `vyna${Math.random().toString(36).substring(2, 10)}`;
      const walletInfo: WalletInfo = {
        address: mockAddress,
        provider,
        connectedAt: new Date(),
      };
      
      // Save wallet info to localStorage
      localStorage.setItem('wallet', JSON.stringify(walletInfo));
      setWallet(walletInfo);
      
      toast({
        title: "Wallet connected!",
        description: `Connected to ${provider} wallet`,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to connect wallet', error);
      toast({
        title: "Connection failed",
        description: "Could not connect to wallet. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    localStorage.removeItem('wallet');
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  // Simulate a blockchain transaction
  const simulateTransaction = async (amount: number, currency: 'sol' | 'usdc'): Promise<string> => {
    // In a real implementation, we would:
    // 1. Create a transaction with the appropriate instructions
    // 2. Request the user to sign the transaction
    // 3. Send the transaction to the network
    // 4. Return the transaction signature
    
    // Simulate transaction process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a mock transaction signature
    const mockSignature = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    return mockSignature;
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connecting,
        connected: !!wallet,
        connectWallet,
        disconnectWallet,
        simulateTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default SolanaWalletProvider;