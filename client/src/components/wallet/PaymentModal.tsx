import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Check, CreditCard, Coins, QrCode, TabletSmartphone, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useSolanaWallet } from '@/contexts/SolanaWalletProvider';
import { SubscriptionTier } from '@/services/subscriptionService';
import { QRCode } from './QRCode';
import { apiRequest } from '@/lib/queryClient';

// Define payment status type at the top level
type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

// Helper function to check if status is processing (to avoid type errors)
const isProcessingStatus = (status: PaymentStatus): boolean => status === 'processing';

// Mobile session interface
interface MobileSession {
  sessionId: string;
  status: 'pending' | 'connected' | 'completed' | 'expired';
  publicKey?: string;
  provider?: 'phantom' | 'solflare';
  expiresAt: string;
  transactionData?: {
    status: 'pending' | 'completed' | 'failed';
    amount: string;
    recipient: string;
    paymentMethod: 'sol' | 'usdc';
    tierId?: string;
    signature?: string;
  };
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: SubscriptionTier;
  onSuccess: (signature: string, amount: string, paymentMethod: 'sol' | 'usdc') => void;
  isPending?: boolean;
}

export function PaymentModal({
  isOpen,
  onClose,
  selectedTier,
  onSuccess,
  isPending = false,
}: PaymentModalProps) {
  const { wallet, sendTransaction } = useSolanaWallet();
  const [paymentMethod, setPaymentMethod] = useState<'sol' | 'usdc'>('sol');
  const [status, setStatus] = useState<PaymentStatus>('idle');
  // Keep track of processing status separately for button disabling
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mobile payment state
  const [activeTab, setActiveTab] = useState<string>('browser');
  const [mobileSession, setMobileSession] = useState<MobileSession | null>(null);
  const [qrValue, setQrValue] = useState<string>('');
  const [pollingInterval, setPollingIntervalState] = useState<number | null>(null);
  const [mobilePaymentStatus, setMobilePaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'expired' | 'error'>('idle');
  
  // Detect if we're on mobile
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Reset state when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state
      setStatus('idle');
      setIsProcessing(false);
      setError(null);
      setMobilePaymentStatus('idle');
      
      // Clear any polling intervals
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingIntervalState(null);
      }
      
      onClose();
    }
  };

  // Reset state when tier changes
  useEffect(() => {
    if (selectedTier) {
      setStatus('idle');
      setIsProcessing(false);
      setError(null);
      setMobilePaymentStatus('idle');
    }
  }, [selectedTier]);
  
  // Check if on mobile and set appropriate tab
  useEffect(() => {
    if (isOpen) {
      // Check if we're on mobile
      const checkMobile = () => {
        const userAgent = navigator.userAgent || navigator.vendor;
        return /android|webos|iphone|ipad|ipod|blackberry|IEMobile|Opera Mini/i.test(userAgent);
      };
      
      const isMobileDevice = checkMobile();
      setIsMobile(isMobileDevice);
      
      // Set default tab based on device
      if (isMobileDevice) {
        setActiveTab('mobile');
      } else {
        setActiveTab('browser');
      }
    }
  }, [isOpen]);
  
  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);
  
  // Generate QR code for mobile wallet payment when mobile tab is selected
  useEffect(() => {
    if (activeTab === 'mobile' && mobilePaymentStatus === 'idle') {
      createMobilePaymentSession();
    }
  }, [activeTab, mobilePaymentStatus]);
  
  // Poll for mobile session status updates
  useEffect(() => {
    if (mobileSession && mobilePaymentStatus === 'pending') {
      const intervalId = window.setInterval(() => {
        checkMobileSessionStatus(mobileSession.sessionId);
      }, 2000); // Check every 2 seconds
      
      setPollingIntervalState(intervalId);
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [mobileSession, mobilePaymentStatus]);

  // Create a new mobile payment session
  const createMobilePaymentSession = async () => {
    try {
      setMobilePaymentStatus('pending');
      
      const response = await apiRequest('POST', '/api/mobile/session');
      if (!response.ok) {
        throw new Error('Failed to create mobile session');
      }
      
      const sessionData = await response.json();
      setMobileSession(sessionData);
      
      // Register payment request
      const amount = paymentMethod === 'sol' 
        ? selectedTier.priceSol.toString()
        : selectedTier.priceUsdc.toString();
        
      const paymentResponse = await apiRequest('POST', `/api/mobile/payment/${sessionData.sessionId}`, {
        amount,
        paymentMethod,
        tierId: selectedTier.id
      });
      
      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment request');
      }
      
      // Generate QR code data
      // Base URL - Use the current origin
      const baseUrl = window.location.origin;
      
      // Create a direct deep link instead of JSON data
      // Use Phantom as the default since it's more widely used
      const phantomLink = `https://phantom.app/ul/browse/${encodeURIComponent(`${baseUrl}/wallet-connect/${sessionData.sessionId}`)}`;
      
      // Set the QR code value directly to the deep link - no JSON encoding
      setQrValue(phantomLink);
    } catch (err) {
      console.error('Error creating mobile payment session:', err);
      setError('Failed to generate QR code for mobile payment. Please try again.');
      setMobilePaymentStatus('error');
    }
  };
  
  // Check mobile session status
  const checkMobileSessionStatus = async (sessionId: string) => {
    try {
      const response = await apiRequest('GET', `/api/mobile/session/${sessionId}`);
      
      if (!response.ok) {
        // Handle expired or not found
        if (response.status === 410) {
          setMobilePaymentStatus('expired');
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingIntervalState(null);
          }
          return;
        }
        throw new Error('Failed to get session status');
      }
      
      const sessionData = await response.json();
      setMobileSession(sessionData);
      
      // Check if payment completed
      if (
        sessionData.transactionData && 
        sessionData.transactionData.status === 'completed' && 
        sessionData.transactionData.signature
      ) {
        setMobilePaymentStatus('completed');
        
        // Stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingIntervalState(null);
        }
        
        // Call onSuccess with transaction data
        onSuccess(
          sessionData.transactionData.signature,
          sessionData.transactionData.amount,
          sessionData.transactionData.paymentMethod as 'sol' | 'usdc'
        );
      } else if (sessionData.status === 'expired') {
        setMobilePaymentStatus('expired');
        
        // Stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingIntervalState(null);
        }
      }
    } catch (err) {
      console.error('Error checking session status:', err);
    }
  };
  
  // Restart the QR code process
  const handleRestartQrCode = () => {
    setMobilePaymentStatus('idle');
    setMobileSession(null);
    setQrValue('');
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingIntervalState(null);
    }
    // This will trigger the useEffect to create a new session
  };

  // Handle payment via browser wallet
  const handleSubmit = async () => {
    if (!wallet) {
      setError('Wallet not connected. Please connect your wallet first.');
      return;
    }

    setStatus('processing');
    setIsProcessing(true);
    setError(null);

    try {
      // Get amount based on payment method
      const amount = paymentMethod === 'sol' 
        ? selectedTier.priceSol.toString()
        : selectedTier.priceUsdc.toString();

      // Program wallet that receives the payment
      const recipient = 'HF7EHsCJAiQvuVyvEZpEXGAnbLk1hotBKuuTq7v9JBYU'; // Solana wallet address that receives payments
      
      // Create and send transaction
      const result = await sendTransaction({
        amount,
        recipient,
        paymentMethod,
      });

      // Check if this was a previously processed transaction
      if (result.signature === 'ALREADY_PROCESSED') {
        // Still mark as success but with a note (the toast will have already been shown by the wallet provider)
        console.log('Transaction was already processed previously');
        // No need for additional handling, just continue with success flow
      }

      // Show success and call the onSuccess callback
      setStatus('success');
      onSuccess(result.signature, amount, paymentMethod);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Payment method radio group component - used in multiple tabs
  const PaymentMethodSelector = () => (
    <div>
      <div className="mb-2 font-medium">Payment Method</div>
      <RadioGroup 
        defaultValue="sol" 
        value={paymentMethod} 
        onValueChange={(value) => setPaymentMethod(value as 'sol' | 'usdc')}
        className="grid grid-cols-2 gap-4"
      >
        <div>
          <RadioGroupItem 
            value="sol" 
            id="sol" 
            className="peer sr-only" 
          />
          <Label
            htmlFor="sol"
            className="flex flex-col items-center justify-between rounded-lg border-2 border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800/50 hover:text-accent-foreground peer-data-[state=checked]:border-[#E6E2DA] [&:has([data-state=checked])]:border-[#E6E2DA]"
          >
            <Coins className="mb-3 h-6 w-6 text-[#E6E2DA]" />
            <div className="text-center">
              <p className="font-medium">SOL</p>
              <p className="text-sm text-neutral-400">Solana</p>
            </div>
          </Label>
        </div>

        <div>
          <RadioGroupItem 
            value="usdc" 
            id="usdc" 
            className="peer sr-only" 
          />
          <Label
            htmlFor="usdc"
            className="flex flex-col items-center justify-between rounded-lg border-2 border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800/50 hover:text-accent-foreground peer-data-[state=checked]:border-[#E6E2DA] [&:has([data-state=checked])]:border-[#E6E2DA]"
          >
            <CreditCard className="mb-3 h-6 w-6 text-[#27a0f2]" />
            <div className="text-center">
              <p className="font-medium">USDC</p>
              <p className="text-sm text-neutral-400">USD Coin</p>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );

  // Subscription plan summary component
  const PlanSummary = () => (
    <div className="bg-neutral-900 rounded-lg p-4 mb-4">
      <div className="flex justify-between mb-2">
        <span className="text-neutral-400">Plan</span>
        <span className="font-medium">{selectedTier.name}</span>
      </div>
      <div className="flex justify-between mb-2">
        <span className="text-neutral-400">Billing</span>
        <span>Monthly</span>
      </div>
      <div className="flex justify-between font-medium text-lg pt-2 border-t border-neutral-800">
        <span>Total</span>
        <span>{paymentMethod === 'sol' ? `${selectedTier.priceSol} SOL` : `${selectedTier.priceUsdc} USDC`}</span>
      </div>
    </div>
  );

  // Mobile QR code payment tab
  const renderMobilePaymentContent = () => {
    if (mobilePaymentStatus === 'pending' && qrValue) {
      return (
        <div className="flex flex-col items-center py-2">
          <div className="text-center mb-4">
            <h3 className="text-sm font-medium mb-1">Scan with Phantom wallet</h3>
            <p className="text-xs text-neutral-400">
              Open Phantom mobile app and scan this code to connect and pay 
            </p>
          </div>
          
          <div className="bg-white p-3 rounded-xl mb-4 flex items-center justify-center">
            {/* Direct QR code implementation with Google Charts API */}
            <div className="flex flex-col items-center">
              <a 
                href={qrValue} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-neutral-400 mb-2"
              >
                Open in Wallet App
              </a>
              
              <img 
                src={`https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(qrValue)}&chs=250x250&choe=UTF-8&chld=L|0`}
                alt="QR Code for payment" 
                width={250} 
                height={250}
                style={{ display: 'block' }}
              />
            </div>
          </div>
          
          <div className="text-center mb-2">
            <p className="text-xs font-medium text-[#E6E2DA]">Payment for {selectedTier.name} Tier</p>
            <p className="text-xs text-neutral-400">{paymentMethod === 'sol' ? `${selectedTier.priceSol} SOL` : `${selectedTier.priceUsdc} USDC`}</p>
          </div>
          
          <div className="mb-4 w-full text-center">
            <p className="text-xs text-neutral-500 mb-2">
              Need help? Make sure to:
            </p>
            <ul className="text-xs text-neutral-400 mb-3 text-left list-disc list-inside">
              <li>Open Phantom mobile app first</li>
              <li>Tap the scan button in Phantom</li>
              <li>Point your camera at this QR code</li>
            </ul>
          </div>
          
          <div className="px-2 mb-4 w-full">
            <PaymentMethodSelector />
          </div>
          
          <div className="text-center text-xs text-neutral-400 mb-2">
            After scanning, follow the instructions on your mobile device to complete the payment
          </div>
          
          <Button 
            variant="ghost" 
            onClick={handleRestartQrCode}
            className="text-neutral-400 hover:text-white text-sm flex items-center gap-1"
            size="sm"
          >
            <Clock className="h-3 w-3 mr-1" />
            Refresh QR code
          </Button>
        </div>
      );
    }
    
    if (mobilePaymentStatus === 'completed') {
      return (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="rounded-full bg-green-900/20 p-3 mb-4">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">Payment Successful</h3>
          <p className="text-neutral-400 text-center">
            Thank you for subscribing to VynaAI {selectedTier.name}!
            <br />
            Your subscription is being activated.
          </p>
        </div>
      );
    }
    
    if (mobilePaymentStatus === 'expired') {
      return (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="rounded-full bg-amber-900/20 p-3 mb-4">
            <Clock className="h-10 w-10 text-amber-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">QR Code Expired</h3>
          <p className="text-neutral-400 text-center mb-4">
            The payment QR code has expired. Please generate a new one.
          </p>
          <Button 
            onClick={handleRestartQrCode}
            className="bg-[#E6E2DA] hover:bg-[#D6D2CA] text-black"
          >
            Generate New QR Code
          </Button>
        </div>
      );
    }
    
    if (mobilePaymentStatus === 'error') {
      return (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="rounded-full bg-red-900/20 p-3 mb-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">Error</h3>
          <p className="text-neutral-400 text-center mb-4">
            {error || 'There was an error generating the payment QR code.'}
          </p>
          <Button 
            onClick={handleRestartQrCode}
            className="bg-[#E6E2DA] hover:bg-[#D6D2CA] text-black"
          >
            Try Again
          </Button>
        </div>
      );
    }
    
    // Default is loading state
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-10 w-10 animate-spin text-[#E6E2DA]" />
      </div>
    );
  };

  // Get content based on status for browser tab
  const renderBrowserPaymentContent = () => {
    // Processing state
    if (status === 'processing') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-16 w-16 animate-spin text-[#E6E2DA] mb-4" />
          <h3 className="text-xl font-medium mb-2">Processing Payment</h3>
          <p className="text-neutral-400 text-center">
            Please confirm the transaction in your {wallet?.name} wallet.
            <br />
            Do not close this window.
          </p>
        </div>
      );
    }

    // Error state
    if (status === 'error') {
      return (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="rounded-full bg-red-900/20 p-3 mb-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">Transaction Failed</h3>
          <p className="text-neutral-400 text-center mb-4">
            {error || 'There was an error processing your payment. Please try again.'}
          </p>
          <Button onClick={() => setStatus('idle')} className="mt-2">
            Try Again
          </Button>
        </div>
      );
    }

    // Success state
    if (status === 'success') {
      return (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="rounded-full bg-green-900/20 p-3 mb-4">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">Payment Successful</h3>
          <p className="text-neutral-400 text-center">
            Thank you for subscribing to VynaAI {selectedTier.name}!
            <br />
            Your subscription is being activated.
          </p>
        </div>
      );
    }

    // Default/idle state - payment form
    return (
      <>
        <div className="space-y-4 py-2">
          <PlanSummary />
          <PaymentMethodSelector />

          {error && (
            <div className="rounded-lg bg-red-900/20 p-3 text-red-500 text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {!wallet && (
            <div className="rounded-lg bg-amber-900/20 p-3 text-amber-400 text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>Please connect your wallet to continue with payment.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-neutral-700 text-white hover:bg-neutral-800 hover:text-white"
            disabled={isPending || isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!wallet || isPending || isProcessing}
            className="bg-[#E6E2DA] hover:bg-[#D6D2CA] text-black"
          >
            {isPending || isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${paymentMethod === 'sol' ? selectedTier.priceSol + ' SOL' : selectedTier.priceUsdc + ' USDC'}`
            )}
          </Button>
        </DialogFooter>
      </>
    );
  };

  // Main content render function
  const renderContent = () => {
    return (
      <div className="space-y-4 py-2">
        <PlanSummary />
        
        <Tabs defaultValue={isMobile ? 'mobile' : 'browser'} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="browser" className="flex gap-2 items-center">
              <TabletSmartphone className="h-4 w-4" />
              <span>Browser Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex gap-2 items-center">
              <QrCode className="h-4 w-4" />
              <span>Mobile Wallet</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="browser" className="mt-0 space-y-4">
            {renderBrowserPaymentContent()}
          </TabsContent>
          
          <TabsContent value="mobile" className="mt-0 space-y-4">
            {renderMobilePaymentContent()}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Determine the title based on the active tab and status
  const getDialogTitle = () => {
    if (activeTab === 'browser') {
      if (status === 'processing') return 'Processing Payment';
      if (status === 'success') return 'Payment Successful';
      if (status === 'error') return 'Payment Failed';
      return 'Complete Your Purchase';
    } else {
      if (mobilePaymentStatus === 'completed') return 'Payment Successful';
      if (mobilePaymentStatus === 'expired') return 'QR Code Expired';
      if (mobilePaymentStatus === 'error') return 'Error';
      if (mobilePaymentStatus === 'pending') return 'Scan QR Code';
      return 'Mobile Payment';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          {(activeTab === 'browser' && status === 'idle') || 
           (activeTab === 'mobile' && mobilePaymentStatus === 'idle') ? (
            <DialogDescription>
              Subscribe to VynaAI {selectedTier.name} using your {activeTab === 'browser' ? 'connected' : 'mobile'} wallet
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}