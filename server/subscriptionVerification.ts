import { Request, Response } from 'express';
// Define subscription tiers (same as in subscriptionRoutes but defined here directly)
const subscriptionTiers = [
  {
    id: 'free',
    name: 'Free',
    priceUsdc: 0
  },
  {
    id: 'pro',
    name: 'Pro',
    priceUsdc: 15.00
  },
  {
    id: 'max',
    name: 'Max',
    priceUsdc: 75.00
  }
];

/**
 * Handle QR code payment verification
 * This endpoint checks for recent transactions from a wallet address
 * Used when a user pays via QR code instead of direct wallet connection
 */
export async function checkPendingPayment(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { walletAddress, tierId } = req.body;
    
    // Validate input parameters
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    if (!tierId || !['free', 'pro', 'max'].includes(tierId)) {
      return res.status(400).json({ error: 'Valid tier ID is required' });
    }
    
    // Find the tier to get its price
    const tier = subscriptionTiers.find(t => t.id === tierId);
    if (!tier) {
      return res.status(400).json({ error: 'Subscription tier not found' });
    }
    
    // Free tier doesn't need payment verification
    if (tierId === 'free') {
      return res.status(200).json({ 
        found: true, 
        message: 'Free tier does not require payment'
      });
    }
    
    // Get the expected amount for the selected tier
    const expectedAmount = tier.priceUsdc.toFixed(2);
    
    // Import the Solana service
    const { checkRecentTransactionsFromWallet } = await import('./solanaService');
    
    // Look for transactions from this wallet in the last 10 minutes (600 seconds)
    console.log(`Checking for recent USDC payments from wallet ${walletAddress}`);
    const result = await checkRecentTransactionsFromWallet(
      walletAddress,
      expectedAmount,
      600 // 10 minutes
    );
    
    // Return the result to the client
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Error checking pending payment:', error);
    res.status(500).json({ 
      error: 'Failed to check pending payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}