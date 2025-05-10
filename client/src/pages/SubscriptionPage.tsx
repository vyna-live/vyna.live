import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  ArrowLeft, 
  Check, 
  ChevronRight, 
  Loader2, 
  Star, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletConnectionModal from '@/components/wallet/WalletConnectionModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Subscription types and pricing
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

const subscriptionTiers: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    headline: 'Basic access to Vyna',
    description: 'Perfect for casual users who want to try out Vyna features.',
    priceSol: 0,
    priceUsdc: 0,
    features: [
      'Limited AI assistant usage',
      'Basic note-taking features',
      'Standard livestreaming capabilities',
      'Community access',
      'Standard teleprompter features'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    headline: 'Enhanced features for power users',
    description: 'Unlock premium features for a smooth, comprehensive experience.',
    priceSol: 0.25,
    priceUsdc: 5,
    mostPopular: true,
    features: [
      'Unlimited AI assistant usage',
      'Advanced note-taking with rich media',
      'Premium livestreaming features',
      'Priority community support',
      'Advanced teleprompter with customization',
      'Longer session recordings',
      'No watermarks on downloads',
      'Extended storage for notes and streams',
      'Early access to new features'
    ]
  },
  {
    id: 'team',
    name: 'Team',
    headline: 'Collaborate with your team',
    description: 'Perfect for creators, streamers, and teams working together.',
    priceSol: 1.25,
    priceUsdc: 25,
    features: [
      'All Pro features included',
      'Team collaboration tools',
      'Shared workspaces',
      'Administrative controls',
      'Team analytics dashboard',
      'Dedicated support channel',
      'Custom branding options',
      'API access for integrations',
      'SLA guarantees'
    ]
  }
];

const SubscriptionPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { connected } = useWallet();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Component state
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'sol' | 'usdc'>('sol');
  
  // Handle subscription selection
  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
    
    // If it's the free tier, no payment needed
    if (tierId === 'free') {
      toast({
        title: 'Free tier selected',
        description: 'You are already on the free tier.',
      });
      return;
    }
    
    // If wallet not connected, open modal
    if (!connected) {
      setIsWalletModalOpen(true);
    } else {
      // Otherwise show payment confirmation (in a real app, you would process the payment)
      handlePaymentConfirmation(tierId);
    }
  };
  
  // Handle successful wallet connection
  const handleWalletConnected = () => {
    setIsWalletModalOpen(false);
    
    if (selectedTier) {
      // Proceed to payment confirmation after wallet connected
      handlePaymentConfirmation(selectedTier);
    }
  };
  
  // Simulate payment processing
  const handlePaymentConfirmation = (tierId: string) => {
    // In a real implementation, you would:
    // 1. Create a Solana transaction
    // 2. Request user approval via their wallet
    // 3. Submit and confirm the transaction
    // 4. Update the user's subscription status on your backend
    
    setIsProcessingPayment(true);
    
    // Simulate transaction processing time
    setTimeout(() => {
      setIsProcessingPayment(false);
      
      // Show success message
      toast({
        title: 'Subscription activated!',
        description: `Your ${tierId === 'pro' ? 'Pro' : 'Team'} subscription has been activated.`,
      });
      
      // Redirect to dashboard or relevant page
      setLocation('/dashboard');
    }, 2000);
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with back button */}
      <header className="p-4 border-b border-[#333333]">
        <div className="container mx-auto">
          <button 
            onClick={() => setLocation('/')} 
            className="flex items-center gap-2 text-[#DDDDDD] hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </button>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Subscription Plans</h1>
          <p className="text-[#BBBBBB] mb-8">Choose the plan that works best for you and your needs.</p>
          
          {/* Subscription Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {subscriptionTiers.map((tier) => (
              <div 
                key={tier.id}
                className={`
                  bg-[#1A1A1A] rounded-xl overflow-hidden border-2 
                  ${tier.mostPopular ? 'border-[#DCC5A2]' : 'border-[#333333]'}
                  ${selectedTier === tier.id ? 'ring-2 ring-[#DCC5A2]' : ''}
                  transform transition-transform hover:scale-[1.02]
                `}
              >
                {tier.mostPopular && (
                  <div className="bg-[#DCC5A2] text-[#121212] py-1 px-4 text-center text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1 flex items-center">
                    {tier.name}
                    {tier.id === 'pro' && <Star className="ml-2 h-4 w-4 text-[#DCC5A2]" />}
                  </h3>
                  <p className="text-[#BBBBBB] mb-4">{tier.headline}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline mb-1">
                      <span className="text-3xl font-bold">
                        {tier.priceSol === 0 ? 'Free' : `${tier.priceSol} SOL`}
                      </span>
                      {tier.priceSol > 0 && (
                        <span className="text-[#999999] ml-2 text-sm">
                          or {tier.priceUsdc} USDC
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#999999]">
                      {tier.id === 'free' ? 'Always free' : 'per month'}
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-sm text-[#BBBBBB] mb-4">{tier.description}</p>
                    
                    <ul className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-[#DCC5A2] mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => handleSelectTier(tier.id)}
                    disabled={isProcessingPayment || (tier.id === 'free' && user?.role !== 'pro')}
                    className={`
                      w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2
                      ${tier.id === 'free' 
                        ? 'bg-[#333333] text-white hover:bg-[#444444]' 
                        : 'bg-[#DCC5A2] text-[#121212] hover:bg-[#C6B190]'}
                      transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {isProcessingPayment && selectedTier === tier.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {tier.id === 'free' 
                            ? 'Current Plan' 
                            : `Upgrade to ${tier.name}`}
                        </span>
                        {tier.id !== 'free' && <ChevronRight className="h-4 w-4" />}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Additional Info */}
          <div className="bg-[#1A1A1A] rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Sparkles className="h-5 w-5 text-[#DCC5A2] mr-2" />
              Why Upgrade to Pro?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium mb-2">Enhanced Features</h4>
                <p className="text-[#BBBBBB] mb-4">
                  Unlock the full potential of Vyna with unlimited access to AI assistant, 
                  advanced teleprompter customization, and premium livestreaming capabilities.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-2">Seamless Experience</h4>
                <p className="text-[#BBBBBB] mb-4">
                  Enjoy a distraction-free experience with no limits on storage, 
                  longer session recordings, and no watermarks on exported content.
                </p>
              </div>
            </div>
            
            <div className="bg-[#222222] rounded-lg p-4 flex items-start mt-4">
              <AlertCircle className="h-5 w-5 text-[#DCC5A2] mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#BBBBBB]">
                Subscription payments are processed securely through the Solana blockchain. 
                You can cancel your subscription at any time from your account settings.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSuccess={handleWalletConnected}
      />
    </div>
  );
};

export default SubscriptionPage;