import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SolanaWalletButtonProps {
  onWalletConnect?: (publicKey: string) => Promise<void>;
  onWalletDisconnect?: () => Promise<void>;
  className?: string;
}

// Define the Phantom provider interface
interface PhantomProvider {
  isPhantom: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: any) => void;
  removeAllListeners: () => void;
}

export default function SolanaWalletButton({
  onWalletConnect,
  onWalletDisconnect,
  className = ''
}: SolanaWalletButtonProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Initialize phantom wallet
  const getProvider = (): PhantomProvider | null => {
    if ('solana' in window) {
      // @ts-ignore
      const provider = window.solana as PhantomProvider;
      if (provider.isPhantom) return provider;
    }
    return null;
  };

  // Check if wallet is connected on component mount
  useEffect(() => {
    const provider = getProvider();
    if (provider) {
      provider.on('connect', (publicKey: { toString: () => string }) => {
        const address = publicKey.toString();
        console.log('Connected to wallet:', address);
        setWalletAddress(address);
        // If callback provided, notify parent component
        if (onWalletConnect) onWalletConnect(address);
      });

      provider.on('disconnect', () => {
        console.log('Disconnected from wallet');
        setWalletAddress(null);
        // If callback provided, notify parent component
        if (onWalletDisconnect) onWalletDisconnect();
      });

      // Check if already connected
      provider.connect({ onlyIfTrusted: true })
        .catch(() => {
          // This is normal if not yet connected, not an error
        });

      return () => {
        provider.removeAllListeners();
      };
    }
  }, [onWalletConnect, onWalletDisconnect]);

  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      const provider = getProvider();
      
      if (!provider) {
        toast({
          title: 'Wallet not found',
          description: 'Please install Phantom wallet extension',
          variant: 'destructive'
        });
        window.open('https://phantom.app/', '_blank');
        return;
      }

      await provider.connect();
      // The actual connection is handled in the event listener
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Solana wallet',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnectWallet = useCallback(async () => {
    try {
      const provider = getProvider();
      if (provider) {
        await provider.disconnect();
        // The actual disconnection is handled in the event listener
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast({
        title: 'Disconnect Failed',
        description: 'Failed to disconnect from Solana wallet',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Format wallet address for display
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className={className}>
      {walletAddress ? (
        <Button 
          onClick={disconnectWallet} 
          variant="outline" 
          className="flex items-center gap-2 bg-[#5D1C34]/10 border-[#5D1C34]/20 text-[#5D1C34] hover:bg-[#5D1C34]/20"
        >
          <Wallet className="h-4 w-4" />
          {formatWalletAddress(walletAddress)}
        </Button>
      ) : (
        <Button 
          onClick={connectWallet} 
          variant="outline" 
          className="flex items-center gap-2 bg-[#5D1C34]/10 border-[#5D1C34]/20 text-[#5D1C34] hover:bg-[#5D1C34]/20"
          disabled={isConnecting}
        >
          <Wallet className="h-4 w-4" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      )}
    </div>
  );
}
