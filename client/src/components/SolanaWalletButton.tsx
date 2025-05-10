import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet as WalletIcon, ChevronDown, LogOut } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletProvider';
import { WalletConnectionModal } from '@/components/wallet/WalletConnectionModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SolanaWalletButton() {
  const { wallet, isConnecting, connectWallet, disconnectWallet } = useSolanaWallet();
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Format wallet address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Format balance
  const formatBalance = (balance: number) => {
    return balance.toFixed(4);
  };

  if (isConnecting) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-neutral-700 text-neutral-300 gap-2"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Connecting...</span>
      </Button>
    );
  }

  if (wallet && wallet.isConnected) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-neutral-700 text-neutral-300 gap-2"
            >
              <WalletIcon className="h-4 w-4" />
              <span>{formatAddress(wallet.address)}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-700 text-white">
            <DropdownMenuLabel className="text-neutral-400">Your Wallet</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-neutral-800" />
            <div className="px-2 py-2">
              <div className="text-xs text-neutral-500 mb-1">Address</div>
              <div className="text-neutral-300 text-sm break-all">{wallet.address}</div>
              <div className="text-xs text-neutral-500 mb-1 mt-3">Balance</div>
              <div className="text-neutral-300 text-sm">{formatBalance(wallet.balance)} SOL</div>
            </div>
            <DropdownMenuSeparator className="bg-neutral-800" />
            <DropdownMenuItem
              className="text-red-400 cursor-pointer flex gap-2 items-center"
              onClick={disconnectWallet}
            >
              <LogOut className="h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowConnectModal(true)}
        variant="outline"
        size="sm"
        className="border-neutral-700 text-neutral-300 gap-2"
      >
        <WalletIcon className="h-4 w-4" />
        <span>Connect Wallet</span>
      </Button>

      <WalletConnectionModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />
    </>
  );
}