import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  Loader2, 
  LogOut, 
  Wallet,
  Copy,
  Star,
  ExternalLink 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useSolanaWallet } from '@/contexts/SolanaWalletProvider';
import { WalletConnectionModal } from '@/components/wallet/WalletConnectionModal';
import { useLocation } from 'wouter';

export function SolanaWalletButton() {
  const { wallet, isConnecting, connectWallet, disconnectWallet } = useSolanaWallet();
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Handle wallet connection click
  const handleConnectClick = () => {
    if (!wallet) {
      setShowModal(true);
    }
  };

  // Handle copy address click
  const handleCopyAddress = () => {
    if (wallet?.publicKey) {
      navigator.clipboard.writeText(wallet.publicKey);
      toast({
        title: 'Address copied',
        description: 'Wallet address copied to clipboard',
      });
    }
  };

  // Navigate to subscription page
  const handleManageSubscription = () => {
    navigate('/subscription');
  };

  // Helper function to truncate wallet address
  const truncateAddress = (address: string): string => {
    if (!address) return '';
    return address.slice(0, 4) + '...' + address.slice(-4);
  };

  // Render the button
  if (!wallet) {
    return (
      <>
        <Button 
          size="sm"
          variant="outline" 
          className="bg-[#252525] border-[#333] text-[#E6E2DA] hover:bg-[#303030] px-3 py-1 h-8 text-xs font-medium rounded-md"
          onClick={handleConnectClick}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-1 h-3 w-3" />
              Connect Wallet
            </>
          )}
        </Button>

        {/* Wallet Connection Modal */}
        <WalletConnectionModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          size="sm"
          variant="outline" 
          className="bg-[#252525] border-[#333] text-[#E6E2DA] hover:bg-[#303030] px-3 py-1 h-8 text-xs font-medium rounded-md"
        >
          <div className="flex items-center gap-1">
            <Wallet className="h-3 w-3" />
            <span className="hidden sm:inline">{truncateAddress(wallet.publicKey)}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-[#333] text-white">
        <div className="px-4 py-3 border-b border-[#333] bg-[#1a1a1a]">
          <p className="text-sm font-medium text-white">Connected to {wallet.name}</p>
          <p className="text-xs text-gray-400 truncate">{wallet.publicKey}</p>
        </div>

        <button
          onClick={handleCopyAddress}
          className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-100 hover:bg-[#252525] transition-colors bg-[#1a1a1a]"
        >
          <Copy className="mr-2 h-4 w-4 text-gray-400" />
          Copy address
        </button>

        <button
          onClick={handleManageSubscription}
          className="flex items-center w-full px-4 py-2.5 text-left hover:bg-[#252525] transition-colors bg-[#1a1a1a]"
        >
          <Star size={18} className="text-[#DCC5A2] mr-2" />
          <div>
            <span className="block text-sm font-medium text-white">VynaAI Plus</span>
            <span className="block text-xs text-gray-400">Upgrade your subscription</span>
          </div>
        </button>

        <button
          onClick={() => disconnectWallet()}
          className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-100 hover:bg-[#252525] transition-colors bg-[#1a1a1a]"
        >
          <LogOut className="mr-2 h-4 w-4 text-gray-400" />
          Disconnect
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}