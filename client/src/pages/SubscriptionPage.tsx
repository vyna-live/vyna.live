import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Check, 
  X, 
  ArrowRight, 
  Crown, 
  ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import WalletConnectionModal from '@/components/wallet/WalletConnectionModal';
import PaymentModal from '@/components/wallet/PaymentModal';
import { subscriptionTiers, type SubscriptionTier } from '@/services/subscriptionService';
import Header from '@/components/Header';

export default function SubscriptionPage() {
  const { toast } = useToast();
  const { connected } = useWallet();
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);

  const handleSubscribe = (tier: SubscriptionTier) => {
    if (!connected) {
      setSelectedTier(tier);
      setIsWalletModalOpen(true);
    } else {
      setSelectedTier(tier);
      setIsPaymentModalOpen(true);
    }
  };

  const handleWalletConnected = () => {
    setIsWalletModalOpen(false);
    if (selectedTier) {
      setIsPaymentModalOpen(true);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    toast({
      title: "Subscription activated!",
      description: `Your ${selectedTier?.name} plan is now active.`,
    });
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
      <WalletConnectionModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)}
        onSuccess={handleWalletConnected}
      />
      
      {/* Payment Modal */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        subscriptionTier={selectedTier}
      />
    </div>
  );
}