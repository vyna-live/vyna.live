import { useState, useEffect } from 'react';
import { useSolanaWallet, formatWalletAddress, WalletStatus } from '@/hooks/useSolanaWallet';
import { Coins, ArrowDownUp, Check, X, Clock, ExternalLink } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Transaction {
  id: number;
  signature: string;
  amount: string;
  transactionType: string;
  status: string;
  fromAddress: string;
  toAddress: string;
  createdAt: string;
  confirmedAt?: string;
}

export function WalletDashboard() {
  const { 
    walletAddress, 
    status, 
    connect, 
    isConnected, 
    isConnecting,
    connection
  } = useSolanaWallet();
  
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Fetch wallet balance when wallet is connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected && walletAddress) {
        try {
          setIsLoadingBalance(true);
          const pubKey = new window.solana.PublicKey(walletAddress);
          const bal = await connection.getBalance(pubKey);
          setBalance(bal / 1000000000); // Convert lamports to SOL
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(null);
        } finally {
          setIsLoadingBalance(false);
        }
      } else {
        setBalance(null);
      }
    };

    fetchBalance();
  }, [isConnected, walletAddress, connection]);

  // Fetch wallet transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (isConnected) {
        try {
          setIsLoadingTransactions(true);
          const response = await fetch('/api/wallet/transactions');
          
          if (response.ok) {
            const data = await response.json();
            setTransactions(data);
          } else {
            console.error('Error fetching transactions:', await response.text());
          }
        } catch (error) {
          console.error('Error fetching transactions:', error);
        } finally {
          setIsLoadingTransactions(false);
        }
      } else {
        setTransactions([]);
      }
    };

    fetchTransactions();
  }, [isConnected]);

  // Render status icon based on transaction status
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  // Format transaction type for display
  const formatTransactionType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Coins className="mr-2 h-5 w-5 text-[#A67D44]" />
            Wallet
          </CardTitle>
          <CardDescription>
            Connect your Solana wallet to view your balance and transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Button 
            onClick={connect}
            disabled={isConnecting}
            className="bg-gradient-to-r from-purple-600 to-orange-500 text-white border-none hover:opacity-90"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Coins className="mr-2 h-5 w-5 text-[#A67D44]" />
          Wallet
        </CardTitle>
        <CardDescription>
          {walletAddress ? formatWalletAddress(walletAddress) : 'Loading wallet...'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Balance</h3>
            {isLoadingBalance ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <p className="text-2xl font-bold">
                {balance !== null ? `${balance.toFixed(4)} SOL` : 'N/A'}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Recent Transactions
            </h3>
            {isLoadingTransactions ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((tx) => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                  >
                    <div className="flex items-center">
                      <div className="mr-3">
                        {renderStatusIcon(tx.status)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {formatTransactionType(tx.transactionType)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <p className={`text-sm font-medium ${
                        tx.fromAddress === walletAddress ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {tx.fromAddress === walletAddress ? '-' : '+'}{tx.amount} SOL
                      </p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 ml-2"
                        onClick={() => window.open(
                          `https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`,
                          '_blank'
                        )}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No transactions found</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => window.open(
            `https://explorer.solana.com/address/${walletAddress}?cluster=devnet`,
            '_blank'
          )}
        >
          <ArrowDownUp className="mr-2 h-4 w-4" />
          View All Transactions
        </Button>
      </CardFooter>
    </Card>
  );
}