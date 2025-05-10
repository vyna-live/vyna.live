import { Sparkles, Zap, DollarSign } from "lucide-react";
import Logo from "./Logo";
import SolanaWalletButton from "./SolanaWalletButton";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface HeaderProps {
  username: string;
}

export default function Header({ username }: HeaderProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const handleWalletConnect = async (publicKey: string) => {
    try {
      const response = await fetch('/api/users/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          walletAddress: publicKey,
          walletProvider: 'phantom'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect wallet');
      }

      console.log('Wallet connected successfully:', data);
    } catch (error) {
      console.error('Error updating wallet in database:', error);
      toast({
        title: 'Database Error',
        description: 'Failed to update wallet info in database',
        variant: 'destructive'
      });
    }
  };

  const handleWalletDisconnect = async () => {
    try {
      const response = await fetch('/api/users/wallet', {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect wallet');
      }

      console.log('Wallet disconnected successfully:', data);
    } catch (error) {
      console.error('Error disconnecting wallet in database:', error);
      toast({
        title: 'Database Error',
        description: 'Failed to disconnect wallet in database',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="mb-10 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <Logo variant="full" size="lg" className="max-w-[140px]" />
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-[#5D1C34]" />
              <span className="text-sm font-medium text-[#5D1C34]">STREAMCAST AI</span>
            </div>
            <button
              onClick={() => setLocation('/subscription')}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-[#efe9e1]/20"
            >
              <DollarSign className="h-4 w-4 text-[#A67D44]" />
              <span className="text-[#A67D44]">Pricing</span>
            </button>
          </div>
          <SolanaWalletButton />
        </div>
      </div>
      
      <div className="glass-card p-8 mb-8 bg-gradient-to-br from-[#efe9e1]/30 to-[#cdbcab]/20 border border-[#cdbcab]/30">
        <h1 className="text-4xl font-bold text-[#1F2937] mb-2 flex items-center">
          Welcome back, <span className="bg-gradient-to-r from-[#5D1C34] to-[#A67D44] text-transparent bg-clip-text ml-2">{username}</span>
        </h1>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#A67D44] to-[#899481] text-transparent bg-clip-text mb-4">
          What would you like to know today?
        </h2>
        <div className="flex items-center space-x-2 text-[#6B7280]">
          <Zap className="h-4 w-4 text-[#A67D44]" />
          <p className="text-gray-600">
            Try one of the popular prompts below or ask your own question to get started
          </p>
        </div>
      </div>
    </div>
  );
}
