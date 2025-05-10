import React, { useState } from 'react';
import { useWallet } from '@/contexts/SolanaWalletProvider';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  ChevronDown, 
  LogOut, 
  CreditCard, 
  User, 
  Shield, 
  Crown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocation } from 'wouter';
import WalletConnectionModal from '@/components/wallet/WalletConnectionModal';

const SolanaWalletButton: React.FC = () => {
  const { wallet, disconnectWallet, connected } = useWallet();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [, navigate] = useLocation();
  
  const handleConnectWallet = () => {
    setIsWalletModalOpen(true);
  };
  
  const handleWalletConnected = () => {
    setIsWalletModalOpen(false);
  };
  
  const handleNavigateToSubscriptions = () => {
    navigate('/subscription');
  };
  
  const handleNavigateToProfile = () => {
    navigate('/profile');
  };
  
  // If not connected, show connect button
  if (!connected) {
    return (
      <>
        <Button 
          onClick={handleConnectWallet}
          variant="outline" 
          size="sm"
          className="bg-[#A67D44] hover:bg-[#8A6836] text-black border-0"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
        
        <WalletConnectionModal 
          isOpen={isWalletModalOpen} 
          onClose={() => setIsWalletModalOpen(false)}
          onSuccess={handleWalletConnected}
        />
      </>
    );
  }
  
  // If connected, show wallet address with dropdown
  const displayAddress = wallet?.address 
    ? `${wallet.address.substring(0, 4)}...${wallet.address.substring(wallet.address.length - 4)}`
    : '';
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-[#202020] hover:bg-[#2a2a2a] border-[#333] text-white"
          >
            <Wallet className="mr-2 h-4 w-4 text-[#A67D44]" />
            {displayAddress}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-56 bg-[#0c0c0c] border-[#333] text-white"
          align="end"
        >
          <DropdownMenuLabel className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1f1f1f] flex items-center justify-center">
              <Wallet className="h-4 w-4 text-[#A67D44]" />
            </div>
            <div>
              <p className="text-sm font-medium">Wallet</p>
              <p className="text-xs text-gray-500 truncate">{displayAddress}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#333]" />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="hover:bg-[#1a1a1a] cursor-pointer"
              onClick={handleNavigateToProfile}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-[#1a1a1a] cursor-pointer"
              onClick={handleNavigateToSubscriptions}
            >
              <Crown className="mr-2 h-4 w-4" />
              <span>Upgrade to Pro</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-[#333]" />
          <DropdownMenuGroup>
            <DropdownMenuItem 
              className="hover:bg-[#1a1a1a] cursor-pointer text-red-500"
              onClick={disconnectWallet}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <WalletConnectionModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)}
        onSuccess={handleWalletConnected}
      />
    </>
  );
};

export default SolanaWalletButton;