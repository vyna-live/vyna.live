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
          className="border-[#E6E2DA] text-[#E6E2DA] hover:bg-[#E6E2DA]/10 px-4"
          onClick={handleConnectClick}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
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
          className="border-[#E6E2DA] text-[#E6E2DA] hover:bg-[#E6E2DA]/10"
        >
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">{truncateAddress(wallet.publicKey)}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span>Connected to {wallet.name}</span>
          <span className="text-xs text-muted-foreground break-all">{wallet.publicKey}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          Copy address
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleManageSubscription}>
          <Star className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>VynaAI Plus</span>
            <span className="text-xs text-muted-foreground">(Upgrade your subscription)</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => disconnectWallet()}>
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}