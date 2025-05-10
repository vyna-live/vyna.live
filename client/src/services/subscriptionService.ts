import { 
  clusterApiUrl, 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// Admin wallet that receives subscription payments
const ADMIN_WALLET = new PublicKey('4zM9x8LgEYJGQNrLANZAD9nfEqkJT5mKF8YcjYE8Pj39');

// Connect to Solana
const network = process.env.NODE_ENV === 'production' 
  ? WalletAdapterNetwork.Mainnet 
  : WalletAdapterNetwork.Devnet;

const endpoint = clusterApiUrl(network);
const connection = new Connection(endpoint);

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

// Get subscription tier details
export function getSubscriptionTier(tierId: string): SubscriptionTier | undefined {
  return subscriptionTiers.find(tier => tier.id === tierId);
}

// Create a Solana transaction for subscription payment
export async function createSubscriptionTransaction(
  walletPublicKey: PublicKey,
  amount: number // Amount in SOL
): Promise<Transaction> {
  // Get latest blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
  // Create a transaction
  const transaction = new Transaction({
    feePayer: walletPublicKey,
    blockhash,
    lastValidBlockHeight
  });
  
  // Add a transfer instruction
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: walletPublicKey,
      toPubkey: ADMIN_WALLET,
      lamports: amount * LAMPORTS_PER_SOL // Convert SOL to lamports
    })
  );
  
  return transaction;
}

// Confirm a Solana transaction
export async function confirmTransaction(signature: string): Promise<boolean> {
  try {
    // Wait for transaction confirmation
    const confirmation = await connection.confirmTransaction(signature, 'processed');
    
    if (confirmation.value.err) {
      console.error('Transaction confirmed but failed:', confirmation.value.err);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error confirming transaction:', error);
    return false;
  }
}

// Activate subscription for a user
export async function activateSubscription(
  userId: number, 
  tierId: string,
  transactionSignature: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/subscriptions/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        tierId,
        transactionSignature,
        activatedAt: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to activate subscription');
    }
    
    return true;
  } catch (error) {
    console.error('Error activating subscription:', error);
    return false;
  }
}