import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletProvider';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WalletConnectionModal({
  isOpen,
  onClose,
  onSuccess,
}: WalletConnectionModalProps) {
  const { connectWallet, isConnecting } = useSolanaWallet();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    try {
      const success = await connectWallet();
      if (success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while connecting to your wallet.'
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Connect Wallet</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Connect your Solana wallet to access premium features.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="bg-black rounded-lg p-6 border border-neutral-800">
            <h3 className="font-semibold mb-2">Why connect a wallet?</h3>
            <ul className="space-y-2 text-sm text-neutral-400 list-disc pl-4">
              <li>Access pro features and premium content</li>
              <li>Subscribe to creators with SOL or USDC</li>
              <li>Secure and transparent transactions</li>
              <li>Web3 native experience</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-md p-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-neutral-700 text-white hover:bg-neutral-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-[#E6E2DA] hover:bg-[#D6D2CA] text-black"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Wallet'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}