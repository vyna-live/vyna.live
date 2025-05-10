import React, { useState } from 'react';
import { useWallet } from '@/contexts/SolanaWalletProvider';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, ArrowRight, Check, X } from 'lucide-react';

// Wallet providers with their logos/icons
const walletProviders = [
  { 
    id: 'phantom', 
    name: 'Phantom', 
    icon: '/phantom-icon.png',
    description: 'Connect with Phantom, a popular Solana wallet extension'
  },
  { 
    id: 'solflare', 
    name: 'Solflare', 
    icon: '/solflare-icon.png',
    description: 'Connect with Solflare, a secure Solana wallet'
  },
  { 
    id: 'slope', 
    name: 'Slope', 
    icon: '/slope-icon.png',
    description: 'Connect with Slope Wallet'
  },
  { 
    id: 'other', 
    name: 'Other Solana Wallet', 
    icon: '/wallet-icon.png',
    description: 'Connect with another Solana-compatible wallet'
  }
];

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { connectWallet, connecting } = useWallet();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStep, setConnectionStep] = useState<'select' | 'connecting' | 'error'>('select');

  const handleSelectWallet = async (providerId: string) => {
    setSelectedProvider(providerId);
    setConnectionStep('connecting');
    setConnectionError(null);
    
    try {
      const success = await connectWallet(providerId as any);
      if (success) {
        onSuccess();
      } else {
        setConnectionStep('error');
        setConnectionError('Failed to connect to wallet. Please try again.');
      }
    } catch (error) {
      console.error('Wallet connection error', error);
      setConnectionStep('error');
      setConnectionError('An unexpected error occurred. Please try again.');
    }
  };

  const handleTryAgain = () => {
    setConnectionStep('select');
    setConnectionError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0c0c0c] border-[#cdbcab]/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Connect Your Wallet</DialogTitle>
          <DialogDescription className="text-gray-400">
            Connect your Solana wallet to access premium features.
          </DialogDescription>
        </DialogHeader>

        {connectionStep === 'select' && (
          <div className="grid gap-4 py-4">
            <div className="mb-4 w-16 h-16 mx-auto bg-[#1f1f1f] rounded-full flex items-center justify-center">
              <Wallet className="h-8 w-8 text-[#A67D44]" />
            </div>
            
            <p className="text-center text-sm mb-4">
              Select a wallet to connect. This will allow you to securely make payments 
              and access premium features.
            </p>
            
            <div className="space-y-2">
              {walletProviders.map(provider => (
                <Button
                  key={provider.id}
                  onClick={() => handleSelectWallet(provider.id)}
                  className="w-full bg-[#1c1c1c] hover:bg-[#262626] text-white border border-[#333] justify-between"
                  variant="outline"
                  disabled={connecting}
                >
                  <div className="flex items-center">
                    <div className="w-6 h-6 mr-3 flex items-center justify-center">
                      {/* If icons are not available, use a fallback */}
                      <Wallet className="h-5 w-5" />
                    </div>
                    <span>{provider.name}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </Button>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              We never store your private keys. All transactions are signed locally in your wallet.
            </p>
          </div>
        )}

        {connectionStep === 'connecting' && (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="h-12 w-12 animate-spin text-[#A67D44] mb-4" />
            <h3 className="text-lg font-medium mb-2">Connecting...</h3>
            <p className="text-sm text-gray-400 text-center">
              Please approve the connection request in your wallet.
            </p>
          </div>
        )}

        {connectionStep === 'error' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Connection Failed</h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              {connectionError || 'Failed to connect to wallet. Please try again.'}
            </p>
            <div className="flex gap-3 w-full">
              <Button 
                onClick={onClose}
                className="flex-1 bg-transparent hover:bg-[#1a1a1a] border border-[#333]"
                variant="outline"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleTryAgain}
                className="flex-1 bg-[#A67D44] hover:bg-[#8A6836] text-black"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectionModal;