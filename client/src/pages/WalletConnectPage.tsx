import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

interface StatusMessageProps {
  type: 'loading' | 'success' | 'error';
  title: string;
  message: string;
}

function StatusMessage({ type, title, message }: StatusMessageProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {type === 'loading' && (
        <Loader2 className="h-12 w-12 text-[#E6E2DA] animate-spin mb-4" />
      )}
      {type === 'success' && (
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
      )}
      {type === 'error' && (
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
      )}
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-neutral-400 mb-6">{message}</p>
    </div>
  );
}

export default function WalletConnectPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ sessionId: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState({
    title: 'Connecting Wallet',
    message: 'Please wait while we connect your wallet...'
  });

  // Used when browser is embedded in Phantom or Solflare app 
  useEffect(() => {
    async function connectWallet() {
      if (!params.sessionId) {
        setStatus('error');
        setMessage({
          title: 'Connection Error',
          message: 'Invalid session. Please try again.'
        });
        return;
      }

      try {
        setStatus('loading');
        setMessage({
          title: 'Connecting Wallet',
          message: 'Please authorize your wallet to connect...'
        });

        // Get the wallet from the parent app
        const solanaWeb3 = (window as any).solana;
        const solflareWeb3 = (window as any).solflare;

        if (!solanaWeb3 && !solflareWeb3) {
          // No wallet found in browser context
          setStatus('error');
          setMessage({
            title: 'Wallet Not Found',
            message: 'No compatible wallet was detected. Please make sure you\'re opening this link from a mobile wallet app.'
          });
          return;
        }

        // Determine which wallet we're using
        const wallet = solanaWeb3 || solflareWeb3;
        const provider = solanaWeb3 ? 'phantom' : 'solflare';

        // Connect to the wallet
        const { publicKey } = await wallet.connect();
        
        if (!publicKey) {
          throw new Error('Failed to connect to wallet');
        }

        // Send public key to the server
        const response = await apiRequest('POST', `/api/mobile/session/${params.sessionId}/connect`, {
          publicKey: publicKey.toString(),
          provider,
        });

        if (!response.ok) {
          // Special handling for expired sessions
          if (response.status === 410) {
            setStatus('error');
            setMessage({
              title: 'Session Expired',
              message: 'This connection request has expired. Please try again with a new QR code.'
            });
            return;
          }
          
          throw new Error('Failed to connect wallet to session');
        }

        // Get transaction data from session
        const sessionData = await response.json();
        
        // If we have transaction data, we need to send payment
        if (sessionData.transactionData) {
          setStatus('loading');
          setMessage({
            title: 'Authorizing Payment',
            message: `Please approve the payment of ${sessionData.transactionData.amount} ${sessionData.transactionData.paymentMethod.toUpperCase()} for VynaAI subscription.`
          });

          const { amount, recipient, paymentMethod } = sessionData.transactionData;
          
          let transaction;
          if (paymentMethod === 'sol') {
            // Create SOL transfer transaction
            transaction = await wallet.createTransferTransaction({
              recipient,
              amount: parseFloat(amount),
            });
          } else {
            // For USDC, would need to create SPL token transfer
            throw new Error('USDC payments not yet implemented for mobile');
          }

          // Sign and send the transaction
          const { signature } = await wallet.signAndSendTransaction(transaction);
          
          // Confirm the payment on the server
          const confirmResponse = await apiRequest('POST', `/api/mobile/payment/${params.sessionId}/confirm`, {
            signature,
          });
          
          if (!confirmResponse.ok) {
            throw new Error('Failed to confirm payment');
          }
          
          // Success!
          setStatus('success');
          setMessage({
            title: 'Payment Successful',
            message: 'Your subscription has been activated. You can close this window and return to the app.'
          });
        } else {
          // Just wallet connection without payment
          setStatus('success');
          setMessage({
            title: 'Wallet Connected',
            message: 'Your wallet has been successfully connected. You can close this window and return to the app.'
          });
        }
      } catch (error) {
        console.error('Wallet connection error:', error);
        setStatus('error');
        setMessage({
          title: 'Connection Error',
          message: error instanceof Error ? error.message : 'Failed to connect wallet. Please try again.'
        });
      }
    }

    connectWallet();
  }, [params.sessionId]);

  const handleReturn = () => {
    // Redirect to home page
    setLocation('/');
  };

  return (
    <div className="flex min-h-screen bg-black flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-8">
        <StatusMessage 
          type={status} 
          title={message.title} 
          message={message.message} 
        />
        
        <Button
          onClick={handleReturn}
          variant="outline"
          className="w-full border-neutral-700 text-white hover:bg-neutral-800 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Application
        </Button>
      </div>
    </div>
  );
}