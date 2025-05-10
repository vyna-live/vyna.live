import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown, LogOut, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface SolanaWalletButtonProps {
  onWalletConnect?: (publicKey: string) => void;
  onWalletDisconnect?: () => void;
}

export default function SolanaWalletButton({ 
  onWalletConnect, 
  onWalletDisconnect 
}: SolanaWalletButtonProps) {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Handle wallet connect button click
  const handleConnectClick = () => {
    setVisible(true);
  };

  // Handle wallet disconnect
  const handleDisconnect = async () => {
    try {
      await disconnect();
      
      if (onWalletDisconnect) {
        onWalletDisconnect();
      }
      
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected successfully."
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      
      toast({
        title: "Disconnect failed",
        description: "Failed to disconnect your wallet.",
        variant: "destructive"
      });
    }
  };

  // Handle address copy
  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard."
      });
      
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle view on explorer
  const handleViewOnExplorer = () => {
    if (publicKey) {
      const url = `https://explorer.solana.com/address/${publicKey.toString()}`;
      window.open(url, '_blank');
    }
  };

  return (
    <>
      {!connected ? (
        <Button 
          variant="outline" 
          size="sm"
          className="border-[#A67D44]/70 text-[#A67D44] hover:text-[#A67D44] hover:bg-[#A67D44]/10"
          onClick={handleConnectClick}
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="border-green-600/30 bg-green-950/20 text-green-400 hover:bg-green-950/30"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#0c0c0c] border-[#333] text-white">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-medium text-gray-400">Connected Wallet</p>
                <p className="font-medium truncate">
                  {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-6)}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#333]" />
            <DropdownMenuItem 
              className="cursor-pointer flex items-center text-sm"
              onClick={handleCopyAddress}
            >
              {copied ? (
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              <span>Copy Address</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer flex items-center text-sm"
              onClick={handleViewOnExplorer}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>View on Explorer</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#333]" />
            <DropdownMenuItem 
              className="cursor-pointer flex items-center text-sm text-red-400 focus:text-red-400"
              onClick={handleDisconnect}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}