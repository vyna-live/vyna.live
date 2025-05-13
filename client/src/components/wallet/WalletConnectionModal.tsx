import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSolanaWallet } from '@/contexts/SolanaWalletProvider';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WalletConnectionModal({ isOpen, onClose, onSuccess }: WalletConnectionModalProps) {
  const { connectWallet, isConnecting } = useSolanaWallet();
  const [error, setError] = useState<string | null>(null);

  // Handle wallet connection attempt
  const handleConnect = async (provider: 'phantom' | 'solflare') => {
    setError(null);
    try {
      const success = await connectWallet(provider);
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Failed to connect. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect your wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect with Vyna.live for secure transactions and subscription payments.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 my-4">
          <Button
            variant="outline"
            className="flex justify-between items-center h-16 border-neutral-800 hover:bg-neutral-900"
            onClick={() => handleConnect('phantom')}
            disabled={isConnecting}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 mr-4 flex items-center justify-center">
                <svg
                  height="32"
                  width="32"
                  viewBox="0 0 128 128"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="64" cy="64" r="64" fill="#534BB1" />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M65.7939 43.0039H47.8883C44.2862 43.0039 41.7835 46.148 42.537 49.6504L48.1484 76.2793C48.6309 78.3582 50.4569 79.8652 52.587 79.8652H65.7939C66.7687 79.8652 67.7434 79.9676 68.6934 80.1723C73.3207 81.1211 78.0777 80.0176 81.8609 77.1133C85.6195 74.209 88.0246 69.7773 88.5523 64.8359C88.8086 62.5 88.4547 60.1398 87.5281 57.959C86.6016 55.7781 85.1281 53.8379 83.2266 52.3309C81.325 50.7992 79.0598 49.7734 76.6883 49.3176C74.3168 48.8617 71.8715 49.0152 69.5684 49.7734C69.4684 49.7734 69.3437 49.8243 69.2437 49.8499V45.7539C69.2437 44.1965 67.9715 43.0039 66.4813 43.0039H65.7939ZM77.6879 63.0254C77.3676 65.8273 75.3371 68.1375 72.6707 68.7773C72.1449 68.9063 71.5938 68.9774 71.0426 68.9774H64.1223C62.7797 68.9774 61.5902 67.9258 61.384 66.5988L59.0613 53.5363C58.8063 51.7887 60.1977 50.1797 61.9746 50.1797H68.8949C69.4715 50.1797 70.0481 50.2754 70.5992 50.4043C72.5008 50.8602 74.1722 52.0273 75.2351 53.6621C76.2734 55.2969 76.6762 57.2114 76.3805 59.0801C76.3687 59.1519 76.3563 59.2231 76.3442 59.2937C76.2742 59.8336 76.2031 60.3789 76.2274 60.9187L77.6879 63.0254Z"
                    fill="white"
                  />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">Phantom</p>
                <p className="text-xs text-neutral-400">Connect to your Phantom wallet</p>
              </div>
            </div>
            {isConnecting && <Loader2 className="h-5 w-5 animate-spin ml-2" />}
          </Button>

          <Button
            variant="outline"
            className="flex justify-between items-center h-16 border-neutral-800 hover:bg-neutral-900"
            onClick={() => handleConnect('solflare')}
            disabled={isConnecting}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 mr-4 flex items-center justify-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="40" height="40" rx="6.4" fill="#FFD11F" />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.5919 14.1824C14.5919 13.74 14.9601 13.3813 15.4141 13.3813H24.5859C25.0399 13.3813 25.4081 13.74 25.4081 14.1824V15.7846C25.4081 16.227 25.0399 16.5857 24.5859 16.5857H15.4141C14.9601 16.5857 14.5919 16.227 14.5919 15.7846V14.1824ZM14.5919 19.7901C14.5919 19.3478 14.9601 18.989 15.4141 18.989H24.5859C25.0399 18.989 25.4081 19.3478 25.4081 19.7901V21.3923C25.4081 21.8347 25.0399 22.1935 24.5859 22.1935H15.4141C14.9601 22.1935 14.5919 21.8347 14.5919 21.3923V19.7901ZM22.4141 24.597C21.9601 24.597 21.5919 24.9557 21.5919 25.3981V27.0003C21.5919 27.4426 21.9601 27.8014 22.4141 27.8014H31.5859C32.0399 27.8014 32.4081 27.4426 32.4081 27.0003V25.3981C32.4081 24.9557 32.0399 24.597 31.5859 24.597H22.4141ZM7.59193 25.3981C7.59193 24.9557 7.96014 24.597 8.41412 24.597H17.5859C18.0399 24.597 18.4081 24.9557 18.4081 25.3981V27.0003C18.4081 27.4426 18.0399 27.8014 17.5859 27.8014H8.41412C7.96014 27.8014 7.59193 27.4426 7.59193 27.0003V25.3981Z"
                    fill="black"
                  />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">Solflare</p>
                <p className="text-xs text-neutral-400">Connect to your Solflare wallet</p>
              </div>
            </div>
            {isConnecting && <Loader2 className="h-5 w-5 animate-spin ml-2" />}
          </Button>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <div className="text-xs text-neutral-500 mt-4">
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
          No private keys are ever stored on our servers.
        </div>
      </DialogContent>
    </Dialog>
  );
}