import { Request, Response } from 'express';
import { 
  Connection, 
  PublicKey, 
  Keypair, 
  clusterApiUrl 
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import bs58 from 'bs58';

// USDC Token Mint address (use devnet for testing, mainnet for production)
// Devnet USDC mint address
const USDC_MINT = new PublicKey("BXXkv6zRCz1mGJd96Chp4t64r1x3QT5BpHs4fFyz83Ps");

// Check if the private key is available
const hasPrivateKey = () => {
  return !!process.env.PRIVATE_KEY;
};

// Create a connection to Solana network (devnet for testing)
const getConnection = () => {
  return new Connection(clusterApiUrl('devnet'), 'confirmed');
};

// Get the application wallet from the private key
const getApplicationWallet = () => {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('Application wallet private key is not configured');
  }
  
  try {
    return Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
  } catch (error) {
    console.error('Error loading application wallet:', error);
    throw new Error('Invalid application wallet configuration');
  }
};

// Get application wallet public key
export async function getWalletPublicKey(req: Request, res: Response) {
  try {
    if (!hasPrivateKey()) {
      return res.status(500).json({ 
        error: 'Application wallet not configured', 
        publicKey: null 
      });
    }
    
    const wallet = getApplicationWallet();
    return res.json({ 
      publicKey: wallet.publicKey.toString(),
      network: 'devnet'
    });
  } catch (error) {
    console.error('Error getting wallet public key:', error);
    return res.status(500).json({ 
      error: 'Could not load application wallet', 
      publicKey: null 
    });
  }
}

// Create or get the USDC token account for the application wallet
export async function getTokenAccount(req: Request, res: Response) {
  try {
    if (!hasPrivateKey()) {
      return res.status(500).json({ 
        error: 'Application wallet not configured'
      });
    }
    
    const wallet = getApplicationWallet();
    const connection = getConnection();
    
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      USDC_MINT,
      wallet.publicKey
    );
    
    return res.json({ 
      tokenAccount: tokenAccount.address.toString(),
      owner: tokenAccount.owner.toString(),
      mint: tokenAccount.mint.toString()
    });
  } catch (error) {
    console.error('Error creating token account:', error);
    return res.status(500).json({ 
      error: 'Failed to get or create token account'
    });
  }
}

// Register Solana routes
export function registerSolanaRoutes(app: any) {
  app.get('/api/solana/wallet-address', getWalletPublicKey);
  app.get('/api/solana/token-account', getTokenAccount);
}