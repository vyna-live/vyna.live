import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, Transaction, clusterApiUrl } from '@solana/web3.js';

// Define wallet status enum
export enum WalletStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

// Define the shape of a simplified phantom wallet provider
interface PhantomWalletProvider {
  isPhantom?: boolean;
  publicKey?: { toString: () => string };
  isConnected?: boolean;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  connect?: () => Promise<{ publicKey: PublicKey }>;
  disconnect?: () => Promise<void>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
}

// Get phantom wallet from window object
const getPhantomWallet = (): PhantomWalletProvider | null => {
  if (typeof window !== 'undefined') {
    const provider = (window as any).solana;
    if (provider?.isPhantom) {
      return provider;
    }
  }
  return null;
};

// Interface for the hook return value
interface SolanaWalletHook {
  wallet: PhantomWalletProvider | null;
  walletAddress: string | null;
  status: WalletStatus;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  hasWallet: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  connection: Connection;
}

// Helper function to format a wallet address for display
export const formatWalletAddress = (address: string | null): string => {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

// The hook for Solana wallet interaction
export const useSolanaWallet = (): SolanaWalletHook => {
  const [wallet, setWallet] = useState<PhantomWalletProvider | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<WalletStatus>(WalletStatus.DISCONNECTED);
  
  // Create a connection to Solana devnet
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  // Check if wallet exists on mount
  useEffect(() => {
    const phantomWallet = getPhantomWallet();
    setWallet(phantomWallet);
    
    // If wallet exists and is already connected, set status
    if (phantomWallet?.isConnected && phantomWallet?.publicKey) {
      setWalletAddress(phantomWallet.publicKey.toString());
      setStatus(WalletStatus.CONNECTED);
    }

    // Setup wallet change listener
    const onWalletChange = () => {
      const phantomWallet = getPhantomWallet();
      setWallet(phantomWallet);
      
      if (phantomWallet?.isConnected && phantomWallet?.publicKey) {
        setWalletAddress(phantomWallet.publicKey.toString());
        setStatus(WalletStatus.CONNECTED);
      } else {
        setWalletAddress(null);
        setStatus(WalletStatus.DISCONNECTED);
      }
    };
    
    // Add event listeners
    if (phantomWallet?.on) {
      phantomWallet.on('connect', onWalletChange);
      phantomWallet.on('disconnect', onWalletChange);
      phantomWallet.on('accountChanged', onWalletChange);
    }
    
    return () => {
      // Remove event listeners on cleanup
      if (phantomWallet?.removeListener) {
        phantomWallet.removeListener('connect', onWalletChange);
        phantomWallet.removeListener('disconnect', onWalletChange);
        phantomWallet.removeListener('accountChanged', onWalletChange);
      }
    };
  }, []);

  // Connect to wallet
  const connect = useCallback(async () => {
    if (wallet) {
      try {
        setStatus(WalletStatus.CONNECTING);
        await wallet.connect?.();
        if (wallet.publicKey) {
          setWalletAddress(wallet.publicKey.toString());
          setStatus(WalletStatus.CONNECTED);
          
          // If we have an API, store wallet connection in user profile
          try {
            await fetch('/api/users/wallet', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                walletAddress: wallet.publicKey.toString(),
                walletProvider: 'phantom',
              }),
            });
          } catch (error) {
            console.error('Failed to update user wallet info:', error);
          }
        }
      } catch (error) {
        console.error('Error connecting to wallet:', error);
        setStatus(WalletStatus.ERROR);
      }
    } else {
      // If no wallet is installed, open Phantom website
      window.open('https://phantom.app/', '_blank');
    }
  }, [wallet]);

  // Disconnect from wallet
  const disconnect = useCallback(async () => {
    if (wallet) {
      try {
        await wallet.disconnect?.();
        setWalletAddress(null);
        setStatus(WalletStatus.DISCONNECTED);
      } catch (error) {
        console.error('Error disconnecting from wallet:', error);
        setStatus(WalletStatus.ERROR);
      }
    }
  }, [wallet]);

  return {
    wallet,
    walletAddress,
    status,
    connect,
    disconnect,
    hasWallet: !!wallet,
    isConnecting: status === WalletStatus.CONNECTING,
    isConnected: status === WalletStatus.CONNECTED,
    connection,
  };
};