import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface StatusMessageProps {
  type: 'loading' | 'success' | 'error';
  title: string;
  message: string;
}

function StatusMessage({ type, title, message }: StatusMessageProps) {
  return (
    <div className="text-center my-8">
      <div className="flex justify-center mb-4">
        {type === 'loading' && (
          <Loader2 className="h-12 w-12 text-[#E6E2DA] animate-spin" />
        )}
        {type === 'success' && (
          <CheckCircle className="h-12 w-12 text-green-500" />
        )}
        {type === 'error' && (
          <AlertCircle className="h-12 w-12 text-red-500" />
        )}
      </div>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-neutral-400">{message}</p>
    </div>
  );
}

export default function WalletConnectPage() {
  const params = useParams<{ sessionId: string }>();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'phantom' | 'solflare' | null>(null);
  
  useEffect(() => {
    // Extract session ID from URL
    const { sessionId } = params;
    
    if (!sessionId) {
      setStatus('error');
      setError('Invalid session ID');
      return;
    }
    
    // Detect wallet provider (Phantom or Solflare)
    const detectWalletProvider = () => {
      // Check if opened from Phantom or Solflare
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('phantom')) {
        return 'phantom';
      } else if (userAgent.includes('solflare')) {
        return 'solflare';
      }
      
      // Attempt to detect wallet by checking what's available
      if (typeof window !== 'undefined') {
        if (window.phantom?.solana) {
          return 'phantom';
        } else if (window.solflare) {
          return 'solflare';
        }
      }
      
      return null;
    };
    
    const detectedProvider = detectWalletProvider();
    setProvider(detectedProvider);
    
    const connectWallet = async () => {
      try {
        // Check if wallet is available
        if (!detectedProvider) {
          setStatus('error');
          setError('No compatible wallet detected. Please install Phantom or Solflare mobile app.');
          return;
        }

        // Connect to the wallet
        let publicKey;
        
        if (detectedProvider === 'phantom') {
          try {
            const response = await window.phantom?.solana.connect();
            publicKey = response?.publicKey.toString();
          } catch (err) {
            setStatus('error');
            setError('Failed to connect to Phantom wallet. Please try again.');
            return;
          }
        } else if (detectedProvider === 'solflare') {
          try {
            const response = await window.solflare?.connect();
            publicKey = response?.publicKey.toString();
          } catch (err) {
            setStatus('error');
            setError('Failed to connect to Solflare wallet. Please try again.');
            return;
          }
        }
        
        if (!publicKey) {
          setStatus('error');
          setError('Failed to get public key from wallet');
          return;
        }
        
        // Update session with wallet connection
        const response = await apiRequest('POST', `/api/mobile/session/${sessionId}/connect`, {
          publicKey,
          provider: detectedProvider
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to connect wallet');
        }
        
        // Success - update status
        setStatus('connected');
        
        // Automatically close after a short delay
        setTimeout(() => {
          // Close the window (for in-app browsers) or navigate to homepage
          if (window.opener) {
            window.close();
          } else {
            navigate('/');
          }
        }, 3000);
        
      } catch (error) {
        console.error('Error connecting wallet:', error);
        setStatus('error');
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    };
    
    connectWallet();
  }, [params, navigate]);
  
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-6 bg-neutral-900 rounded-lg shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Vyna.live</h1>
          <p className="text-neutral-400">Wallet Connection</p>
        </div>
        
        {status === 'connecting' && (
          <StatusMessage
            type="loading"
            title="Connecting Wallet"
            message={`Connecting your ${provider || ''} wallet to Vyna.live. Please approve the connection request in your wallet app.`}
          />
        )}
        
        {status === 'connected' && (
          <StatusMessage
            type="success"
            title="Wallet Connected!"
            message="Your wallet has been successfully connected. You will be redirected automatically."
          />
        )}
        
        {status === 'error' && (
          <StatusMessage
            type="error"
            title="Connection Failed"
            message={error || 'An error occurred while connecting your wallet. Please try again.'}
          />
        )}
        
        {status === 'error' && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        )}
      </div>
    </div>
  );
}