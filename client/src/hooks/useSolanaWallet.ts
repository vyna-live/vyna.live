import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

export enum WalletStatus {
  NotDetected = 'not_detected',
  NotConnected = 'not_connected',
  Connected = 'connected',
  Connecting = 'connecting',
  Error = 'error'
}

interface SolanaProvider {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: Function) => void;
  removeListener: (event: string, callback: Function) => void;
  publicKey?: PublicKey;
  isConnected?: boolean;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
    phantom?: {
      solana?: SolanaProvider;
    };
  }
}

export function formatWalletAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function useSolanaWallet() {
  const [provider, setProvider] = useState<SolanaProvider | null>(null);
  const [status, setStatus] = useState<WalletStatus>(WalletStatus.NotDetected);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connection] = useState<Connection>(
    new Connection('https://api.devnet.solana.com', 'confirmed')
  );

  const detectProvider = useCallback(() => {
    if ('phantom' in window) {
      const provider = window.phantom?.solana;
      if (provider && provider.isPhantom) {
        setProvider(provider);
        setStatus(provider.isConnected ? WalletStatus.Connected : WalletStatus.NotConnected);
        if (provider.publicKey) {
          setWalletAddress(provider.publicKey.toString());
        }
        return;
      }
    }

    if ('solana' in window && window.solana?.isPhantom) {
      setProvider(window.solana);
      setStatus(window.solana.isConnected ? WalletStatus.Connected : WalletStatus.NotConnected);
      if (window.solana.publicKey) {
        setWalletAddress(window.solana.publicKey.toString());
      }
      return;
    }

    setStatus(WalletStatus.NotDetected);
    setProvider(null);
    setWalletAddress(null);
  }, []);

  useEffect(() => {
    detectProvider();
  }, [detectProvider]);

  const connect = useCallback(async () => {
    if (!provider) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    if (status === WalletStatus.Connected) return;

    try {
      setIsConnecting(true);
      setStatus(WalletStatus.Connecting);
      
      // Request connection from the provider
      const response = await provider.connect();
      setWalletAddress(response.publicKey.toString());
      setStatus(WalletStatus.Connected);
      
      // Send the wallet info to the server
      await fetch('/api/wallet/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: response.publicKey.toString(),
          provider: 'phantom'
        })
      });

    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error instanceof Error ? error.message : 'Unknown error connecting wallet');
      setStatus(WalletStatus.Error);
    } finally {
      setIsConnecting(false);
    }
  }, [provider, status]);

  const disconnect = useCallback(async () => {
    if (!provider) return;

    try {
      await provider.disconnect();
      setWalletAddress(null);
      setStatus(WalletStatus.NotConnected);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setError(error instanceof Error ? error.message : 'Unknown error disconnecting wallet');
    }
  }, [provider]);

  // Handle connection changes from the provider
  useEffect(() => {
    if (!provider) return;

    const handleConnect = () => {
      if (provider.publicKey) {
        setWalletAddress(provider.publicKey.toString());
        setStatus(WalletStatus.Connected);
      }
    };

    const handleDisconnect = () => {
      setWalletAddress(null);
      setStatus(WalletStatus.NotConnected);
    };

    const handleAccountChange = (publicKey: PublicKey | null) => {
      if (publicKey) {
        setWalletAddress(publicKey.toString());
        // Update the wallet info on account change
        fetch('/api/wallet/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: publicKey.toString(),
            provider: 'phantom'
          })
        }).catch(console.error);
      } else {
        setWalletAddress(null);
        setStatus(WalletStatus.NotConnected);
      }
    };

    provider.on('connect', handleConnect);
    provider.on('disconnect', handleDisconnect);
    provider.on('accountChanged', handleAccountChange);

    return () => {
      provider.removeListener('connect', handleConnect);
      provider.removeListener('disconnect', handleDisconnect);
      provider.removeListener('accountChanged', handleAccountChange);
    };
  }, [provider]);

  return {
    connect,
    disconnect,
    status,
    walletAddress,
    error,
    isConnected: status === WalletStatus.Connected,
    isConnecting,
    isDetected: status !== WalletStatus.NotDetected,
    connection,
  };
}