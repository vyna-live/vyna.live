import { useState } from 'react';
import { Link } from 'wouter';
import { useSolanaWallet, formatWalletAddress } from '@/hooks/useSolanaWallet';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, ExternalLink, User, Copy, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function WalletConnectButton() {
  const { 
    walletAddress, 
    status, 
    connect, 
    disconnect, 
    isConnected, 
    isConnecting,
    isDetected
  } = useSolanaWallet();
  
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setIsCopied(true);
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      
      toast({
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const openExplorer = () => {
    if (walletAddress) {
      window.open(
        `https://explorer.solana.com/address/${walletAddress}?cluster=devnet`,
        '_blank'
      );
    }
  };

  if (!isDetected) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center"
        onClick={() => window.open('https://phantom.app/', '_blank')}
      >
        <Wallet className="mr-2 h-4 w-4" />
        Get Wallet
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center"
        onClick={connect}
        disabled={isConnecting}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center bg-gradient-to-r from-[#5D1C34]/10 to-[#A67D44]/10 border-[#A67D44]/20"
        >
          <Wallet className="mr-2 h-4 w-4 text-[#A67D44]" />
          <span>{walletAddress ? formatWalletAddress(walletAddress) : 'Wallet'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Solana Wallet</p>
            <p className="text-xs leading-none text-muted-foreground mt-1">
              {walletAddress ? formatWalletAddress(walletAddress) : 'Not connected'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyToClipboard}>
          {isCopied ? (
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          <span>Copy Address</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openExplorer}>
          <ExternalLink className="mr-2 h-4 w-4" />
          <span>View on Explorer</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/wallet">
            <div className="flex items-center w-full cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Wallet Dashboard</span>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={disconnect}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}