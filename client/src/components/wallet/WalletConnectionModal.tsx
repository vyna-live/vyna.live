import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WalletConnectionModal({ 
  isOpen, 
  onClose,
  onSuccess 
}: WalletConnectionModalProps) {
  const { connected, connecting, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [connectionAttempted, setConnectionAttempted] = useState(false);

  // Open the Solana wallet adapter modal when user clicks "Connect Wallet"
  const handleConnectWallet = () => {
    setConnectionAttempted(true);
    setVisible(true);
  };

  // Check if connected and call success callback
  const handleContinue = () => {
    if (connected && publicKey) {
      onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0c0c0c] border-[#cdbcab]/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Connect Your Wallet</DialogTitle>
          <DialogDescription className="text-gray-400">
            Connect your Solana wallet to continue with the subscription process.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <div className="mb-6 w-16 h-16 bg-[#1f1f1f] rounded-full flex items-center justify-center">
            <Wallet className="h-8 w-8 text-[#A67D44]" />
          </div>

          {!connected ? (
            <div className="flex flex-col items-center space-y-4 w-full">
              <p className="text-center text-sm">
                You'll need a Solana wallet to make payments. 
                This will allow you to securely pay for your subscription using SOL.
              </p>
              
              {connectionAttempted && !connecting && (
                <div className="w-full p-3 border border-amber-600/30 bg-amber-950/20 rounded-md flex items-start space-x-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-400">
                    <p className="font-medium">Connection not completed</p>
                    <p>Please complete the connection process in your wallet.</p>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleConnectWallet}
                className="w-full bg-[#A67D44] hover:bg-[#8A6836] text-black"
                disabled={connecting}
              >
                {connecting ? "Connecting..." : "Connect Wallet"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="w-full p-3 border border-green-600/30 bg-green-950/20 rounded-md flex items-start space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-400">Wallet connected successfully</p>
                  <p className="text-gray-400 break-all">{publicKey?.toString()}</p>
                </div>
              </div>
              
              <Button 
                onClick={handleContinue}
                className="w-full bg-[#A67D44] hover:bg-[#8A6836] text-black"
              >
                Continue to Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-2 pt-4 border-t border-[#333] text-xs text-gray-500">
          Your wallet will only be used for payment processing and won't have access to any other permissions.
        </div>
      </DialogContent>
    </Dialog>
  );
}