import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Container } from '../components/Container';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle, Loader2, Star, ChevronDown, ChevronUp, Home } from 'lucide-react';
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
  const [detailTier, setDetailTier] = useState<string>('free');

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
      paymentMethod: 'usdc'; 
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
    paymentMethod: 'usdc'
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
        <div className="flex justify-center mb-4">
          <Button 
            variant="outline" 
            className="border-[#333] hover:bg-[#252525]"
            onClick={() => window.location.href = '/'}
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
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
                    <span className="text-3xl font-bold">${tier.priceUsdc}</span>
                    <span className="ml-2 text-neutral-400">USDC / month</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">USDC operates with 6 decimal places precision</p>

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
                      <div className="flex flex-col gap-2">
                        <Button className="w-full bg-green-600 hover:bg-green-700 cursor-default text-white" disabled>
                          Current Plan
                        </Button>
                        <Button
                          onClick={() => setDetailTier(tier.id)}
                          className="w-full bg-transparent hover:bg-neutral-800 text-white border border-neutral-700"
                        >
                          View Details
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {tier.id !== 'free' ? (
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
                        ) : (
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white cursor-default"
                            disabled
                          >
                            Free Plan
                          </Button>
                        )}
                        <Button
                          onClick={() => setDetailTier(tier.id)}
                          className="w-full bg-transparent hover:bg-neutral-800 text-white border border-neutral-700"
                        >
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Plan Details */}
        <div className="mt-12 p-6 rounded-lg border border-neutral-800 bg-neutral-900">
          {tiers?.map((tier) => (
            tier.id === detailTier && (
              <div key={`detail-${tier.id}`} className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="w-full">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        {tier.name} Plan
                        {tier.id === 'max' && <Star className="h-4 w-4 text-yellow-500" />}
                      </h3>
                      <p className="text-neutral-400 mt-1">{tier.headline}</p>
                    </div>
                    
                    <div className="hidden sm:flex items-center gap-2">
                      {tier.id !== 'free' && (
                        <div className="text-right">
                          <div className="text-xl font-semibold">${tier.priceUsdc} USDC</div>
                          <div className="text-xs text-neutral-400">per month</div>
                        </div>
                      )}
                      
                      {isTierActive(tier.id) ? (
                        <Button
                          variant="ghost"
                          className="text-green-500 hover:text-green-400 cursor-default"
                          disabled
                        >
                          <Check className="h-4 w-4 mr-1.5" />
                          Current Plan
                        </Button>
                      ) : tier.id !== 'free' && (
                        <Button
                          onClick={() => handleSelectTier(tier)}
                          className="bg-[#E6E2DA] hover:bg-[#D6D2CA] text-black"
                        >
                          Subscribe
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-[#E6E2DA] border-b border-neutral-800 pb-2">AI Chat Features</h4>
                      <ul className="space-y-2.5">
                        {tier.features.filter(f => 
                          f.includes('AI model') || 
                          f.includes('message') || 
                          f.includes('chat') || 
                          f.includes('response') ||
                          f.includes('visualization')
                        ).map((feature, index) => (
                          <li key={`chat-${index}`} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 text-[#E6E2DA] border-b border-neutral-800 pb-2">Notepad Features</h4>
                      <ul className="space-y-2.5">
                        {tier.features.filter(f => 
                          f.includes('note') || 
                          f.includes('format') || 
                          f.includes('text') || 
                          f.includes('embed') ||
                          f.includes('tag') ||
                          f.includes('search') ||
                          f.includes('export')
                        ).map((feature, index) => (
                          <li key={`notepad-${index}`} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 text-[#E6E2DA] border-b border-neutral-800 pb-2">Additional Benefits</h4>
                    <ul className="space-y-2.5 mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                      {tier.features.filter(f => 
                        f.includes('support') || 
                        f.includes('reward') || 
                        f.includes('theme') || 
                        f.includes('API') ||
                        f.includes('dashboard') ||
                        f.includes('white-label') ||
                        f.includes('training')
                      ).map((feature, index) => (
                        <li key={`benefit-${index}`} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Mobile View Subscription Button */}
                  <div className="sm:hidden mt-6">
                    {isTierActive(tier.id) ? (
                      <Button
                        variant="ghost"
                        className="w-full text-green-500 hover:text-green-400 cursor-default border border-green-900/30"
                        disabled
                      >
                        <Check className="h-4 w-4 mr-1.5" />
                        Current Plan
                      </Button>
                    ) : tier.id !== 'free' && (
                      <Button
                        onClick={() => handleSelectTier(tier)}
                        className="w-full bg-[#E6E2DA] hover:bg-[#D6D2CA] text-black"
                      >
                        Subscribe to {tier.name} - ${tier.priceUsdc} USDC/month
                      </Button>
                    )}
                  </div>
                  
                </div>
              </div>
            )
          ))}
        </div>

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