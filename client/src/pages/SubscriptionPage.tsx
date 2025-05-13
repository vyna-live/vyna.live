import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Container } from '../components/Container';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle, Loader2, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  SubscriptionTier,
  fetchSubscriptionTiers,
  getUserSubscription,
  createSubscription,
  formatSubscriptionTimeRemaining
} from '@/services/subscriptionService';
import { useSolanaWallet } from '@/contexts/SolanaWalletProvider';
import { WalletConnectionModal } from '@/components/wallet/WalletConnectionModal';
import { PaymentModal } from '@/components/wallet/PaymentModal';
import { queryClient } from '@/lib/queryClient';

export default function SubscriptionPage() {
  const { wallet } = useSolanaWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({});

  // Fetch subscription tiers
  const { 
    data: tiers, 
    isLoading: isLoadingTiers, 
    error: tiersError 
  } = useQuery({
    queryKey: ['subscriptionTiers'],
    queryFn: fetchSubscriptionTiers,
  });

  // Fetch user's subscription
  const { 
    data: subscription, 
    isLoading: isLoadingSubscription 
  } = useQuery({
    queryKey: ['userSubscription'],
    queryFn: getUserSubscription,
    enabled: !!wallet, // Only run if wallet is connected
  });

  // Create subscription mutation
  const { 
    mutate: createSubscriptionMutation,
    isPending: isSubscribing
  } = useMutation({
    mutationFn: (variables: { 
      tierId: string; 
      paymentMethod: 'sol' | 'usdc'; 
      amount: string; 
      transactionSignature: string;
    }) => createSubscription(
      variables.tierId,
      variables.paymentMethod,
      variables.amount,
      variables.transactionSignature
    ),
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      setShowPaymentModal(false);
    },
  });

  // Handler for selecting a tier
  const handleSelectTier = (tier: SubscriptionTier) => {
    if (!wallet) {
      setShowWalletModal(true);
      setSelectedTier(tier);
    } else {
      setSelectedTier(tier);
      setShowPaymentModal(true);
    }
  };

  // Handler for successful payment
  const handlePaymentSuccess = (
    signature: string,
    amount: string,
    paymentMethod: 'sol' | 'usdc'
  ) => {
    if (selectedTier) {
      createSubscriptionMutation({
        tierId: selectedTier.id,
        paymentMethod,
        amount,
        transactionSignature: signature,
      });
    }
  };

  // Handler for successful wallet connection
  const handleWalletConnectSuccess = () => {
    if (selectedTier) {
      setShowPaymentModal(true);
    }
  };

  // Reset selected tier when subscription changes
  useEffect(() => {
    if (subscription && subscription.status === 'active') {
      setSelectedTier(null);
    }
  }, [subscription]);

  // Helper function to check if a tier is active
  const isTierActive = (tierId: string) => {
    if (!subscription || subscription.status === 'none') return false;
    return subscription.tier === tierId && subscription.status === 'active';
  };

  return (
    <Container className="py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Upgrade Your Experience
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Choose the plan that's right for you and take your streaming experience to the next level
            with advanced features and AI-powered tools.
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscription && subscription.status !== 'none' && (
          <div className="mb-10 p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-medium">
                  Your Subscription: <span className="text-[#E6E2DA]">{subscription.tier.toUpperCase()}</span>
                </h2>
                <p className="text-neutral-400">
                  Status: <span className={subscription.status === 'active' ? 'text-green-500' : 'text-yellow-500'}>
                    {subscription.status.replace('_', ' ').toUpperCase()}
                  </span>
                  {subscription.status === 'active' && subscription.expiresAt && (
                    <span className="ml-2">({formatSubscriptionTimeRemaining(subscription.expiresAt)})</span>
                  )}
                </p>
              </div>
              {subscription.status === 'active' && (
                <Button
                  variant="outline"
                  className="border-neutral-700 text-white hover:bg-neutral-800 hover:text-white"
                >
                  Manage Subscription
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {tiersError && (
          <div className="mb-10 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-500">Error loading subscription plans</h3>
              <p className="text-red-400 text-sm mt-1">
                There was a problem loading the subscription plans. Please try again later.
              </p>
            </div>
          </div>
        )}

        {/* Pricing Tiers */}
        {isLoadingTiers ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {tiers?.map((tier) => (
              <div
                key={tier.id}
                className={`rounded-lg overflow-hidden border ${
                  tier.mostPopular
                    ? 'border-[#E6E2DA] bg-black relative'
                    : 'border-neutral-800 bg-neutral-900'
                }`}
              >
                {tier.mostPopular && (
                  <div className="absolute top-0 inset-x-0 bg-[#E6E2DA] text-black text-xs font-bold py-1 px-2 text-center">
                    MOST POPULAR
                  </div>
                )}
                <div className={`p-6 ${tier.mostPopular ? 'pt-9' : ''}`}>
                  <h3 className="text-xl font-bold flex items-center gap-1.5">
                    {tier.name}
                    {tier.id === 'enterprise' && <Star className="h-4 w-4 text-yellow-500" />}
                  </h3>
                  <p className="text-neutral-400 mt-1">{tier.headline}</p>

                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-bold">{tier.priceSol} SOL</span>
                    <span className="ml-2 text-neutral-400">/ month</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">or {tier.priceUsdc} USDC</p>

                  <div className="mt-6">
                    <div className="feature-categories">
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">AI Chat</h4>
                        <ul className="space-y-2">
                          {tier.features.slice(0, 3).map((feature, index) => (
                            <li key={`chat-${index}`} className="flex items-start gap-2">
                              <Check className={`h-5 w-5 ${tier.mostPopular ? 'text-[#E6E2DA]' : 'text-green-500'} mt-0.5 flex-shrink-0`} />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Notepad</h4>
                        <ul className="space-y-2">
                          {tier.features.slice(3, 6).map((feature, index) => (
                            <li key={`notepad-${index}`} className="flex items-start gap-2">
                              <Check className={`h-5 w-5 ${tier.mostPopular ? 'text-[#E6E2DA]' : 'text-green-500'} mt-0.5 flex-shrink-0`} />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {tier.features.length > 6 && (
                      <>
                        {expandedTiers[tier.id] && (
                          <div className="mt-3 pt-3 border-t border-neutral-800">
                            <div className="mb-3">
                              <h4 className="font-medium mb-2">More Features</h4>
                              <ul className="space-y-2">
                                {tier.features.slice(6).map((feature, index) => (
                                  <li key={`more-${index}`} className="flex items-start gap-2">
                                    <Check className={`h-5 w-5 ${tier.mostPopular ? 'text-[#E6E2DA]' : 'text-green-500'} mt-0.5 flex-shrink-0`} />
                                    <span className="text-sm">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => setExpandedTiers(prev => ({...prev, [tier.id]: !prev[tier.id]}))}
                          className="w-full mt-2 py-1.5 text-xs flex items-center justify-center gap-1 text-neutral-400 hover:text-white rounded-md border border-neutral-800 hover:border-neutral-700 transition-colors"
                        >
                          {expandedTiers[tier.id] ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" />
                              Show More Features
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>

                  <div className="mt-8">
                    {isTierActive(tier.id) ? (
                      <Button className="w-full bg-green-600 hover:bg-green-700 cursor-default text-white" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSelectTier(tier)}
                        disabled={isSubscribing}
                        className={`w-full ${
                          tier.mostPopular
                            ? 'bg-[#E6E2DA] hover:bg-[#D6D2CA] text-black'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                        }`}
                      >
                        {isSubscribing && selectedTier?.id === tier.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Subscribe'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No need for separate Free tier section as it's included in the tier list now */}

        {/* Privacy note */}
        <div className="mt-8 text-center text-sm text-neutral-500 max-w-2xl mx-auto">
          <p>
            Your privacy and security are our priorities. All transactions are secured through
            the Solana blockchain, and we never store your private keys.
          </p>
        </div>
      </div>

      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={handleWalletConnectSuccess}
      />

      {/* Payment Modal */}
      {selectedTier && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          selectedTier={selectedTier}
          onSuccess={handlePaymentSuccess}
          isPending={isSubscribing}
        />
      )}
    </Container>
  );
}