import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSolanaWallet, WalletStatus, formatWalletAddress } from '@/hooks/useSolanaWallet';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink, LogOut, Wallet } from 'lucide-react';

export function WalletConnectButton() {
  const { 
    walletAddress, 
    status, 
    connect, 
    disconnect, 
    hasWallet,
    isConnecting,
    isConnected 
  } = useSolanaWallet();
  
  const { toast } = useToast();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  // Handle change in wallet status
  useEffect(() => {
    if (status === WalletStatus.CONNECTED && walletAddress) {
      toast({
        title: "Wallet Connected",
        description: `Connected to ${formatWalletAddress(walletAddress)}`,
      });
    } else if (status === WalletStatus.ERROR) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to wallet",
        variant: "destructive",
      });
    }
  }, [status, toast, walletAddress]);

  // Handle wallet connection
  const handleConnect = async () => {
    if (!hasWallet) {
      window.open('https://phantom.app/', '_blank');
      toast({
        title: "Wallet Not Found",
        description: "Please install Phantom wallet to continue",
      });
      return;
    }
    
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to wallet",
        variant: "destructive",
      });
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      await disconnect();
      setIsPopoverOpen(false);
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      toast({
        title: "Disconnection Failed",
        description: "Could not disconnect wallet",
        variant: "destructive",
      });
    }
  };

  // Copy wallet address to clipboard
  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  // View wallet in Solana explorer
  const viewInExplorer = () => {
    if (walletAddress) {
      window.open(
        `https://explorer.solana.com/address/${walletAddress}?cluster=devnet`,
        '_blank'
      );
    }
  };

  if (!isConnected) {
    return (
      <Button 
        onClick={handleConnect}
        disabled={isConnecting}
        variant="outline"
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white border-none hover:opacity-90"
        size="sm"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white border-none hover:opacity-90"
          size="sm"
        >
          <Wallet className="h-4 w-4" />
          {formatWalletAddress(walletAddress)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-4">
        <div className="space-y-4">
          <div className="text-sm font-medium">Connected Wallet</div>
          <div className="p-2 bg-muted rounded-md flex items-center justify-between">
            <code className="text-xs text-muted-foreground">
              {formatWalletAddress(walletAddress)}
            </code>
            <Button variant="ghost" size="icon" onClick={copyAddress} className="h-6 w-6">
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start" 
              onClick={viewInExplorer}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View in Explorer
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-50" 
              onClick={handleDisconnect}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}