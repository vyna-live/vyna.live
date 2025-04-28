import { useState, useEffect } from "react";
import { Link } from "wouter";
import { WalletDashboard } from "@/components/WalletDashboard";
import Logo from "@/components/Logo";
import { Wallet, History, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

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

export default function WalletPage() {
  const { isConnected } = useSolanaWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      if (isConnected) {
        try {
          setIsLoading(true);
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
          setIsLoading(false);
        }
      } else {
        setTransactions([]);
      }
    };

    fetchTransactions();
  }, [isConnected]);

  // Calculate total balance
  const calculateTotalAmount = () => {
    if (transactions.length === 0) return 0;
    
    return transactions.reduce((total, tx) => {
      const amount = parseFloat(tx.amount);
      if (isNaN(amount)) return total;
      
      if (tx.status === 'confirmed') {
        if (tx.transactionType === 'receive' || tx.transactionType === 'tip_received') {
          return total + amount;
        } else if (tx.transactionType === 'send' || tx.transactionType === 'tip_sent') {
          return total - amount;
        }
      }
      
      return total;
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-950 dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <a className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                <ArrowLeft className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Back</span>
              </a>
            </Link>
            <div className="h-5 border-r border-gray-300 dark:border-gray-700"></div>
            <div className="flex items-center">
              <Logo size="sm" variant="color" />
              <h1 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">Wallet</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallet card */}
          <div className="lg:col-span-2">
            <WalletDashboard />
          </div>

          {/* Side panel */}
          <div className="space-y-6">
            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Wallet className="mr-2 h-5 w-5 text-[#A67D44]" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start bg-gradient-to-r from-[#5D1C34] to-[#A67D44] hover:opacity-90"
                  size="sm"
                  disabled={!isConnected}
                >
                  <History className="mr-2 h-4 w-4" />
                  View on Solana Explorer
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  size="sm"
                  disabled={!isConnected}
                >
                  <svg 
                    className="mr-2 h-4 w-4" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M6 12H18M18 12L13 7M18 12L13 17" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                  Send SOL
                </Button>
              </CardContent>
            </Card>

            {/* Info card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About Solana Wallet</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  Connect your Phantom wallet to interact with the Solana blockchain. 
                  Use it to send and receive SOL, the native cryptocurrency of Solana.
                </p>
                <p>
                  Your wallet can be used to tip content creators during livestreams 
                  and support your favorite streamers.
                </p>
                <div className="pt-2">
                  <a 
                    href="https://phantom.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#A67D44] hover:text-[#5D1C34] underline text-sm"
                  >
                    Get Phantom Wallet →
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-950 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Connected to Solana Devnet
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 vyna.live
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}