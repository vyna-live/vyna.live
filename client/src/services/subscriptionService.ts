import { apiRequest } from '@/lib/queryClient';

// Subscription tiers
export interface SubscriptionTier {
  id: string;
  name: string;
  headline: string;
  description: string;
  priceSol: number;
  priceUsdc: number;
  features: string[];
  mostPopular?: boolean;
}

// Transaction type
export interface Transaction {
  id: number;
  signature: string;
  amount: string;
  currency: 'sol' | 'usdc';
  status: 'pending' | 'confirmed' | 'failed' | 'timeout';
  createdAt: string;
  confirmedAt?: string;
}

// Subscription status
export interface Subscription {
  id: number;
  status: 'active' | 'cancelled' | 'expired' | 'grace_period';
  tier: string;
  activatedAt: string;
  expiresAt: string;
  gracePeriodEnds?: string;
  renewalEnabled: boolean;
  transactions?: Transaction[];
}

// Default subscription tiers
export const subscriptionTiers: SubscriptionTier[] = [
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

/**
 * Fetch subscription tiers from the API
 */
export async function fetchSubscriptionTiers(): Promise<SubscriptionTier[]> {
  try {
    const response = await apiRequest('GET', '/api/subscription/tiers');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    return subscriptionTiers; // Fall back to default tiers
  }
}

/**
 * Get user's subscription
 */
export async function getUserSubscription(): Promise<
  | { status: 'none'; tier: 'free'; message: string }
  | Subscription
> {
  try {
    const response = await apiRequest('GET', '/api/subscription');
    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
}

/**
 * Create a new subscription
 */
export async function createSubscription(
  tierId: string,
  paymentMethod: 'sol' | 'usdc',
  amount: string,
  transactionSignature: string
): Promise<{ subscription: Subscription; transaction: Transaction }> {
  try {
    const response = await apiRequest('POST', '/api/subscription', {
      tierId,
      paymentMethod,
      amount,
      transactionSignature,
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: number): Promise<void> {
  try {
    await apiRequest('DELETE', `/api/subscription/${subscriptionId}`);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Toggle auto-renewal for a subscription
 */
export async function toggleSubscriptionRenewal(
  subscriptionId: number,
  renewalEnabled: boolean
): Promise<void> {
  try {
    await apiRequest('PATCH', `/api/subscription/${subscriptionId}/renewal`, {
      renewalEnabled,
    });
  } catch (error) {
    console.error('Error toggling subscription renewal:', error);
    throw error;
  }
}

/**
 * Check if a feature is available for a given subscription tier
 */
export function isFeatureAvailable(
  feature: string,
  subscriptionTier: string
): boolean {
  // Define feature availability by tier
  const featureAvailability: Record<string, string[]> = {
    free: ['Basic AI Assistant', 'Standard video quality', 'Public streams'],
    basic: [
      'AI Assistant with Standard Models',
      'Up to 5 saved sessions per month',
      'Basic streaming features',
      'Standard quality video',
    ],
    pro: [
      'Advanced AI with premium models',
      'Unlimited saved sessions',
      'Priority streaming slots',
      'HD quality video',
      'Custom stream branding',
      'Priority customer support',
    ],
    enterprise: [
      'Exclusive AI models access',
      'Unlimited everything',
      '4K video quality',
      'Advanced analytics dashboard',
      'White-labeled solution',
      'Dedicated account manager',
      'Custom integration support',
    ],
  };

  // Check if the feature is available for the given tier
  return featureAvailability[subscriptionTier]?.includes(feature) ?? false;
}

/**
 * Format time remaining for a subscription
 */
export function formatSubscriptionTimeRemaining(
  expiresAt: string | Date
): string {
  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expirationDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'Expired';
  }
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
  } else {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
  }
}