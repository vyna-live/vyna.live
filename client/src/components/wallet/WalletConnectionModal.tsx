import React from 'react';
import { X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Don't forget to import styles in your app
// import '@solana/wallet-adapter-react-ui/styles.css';

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
  const { connected } = useWallet();

  // Check if wallet got connected
  React.useEffect(() => {
    if (connected) {
      onSuccess();
    }
  }, [connected, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div className="bg-[#1A1A1A] rounded-xl shadow-xl w-full max-w-md mx-4 z-10 overflow-hidden animate-scaleIn">
        <div className="p-5 border-b border-[#333333] flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Connect Your Wallet</h2>
          <button
            onClick={onClose}
            className="text-[#999999] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-[#DDDDDD] mb-6">
            Connect your Solana wallet to unlock Pro features and manage your subscription.
          </p>
          
          <div className="flex flex-col space-y-4">
            {/* Solana Wallet Adapter Button */}
            <div className="flex justify-center">
              <WalletMultiButton className="!bg-[#DCC5A2] !text-[#121212] hover:!bg-[#C6B190] transition-colors rounded-lg py-2 px-4 font-medium" />
            </div>
            
            <div className="text-center mt-4">
              <p className="text-[#999999] text-sm">
                New to Solana? <a href="https://solana.com/getstarted" target="_blank" rel="noopener noreferrer" className="text-[#DCC5A2] hover:underline">Learn more</a>
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-[#222222] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#DDDDDD] hover:bg-[#333333] rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectionModal;