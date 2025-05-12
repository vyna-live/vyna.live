import { apiRequest } from '@/lib/queryClient';

// Subscription Tier interface
export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  headline: string;
  priceSol: number;
  priceUsdc: number;
  features: string[];
  mostPopular?: boolean;
}

// User Subscription interface
export interface UserSubscription {
  id: number;
  userId: number;
  tier: string;
  status: 'none' | 'active' | 'grace_period' | 'expired' | 'canceled';
  startDate: string;
  expiresAt: string | null;
  gracePeriodEnd: string | null;
  autoRenew: boolean;
  lastPayment: {
    amount: string;
    currency: string;
    date: string;
    transactionId: string;
  } | null;
}

// Fetch subscription tiers from API
export async function fetchSubscriptionTiers(): Promise<SubscriptionTier[]> {
  try {
    const response = await apiRequest('GET', '/api/subscription/tiers');
    
    // If we're in development mode and the API isn't fully implemented,
    // return mock data
    if (!response.ok && process.env.NODE_ENV === 'development') {
      return getMockSubscriptionTiers();
    }
    
    return await response.json();
  } catch (error) {
    // Return mock data in development for easier testing
    if (process.env.NODE_ENV === 'development') {
      return getMockSubscriptionTiers();
    }
    throw error;
  }
}

// Get user's current subscription status
export async function getUserSubscription(): Promise<UserSubscription | null> {
  try {
    const response = await apiRequest('GET', '/api/subscription/status');
    
    // If we're in development mode and the API isn't fully implemented,
    // return mock data
    if (!response.ok && process.env.NODE_ENV === 'development') {
      return getMockUserSubscription();
    }
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    // Return mock data in development for easier testing
    if (process.env.NODE_ENV === 'development') {
      return getMockUserSubscription();
    }
    throw error;
  }
}

// Create a new subscription
export async function createSubscription(
  tierId: string,
  paymentMethod: 'sol' | 'usdc',
  amount: string,
  transactionSignature: string
): Promise<UserSubscription> {
  // Special handling for 'ALREADY_PROCESSED' transactions
  // This is a placeholder signature used when a transaction was already submitted
  if (transactionSignature === 'ALREADY_PROCESSED') {
    console.log('Processing ALREADY_PROCESSED transaction - creating a new unique signature');
    
    // Instead of reusing an existing subscription, always create a new one
    // This allows multiple subscriptions from the same wallet
    
    // In development mode, return mock data since we know the transaction succeeded
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating a new subscription with unique ID in development mode');
      
      // Always return a new mock subscription with unique ID
      return {
        id: 123 + Math.floor(Math.random() * 1000), // Ensure unique ID
        userId: 456,
        tier: tierId,
        status: 'active',
        startDate: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        gracePeriodEnd: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString(), // 33 days from now
        autoRenew: true,
        lastPayment: {
          amount: amount,
          currency: paymentMethod.toUpperCase(),
          date: new Date().toISOString(),
          transactionId: 'already-processed-' + Date.now()
        }
      };
    }
  }
  
  // Regular API call for normal transactions
  const response = await apiRequest('POST', '/api/subscription/create', {
    tierId,
    paymentMethod,
    amount,
    transactionSignature,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create subscription');
  }
  
  return await response.json();
}

// Cancel a subscription
export async function cancelSubscription(): Promise<void> {
  const response = await apiRequest('POST', '/api/subscription/cancel');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel subscription');
  }
}

// Toggle auto-renewal
export async function toggleAutoRenewal(autoRenew: boolean): Promise<UserSubscription> {
  const response = await apiRequest('POST', '/api/subscription/toggle-renewal', {
    autoRenew,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update auto-renewal setting');
  }
  
  return await response.json();
}

// Format time remaining for subscription
export function formatSubscriptionTimeRemaining(expiresAt: string): string {
  const expiration = new Date(expiresAt);
  const now = new Date();
  const diffInMs = expiration.getTime() - now.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays <= 0) {
    return 'Expires today';
  } else if (diffInDays === 1) {
    return 'Expires tomorrow';
  } else if (diffInDays <= 30) {
    return `Expires in ${diffInDays} days`;
  } else {
    const months = Math.floor(diffInDays / 30);
    return `Expires in ${months} ${months === 1 ? 'month' : 'months'}`;
  }
}

// Mock data functions
function getMockSubscriptionTiers(): SubscriptionTier[] {
  return [
    {
      id: 'basic',
      name: 'Basic',
      headline: 'Essential streaming features',
      description: 'For casual streamers who need the essential tools',
      priceSol: 0.1,
      priceUsdc: 15,
      features: [
        'HD video quality (720p)',
        'Basic AI teleprompter',
        '5 hours of stream storage',
        'Limited analytics',
        'Email support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      headline: 'For regular content creators',
      description: 'Perfect for regular streamers who want to grow their audience',
      priceSol: 0.25,
      priceUsdc: 39,
      mostPopular: true,
      features: [
        'Full HD video quality (1080p)',
        'Advanced AI teleprompter',
        'Dual commentary styles',
        'Unlimited stream storage',
        'Detailed analytics dashboard',
        'Priority email support',
        'Custom branding options'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      headline: 'For professional creators',
      description: 'Our complete solution for professional content creators',
      priceSol: 0.5,
      priceUsdc: 79,
      features: [
        '4K video quality',
        'Premium AI teleprompter',
        'Custom AI model training',
        'Multi-stream capability',
        'Advanced analytics and reports',
        'Dedicated support manager',
        'White-label option',
        'Early access to new features'
      ]
    }
  ];
}

function getMockUserSubscription(): UserSubscription | null {
  // Return a 50% chance of having a subscription in development
  if (Math.random() > 0.5) {
    return {
      id: 123,
      userId: 456,
      tier: 'pro',
      status: 'active',
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
      gracePeriodEnd: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days from now
      autoRenew: true,
      lastPayment: {
        amount: '0.25',
        currency: 'SOL',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        transactionId: 'mock_tx_' + Math.random().toString(36).substring(2, 15)
      }
    };
  }
  
  return {
    id: 0,
    userId: 456,
    tier: 'none',
    status: 'none',
    startDate: '',
    expiresAt: null,
    gracePeriodEnd: null,
    autoRenew: false,
    lastPayment: null
  };
}