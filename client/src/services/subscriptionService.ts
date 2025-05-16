import { apiRequest } from '@/lib/queryClient';

// Subscription Tier interface
export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  headline: string;
  priceUsdc: number;
  features: string[];
  mostPopular?: boolean;
  featureAccess?: {
    maxChatSessions?: number;
    maxMessagePerDay?: number;
    maxNotes?: number;
    allowedAiModels?: string[];
    richResponsesPerDay?: number;
    advancedFormatting?: boolean;
    noteCategories?: boolean;
    searchEnabled?: boolean;
    exportEnabled?: boolean;
    advancedVisualization?: boolean;
    advancedNoteOrganization?: boolean;
    collaborationEnabled?: boolean;
    apiAccessEnabled?: boolean;
    customTraining?: boolean;
  };
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
    
    if (!response.ok) {
      // Only use mock data when explicitly in development mode AND if the API returns an error
      // This prevents mock data from being used in production
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock subscription data in development');
        return getMockUserSubscription();
      }
      
      // In production, return the free tier default
      return {
        id: 0,
        userId: 0,
        tier: 'free',
        status: 'none',
        startDate: '',
        expiresAt: null,
        gracePeriodEnd: null,
        autoRenew: false,
        lastPayment: null
      };
    }
    
    return await response.json();
  } catch (error) {
    // Only use mock data in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Error fetching subscription, using mock data:', error);
      return getMockUserSubscription();
    }
    console.error('Subscription fetch error:', error);
    
    // In production, return the free tier default on error
    return {
      id: 0,
      userId: 0,
      tier: 'free',
      status: 'none',
      startDate: '',
      expiresAt: null,
      gracePeriodEnd: null,
      autoRenew: false,
      lastPayment: null
    };
  }
}

// Create a new subscription with real payment validation
export async function createSubscription(
  tierId: string,
  paymentMethod: 'usdc',
  amount: string,
  transactionSignature: string
): Promise<UserSubscription> {
  // Check payment source to tag in analytics
  const isQRPayment = transactionSignature && transactionSignature.startsWith('QR');
  
  // Make sure we have a valid transaction signature
  if (!transactionSignature || transactionSignature === 'ALREADY_PROCESSED') {
    throw new Error('Valid transaction signature is required for subscription payment');
  }
  
  console.log(`Processing subscription payment for ${tierId} tier with ${amount} USDC`);
  console.log(`Transaction signature: ${transactionSignature}`);
  
  // Send the payment details to the server for validation and subscription creation
  // The server will verify the transaction on the blockchain before creating the subscription
  const response = await apiRequest('POST', '/api/subscription/create', {
    tierId,
    paymentMethod,
    amount,
    transactionSignature,
    paymentSource: isQRPayment ? 'qr_code' : 'direct_wallet'
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    
    // Handle specific error cases with appropriate user messages
    if (errorData.error === 'Underpayment detected') {
      throw new Error(`Payment amount (${errorData.provided} USDC) is less than the required amount (${errorData.expected} USDC). Please pay the full amount.`);
    } else if (errorData.error === 'Transaction already processed') {
      throw new Error('This transaction has already been used for a subscription. Please make a new payment.');
    } else if (errorData.error === 'Transaction validation failed') {
      throw new Error('Unable to verify your payment on the blockchain. Please check the transaction and try again.');
    } else if (errorData.error === 'Invalid transaction signature') {
      throw new Error('The provided transaction signature is invalid. Please ensure you\'re submitting a valid Solana transaction.');
    }
    
    // Generic error fallback
    throw new Error(errorData.message || errorData.error || 'Failed to create subscription');
  }
  
  // Return the verified and activated subscription
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
      id: 'free',
      name: 'Free',
      headline: 'Get started with basic features',
      description: 'Experience VynaAI with essential features for casual users.',
      priceUsdc: 0,
      features: [
        'Access to basic AI model (standard response quality)',
        'Limited rich response formatting (5 per chat session daily)',
        'One active chat session at a time',
        'Up to 5 saved notes',
        'Basic text formatting',
        'Manual saves only',
        'No rich content support',
        'No categorization or tagging features',
        'Basic customer support (email only, 48-hour response time)',
        'Research rewards program participation (basic level)'
      ],
      featureAccess: {
        maxChatSessions: 1,
        maxMessagePerDay: 20,
        maxNotes: 5,
        allowedAiModels: ['basic'],
        richResponsesPerDay: 5,
        advancedFormatting: false,
        noteCategories: false,
        searchEnabled: false,
        exportEnabled: false
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      headline: 'For power users and creators',
      description: 'Enhance your experience with advanced features and capabilities.',
      priceUsdc: 15.00,
      mostPopular: true,
      features: [
        'Access to advanced AI models (Claude, GPT-4)',
        'Unlimited messages per day',
        'Rich response formatting (tables, code blocks, cards)',
        'Up to 10 concurrent chat sessions',
        'Ability to export chat history',
        'Unlimited saved notes',
        'Advanced text formatting and markdown support',
        'Supports embedding images and links',
        'Auto-save feature',
        'Basic categorization with tags',
        'Search functionality across notes',
        'Priority customer support (24-hour response time)',
        'Enhanced research rewards program (higher points multiplier)',
        'Customizable UI themes',
        'AI model selection option'
      ],
      featureAccess: {
        maxChatSessions: 10,
        maxMessagePerDay: -1, // Unlimited
        maxNotes: -1, // Unlimited
        allowedAiModels: ['basic', 'claude', 'gpt4'],
        richResponsesPerDay: -1, // Unlimited
        advancedFormatting: true,
        noteCategories: true,
        searchEnabled: true,
        exportEnabled: true
      }
    },
    {
      id: 'max',
      name: 'Max',
      headline: 'For professionals and teams',
      description: 'Unlock the full potential with our most comprehensive plan.',
      priceUsdc: 75.00,
      features: [
        'Access to all AI models, including exclusive Max-only models',
        'Priority API access (faster response times)',
        'Premium response quality with enhanced visualizations',
        'Unlimited concurrent chat sessions',
        'Unlimited chat history retention',
        'Advanced data visualization in responses',
        'Custom AI configuration options (tone, verbosity, etc.)',
        'Unlimited notes with version history',
        'Advanced formatting with templates',
        'Collaborative notes with sharing options',
        'Real-time sync across devices',
        'Advanced organization with folders and nested tags',
        'Full-text search with filters',
        'Export in multiple formats (PDF, HTML, Markdown)',
        'AI-powered note suggestions and enhancements',
        'Max support (dedicated account manager)',
        'Highest research rewards program tier',
        'White-label option for embedded use',
        'API access for custom integrations',
        'Analytics dashboard for usage statistics',
        'Custom training for AI responses'
      ],
      featureAccess: {
        maxChatSessions: -1, // Unlimited
        maxMessagePerDay: -1, // Unlimited
        maxNotes: -1, // Unlimited
        allowedAiModels: ['basic', 'claude', 'gpt4', 'max-exclusive'],
        richResponsesPerDay: -1, // Unlimited
        advancedFormatting: true,
        advancedVisualization: true,
        noteCategories: true,
        advancedNoteOrganization: true,
        searchEnabled: true,
        exportEnabled: true,
        collaborationEnabled: true,
        apiAccessEnabled: true,
        customTraining: true
      }
    }
  ];
}

function getMockUserSubscription(): UserSubscription | null {
  // Return a 50% chance of having a subscription in development
  if (Math.random() > 0.5) {
    // Randomly select a tier between pro and max
    const tier = Math.random() > 0.5 ? 'pro' : 'max';
    const amount = tier === 'pro' ? '15.00' : '75.00';
    
    return {
      id: 123,
      userId: 456,
      tier: tier,
      status: 'active',
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
      gracePeriodEnd: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days from now
      autoRenew: true,
      lastPayment: {
        amount: amount,
        currency: 'USDC',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        transactionId: 'mock_tx_' + Math.random().toString(36).substring(2, 15)
      }
    };
  }
  
  return {
    id: 0,
    userId: 456,
    tier: 'free',
    status: 'none',
    startDate: '',
    expiresAt: null,
    gracePeriodEnd: null,
    autoRenew: false,
    lastPayment: null
  };
}