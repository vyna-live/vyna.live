import { VerxioProvider, DataRegistry } from '@verxioprotocol/core';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { LoyaltyTier } from '../../shared/loyaltySchema';

// Initialize Verxio Provider
// In a production environment, these would be loaded from environment variables
// and properly secured
const defaultEndpoint = 'https://api.devnet.solana.com'; // Use Solana devnet for development
let verxioProvider: VerxioProvider | null = null;
let dataRegistry: DataRegistry | null = null;

// Initialize the Verxio Provider
export async function initVerxioProvider(
  privateKey?: string,
  endpoint: string = defaultEndpoint
) {
  try {
    // If we have a private key, use it to create a keypair
    let keypair: Keypair | undefined;
    if (privateKey) {
      const secretKey = Buffer.from(privateKey, 'base64');
      keypair = Keypair.fromSecretKey(secretKey);
    }

    // Create a Solana connection
    const connection = new Connection(endpoint);
    
    // Initialize the Verxio Provider
    verxioProvider = new VerxioProvider({ 
      connection, 
      keypair 
    });
    
    // Initialize the data registry
    dataRegistry = verxioProvider.dataRegistry;
    
    return { verxioProvider, dataRegistry };
  } catch (error) {
    console.error('Error initializing Verxio Provider:', error);
    throw error;
  }
}

// Get the initialized provider
export function getVerxioProvider() {
  if (!verxioProvider) {
    throw new Error('Verxio Provider not initialized. Call initVerxioProvider first.');
  }
  return verxioProvider;
}

// Get the data registry
export function getDataRegistry() {
  if (!dataRegistry) {
    throw new Error('Data Registry not initialized. Call initVerxioProvider first.');
  }
  return dataRegistry;
}

// Create a new loyalty pass attestation on the blockchain
export async function createLoyaltyPassAttestation(
  streamerId: number,
  audienceId: number,
  walletAddress: string | undefined,
  tier: LoyaltyTier
) {
  try {
    // Ensure the provider is initialized
    const registry = getDataRegistry();
    
    // Create the attestation data
    const attestationData = {
      streamerId: streamerId.toString(),
      audienceId: audienceId.toString(),
      tier,
      issuedAt: new Date().toISOString(),
      walletAddress: walletAddress || 'not-provided'
    };
    
    // Recipient wallet address (if provided)
    const recipientWallet = walletAddress 
      ? new PublicKey(walletAddress)
      : undefined;
    
    // Create the attestation on the blockchain
    const attestation = await registry.createAttestation({
      data: attestationData,
      recipient: recipientWallet
    });
    
    // Return the attestation ID and details
    return {
      verxioId: attestation.id,
      data: attestationData,
      verified: true
    };
  } catch (error) {
    console.error('Error creating loyalty pass attestation:', error);
    
    // For development, create a mock attestation ID
    // In production, we would handle this error differently
    return {
      verxioId: `mock-${Date.now()}`,
      data: {
        streamerId: streamerId.toString(),
        audienceId: audienceId.toString(),
        tier,
        issuedAt: new Date().toISOString(),
        walletAddress: walletAddress || 'not-provided'
      },
      verified: false
    };
  }
}

// Verify a loyalty pass attestation
export async function verifyLoyaltyPassAttestation(attestationId: string) {
  try {
    // Ensure the provider is initialized
    const registry = getDataRegistry();
    
    // Get the attestation from the blockchain
    const attestation = await registry.getAttestation(attestationId);
    
    // Return the attestation details
    return {
      verified: true,
      data: attestation.data
    };
  } catch (error) {
    console.error('Error verifying loyalty pass attestation:', error);
    return {
      verified: false,
      error: 'Unable to verify attestation'
    };
  }
}

// Update an existing loyalty pass attestation (e.g., when upgrading tiers)
export async function updateLoyaltyPassAttestation(
  attestationId: string,
  newTier: LoyaltyTier
) {
  try {
    // Ensure the provider is initialized
    const registry = getDataRegistry();
    
    // Get the existing attestation
    const existingAttestation = await registry.getAttestation(attestationId);
    
    // Update the attestation data
    const updatedData = {
      ...existingAttestation.data,
      tier: newTier,
      updatedAt: new Date().toISOString()
    };
    
    // Update the attestation on the blockchain
    const updatedAttestation = await registry.updateAttestation(attestationId, updatedData);
    
    // Return the updated attestation details
    return {
      verxioId: updatedAttestation.id,
      data: updatedData,
      verified: true
    };
  } catch (error) {
    console.error('Error updating loyalty pass attestation:', error);
    
    // For development, return a mock response
    // In production, we would handle this error differently
    return {
      verxioId: attestationId,
      data: {
        tier: newTier,
        updatedAt: new Date().toISOString()
      },
      verified: false
    };
  }
}