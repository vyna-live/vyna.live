import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { 
  Check, 
  X, 
  ArrowRight, 
  Crown, 
  ChevronRight,
  Wallet,
  CreditCard 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Header from '@/components/Header';

// Mock subscription tiers
const subscriptionTiers = [
  {
    id: 'basic',
    name: 'Basic',
    headline: 'For casual streamers',
    description: 'Get started with the essential features to enhance your streams',
    priceSol: 0.05,
    priceUsdc: 5,
    features: [
      'AI Assistant with Standard Models',
      'Up to 5 saved sessions per month',
      'Basic streaming features',
      'Standard quality video'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    headline: 'For growing creators',
    description: 'Take your content to the next level with advanced features',
    priceSol: 0.25, 
    priceUsdc: 25,
    features: [
      'Advanced AI with premium models',
      'Unlimited saved sessions',
      'Priority streaming slots',
      'HD quality video',
      'Custom stream branding',
      'Priority customer support'
    ],
    mostPopular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    headline: 'For professional content creators',
    description: 'Unlock the full potential with our premium offering',
    priceSol: 1,
    priceUsdc: 100,
    features: [
      'Exclusive AI models access',
      'Unlimited everything',
      '4K video quality',
      'Advanced analytics dashboard',
      'White-labeled solution',
      'Dedicated account manager',
      'Custom integration support'
    ]
  }
];

interface SubscriptionTier {
  id: string;
  name: string;
  headline: string;
  description: string;
  priceSol: number;
  priceUsdc: number;
  features: string[];
  mostPopular?: boolean;
}

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleSubscribe = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setIsConnectModalOpen(true);
  };

  const handleConnectWallet = () => {
    setIsConnectModalOpen(false);
    if (selectedTier) {
      setIsPaymentModalOpen(true);
    }
  };

  const handleInitiatePayment = () => {
    setIsProcessingPayment(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsPaymentComplete(true);
    }, 2000);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    toast({
      title: "Subscription activated!",
      description: `Your ${selectedTier?.name} plan is now active.`,
    });
    
    // Navigate back to home after successful subscription
    setTimeout(() => {
      setLocation('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header username="User" />
      
      <div className="container mx-auto py-12 px-4 flex-grow">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Upgrade your Vyna Live experience with enhanced AI capabilities, 
              premium features, and priority support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subscriptionTiers.map((tier) => (
              <Card 
                key={tier.id} 
                className={`border border-[#cdbcab]/30 ${
                  tier.mostPopular 
                    ? 'relative bg-gradient-to-br from-[#efe9e1]/30 to-[#cdbcab]/20' 
                    : 'bg-[#0c0c0c]'
                }`}
              >
                {tier.mostPopular && (
                  <div className="absolute top-0 right-0 bg-[#A67D44] text-black text-xs font-medium px-3 py-1 rounded-bl-md rounded-tr-md">
                    MOST POPULAR
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-bold">
                    {tier.name}
                    {tier.mostPopular && <Crown className="ml-2 h-5 w-5 text-[#A67D44]" />}
                  </CardTitle>
                  <CardDescription className="text-base text-gray-400">{tier.headline}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{tier.priceSol} SOL</span>
                    <span className="text-gray-400 ml-2">/ month</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    (approximately ${tier.priceUsdc} USD)
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm mb-6">{tier.description}</p>
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    onClick={() => handleSubscribe(tier)}
                    className={`w-full ${
                      tier.mostPopular 
                        ? 'bg-[#A67D44] hover:bg-[#8A6836] text-black' 
                        : 'bg-[#1f1f1f] hover:bg-[#2a2a2a]'
                    }`}
                  >
                    <span>Subscribe</span>
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-16 bg-[#0c0c0c] border border-[#333] rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Subscription FAQs</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">How do subscriptions work?</h4>
                <p className="text-gray-400 text-sm">
                  Subscriptions are paid monthly using Solana cryptocurrency. Once your payment is confirmed,
                  your account is instantly upgraded with the selected plan's features.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Can I upgrade or downgrade my plan?</h4>
                <p className="text-gray-400 text-sm">
                  Yes, you can change your subscription at any time. When upgrading, you'll pay the prorated 
                  difference. When downgrading, your current plan will remain active until the end of the billing cycle.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">What payment methods are accepted?</h4>
                <p className="text-gray-400 text-sm">
                  We currently accept Solana (SOL) cryptocurrency. You'll need a Solana wallet such as Phantom
                  or Solflare to make payments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Wallet Connection Modal */}
      <Dialog open={isConnectModalOpen} onOpenChange={(open) => !open && setIsConnectModalOpen(false)}>
        <DialogContent className="sm:max-w-md bg-[#0c0c0c] border-[#cdbcab]/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Connect Your Wallet</DialogTitle>
            <DialogDescription className="text-gray-400">
              Connect your Solana wallet to continue with the subscription process.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-4">
            <div className="mb-6 w-16 h-16 bg-[#1f1f1f] rounded-full flex items-center justify-center">
              <Wallet className="h-8 w-8 text-[#A67D44]" />
            </div>

            <div className="flex flex-col items-center space-y-4 w-full">
              <p className="text-center text-sm">
                You'll need a Solana wallet to make payments. 
                This will allow you to securely pay for your subscription using SOL.
              </p>
              
              <Button 
                onClick={handleConnectWallet}
                className="w-full bg-[#A67D44] hover:bg-[#8A6836] text-black"
              >
                Connect Wallet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={(open) => !open && setIsPaymentModalOpen(false)}>
        <DialogContent className="sm:max-w-md bg-[#0c0c0c] border-[#cdbcab]/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Complete Your Subscription</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedTier && `You're subscribing to the ${selectedTier.name} plan.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col py-4">
            {isProcessingPayment ? (
              <div className="flex flex-col items-center">
                <div className="mb-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A67D44] mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium mb-1">Processing Payment</h3>
                  <p className="text-sm text-gray-400">Please wait while we process your transaction...</p>
                </div>
                
                <div className="w-full bg-[#222] rounded-full h-2.5">
                  <div className="bg-[#A67D44] h-2.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            ) : isPaymentComplete ? (
              <div className="flex flex-col items-center text-center">
                <Check className="mx-auto h-10 w-10 text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-1">Payment Successful!</h3>
                <p className="text-sm text-gray-400">Your subscription has been activated</p>
                
                <Button 
                  onClick={handlePaymentSuccess}
                  className="mt-6 w-full bg-[#A67D44] hover:bg-[#8A6836] text-black"
                >
                  Continue
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-[#1f1f1f] rounded-full flex items-center justify-center">
                    <CreditCard className="h-8 w-8 text-[#A67D44]" />
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="bg-[#121212] p-4 rounded-md">
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-400">Subscription</span>
                      <span>{selectedTier?.name} Plan</span>
                    </div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-400">Duration</span>
                      <span>1 Month</span>
                    </div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-400">Wallet</span>
                      <span className="truncate max-w-[180px]">vyna...wallet</span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-[#333] flex justify-between items-center">
                      <span className="font-medium">Total</span>
                      <div className="text-right">
                        <div className="font-bold text-lg">{selectedTier?.priceSol} SOL</div>
                        <div className="text-xs text-gray-400">≈ ${selectedTier?.priceUsdc} USD</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleInitiatePayment}
                  className="w-full bg-[#A67D44] hover:bg-[#8A6836] text-black"
                >
                  Confirm Payment
                </Button>
                
                <div className="mt-4 text-xs text-gray-500 text-center">
                  By confirming, you agree to make a payment of {selectedTier?.priceSol} SOL from your connected wallet.
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}