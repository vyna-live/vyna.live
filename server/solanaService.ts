import { Connection, PublicKey, clusterApiUrl, ConfirmedSignatureInfo } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { walletTransactions } from '@shared/schema';

// USDC Token Mint address (Mainnet)
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybAPX3ovGdTAbS1ZC1nQjL");

// For development/testing on Devnet
const DEVNET_USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

// Use devnet for development, mainnet-beta for production
const SOLANA_NETWORK = process.env.NODE_ENV === 'production' 
  ? 'mainnet-beta' 
  : 'devnet';

// The USDC mint to use based on environment
const CURRENT_USDC_MINT = SOLANA_NETWORK === 'mainnet-beta' ? USDC_MINT : DEVNET_USDC_MINT;

// The company's wallet address where subscription payments are received
const COMPANY_WALLET_ADDRESS = "HF7EHsCJAiQvuVyvEZpEXGAnbLk1hotBKuuTq7v9JBYU";

/**
 * Verify a Solana transaction to confirm USDC payment
 * @param signature The transaction signature to verify
 * @param expectedAmount The expected USDC amount (as a string with decimal places)
 * @param senderWalletAddress Optional sender wallet address to verify
 * @returns Object with verification result and transaction details
 */
export async function verifyUSDCTransaction(
  signature: string,
  expectedAmount: string,
  senderWalletAddress?: string
): Promise<{
  isValid: boolean;
  amount?: number;
  sender?: string;
  receiver?: string;
  timestamp?: number;
  errorMessage?: string;
}> {
  try {
    console.log(`Verifying Solana USDC transaction: ${signature}`);
    console.log(`Expected amount: ${expectedAmount} USDC`);
    
    // Check if we already verified and recorded this transaction
    const existingTransaction = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.signature, signature))
      .limit(1);
    
    if (existingTransaction.length > 0) {
      const transaction = existingTransaction[0];
      console.log(`Transaction ${signature} already verified and recorded`);
      
      // Return cached verification if it matches our expectations
      if (transaction.amount === expectedAmount) {
        return {
          isValid: true,
          amount: parseFloat(transaction.amount),
          sender: transaction.fromAddress,
          receiver: transaction.toAddress,
          timestamp: transaction.confirmedAt ? new Date(transaction.confirmedAt).getTime() : undefined
        };
      } else {
        // Transaction exists but amount doesn't match expectations
        return {
          isValid: false,
          errorMessage: `Transaction exists but amount ${transaction.amount} doesn't match expected ${expectedAmount}`
        };
      }
    }
    
    // Initialize Solana connection
    const connection = new Connection(clusterApiUrl(SOLANA_NETWORK), 'confirmed');
    
    // Retrieve transaction details
    const txInfo = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
    
    if (!txInfo) {
      console.error(`Transaction not found: ${signature}`);
      return { 
        isValid: false,
        errorMessage: 'Transaction not found on the Solana blockchain'
      };
    }
    
    // Verify transaction was successful
    if (txInfo.meta?.err) {
      console.error(`Transaction failed: ${JSON.stringify(txInfo.meta.err)}`);
      return { 
        isValid: false,
        errorMessage: `Transaction failed: ${JSON.stringify(txInfo.meta.err)}`
      };
    }
    
    // Extract token transfers
    const postTokenBalances = txInfo.meta?.postTokenBalances || [];
    const preTokenBalances = txInfo.meta?.preTokenBalances || [];
    
    // Filter for USDC token transfers
    const usdcTransfers = postTokenBalances.filter(balance => 
      balance.mint === CURRENT_USDC_MINT.toString()
    );
    
    if (usdcTransfers.length === 0) {
      console.error('No USDC transfers found in transaction');
      return { 
        isValid: false,
        errorMessage: 'No USDC transfers found in transaction'
      };
    }
    
    // Find the company wallet in the transfer (receiver)
    const companyWalletTransfer = usdcTransfers.find(transfer => {
      // Get keys from versioned or legacy transaction message
      const messageAccountKeys = 'getAccountKeys' in txInfo.transaction.message 
        ? txInfo.transaction.message.getAccountKeys() 
        : { get: (i: number) => (txInfo.transaction.message as any).accountKeys[i] };
      
      const ownerInfo = messageAccountKeys.get(transfer.accountIndex);
      return ownerInfo.toString() === COMPANY_WALLET_ADDRESS;
    });
    
    if (!companyWalletTransfer) {
      console.error(`No transfer to company wallet ${COMPANY_WALLET_ADDRESS} found`);
      return { 
        isValid: false,
        errorMessage: `No transfer to company wallet found`
      };
    }
    
    // Find the prebalance for the company wallet to calculate the transfer amount
    const companyPreBalance = preTokenBalances.find(balance => 
      balance.accountIndex === companyWalletTransfer.accountIndex
    );
    
    if (!companyPreBalance) {
      console.error('Cannot find pre-balance for company wallet');
      return { 
        isValid: false,
        errorMessage: 'Cannot verify transfer amount - pre-balance information missing'
      };
    }
    
    // Calculate actual transferred amount in USDC
    const preBalanceAmount = BigInt(companyPreBalance.uiTokenAmount.amount);
    const postBalanceAmount = BigInt(companyWalletTransfer.uiTokenAmount.amount);
    const transferredAmount = Number(postBalanceAmount - preBalanceAmount) / 1_000_000; // USDC has 6 decimals
    
    console.log(`Detected USDC transfer amount: ${transferredAmount}`);
    
    // Find sender account
    let senderAddress;
    // Get all token accounts that had a balance decrease
    const potentialSenders = preTokenBalances
      .filter(preBalance => {
        const postBalance = postTokenBalances.find(post => 
          post.accountIndex === preBalance.accountIndex && 
          post.mint === CURRENT_USDC_MINT.toString()
        );
        
        if (!postBalance) return false;
        
        const preBigInt = BigInt(preBalance.uiTokenAmount.amount);
        const postBigInt = BigInt(postBalance.uiTokenAmount.amount);
        
        return preBigInt > postBigInt;
      });
    
    if (potentialSenders.length > 0) {
      const senderIndex = potentialSenders[0].accountIndex;
      // Get keys from versioned or legacy transaction message
      const messageAccountKeys = 'getAccountKeys' in txInfo.transaction.message 
        ? txInfo.transaction.message.getAccountKeys() 
        : { get: (i: number) => (txInfo.transaction.message as any).accountKeys[i] };
      
      senderAddress = messageAccountKeys.get(senderIndex).toString();
      console.log(`Detected sender wallet: ${senderAddress}`);
      
      // If a specific sender wallet was expected, verify it
      if (senderWalletAddress && senderAddress !== senderWalletAddress) {
        console.warn(`Sender wallet mismatch. Expected: ${senderWalletAddress}, Actual: ${senderAddress}`);
        return {
          isValid: false,
          amount: transferredAmount,
          sender: senderAddress,
          receiver: COMPANY_WALLET_ADDRESS,
          timestamp: txInfo.blockTime ? txInfo.blockTime * 1000 : undefined,
          errorMessage: 'Payment came from a different wallet than expected'
        };
      }
    }
    
    // Verify the transferred amount matches the expected amount (with 1% tolerance)
    const expectedAmountNumber = parseFloat(expectedAmount);
    const lowerBound = expectedAmountNumber * 0.99;
    const upperBound = expectedAmountNumber * 1.01;
    
    const amountMatches = transferredAmount >= lowerBound && transferredAmount <= upperBound;
    if (!amountMatches) {
      console.error(`Amount mismatch. Expected: ${expectedAmount}, Actual: ${transferredAmount}`);
      return {
        isValid: false,
        amount: transferredAmount,
        sender: senderAddress,
        receiver: COMPANY_WALLET_ADDRESS,
        timestamp: txInfo.blockTime ? txInfo.blockTime * 1000 : undefined,
        errorMessage: `Payment amount (${transferredAmount} USDC) doesn't match expected amount (${expectedAmount} USDC)`
      };
    }
    
    // Transaction is valid
    return {
      isValid: true,
      amount: transferredAmount,
      sender: senderAddress,
      receiver: COMPANY_WALLET_ADDRESS,
      timestamp: txInfo.blockTime ? txInfo.blockTime * 1000 : undefined
    };
    
  } catch (error) {
    console.error('Error verifying Solana transaction:', error);
    return {
      isValid: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error verifying transaction'
    };
  }
}

/**
 * Check for recent USDC transfers to the company wallet from a specific sender
 * This is used for QR code payments where we poll for incoming transactions
 */
export async function checkRecentTransactionsFromWallet(
  senderWalletAddress: string, 
  expectedAmount: string,
  timeWindowSeconds: number = 300 // 5 minutes by default
): Promise<{
  found: boolean;
  signature?: string;
  amount?: number;
  timestamp?: number;
  errorMessage?: string;
}> {
  try {
    console.log(`Checking recent transactions from ${senderWalletAddress}`);
    console.log(`Looking for amount: ${expectedAmount} USDC`);
    console.log(`Time window: ${timeWindowSeconds} seconds`);
    
    // Initialize Solana connection
    const connection = new Connection(clusterApiUrl(SOLANA_NETWORK), 'confirmed');
    
    // Calculate earliest timestamp to check (now - timeWindow)
    const earliestTimestamp = Math.floor(Date.now() / 1000) - timeWindowSeconds;
    
    // Get the sender's public key
    const senderPublicKey = new PublicKey(senderWalletAddress);
    
    // Get recent transactions from the sender
    const signatures = await connection.getSignaturesForAddress(
      senderPublicKey,
      { limit: 10 }
    );
    
    if (signatures.length === 0) {
      return {
        found: false,
        errorMessage: 'No recent transactions found from this wallet'
      };
    }
    
    // Filter for recent transactions
    const recentSignatures = signatures.filter(sig => 
      sig.blockTime && sig.blockTime >= earliestTimestamp
    );
    
    if (recentSignatures.length === 0) {
      return {
        found: false,
        errorMessage: `No transactions found in the last ${timeWindowSeconds} seconds`
      };
    }
    
    // Check each transaction
    for (const sig of recentSignatures) {
      // Verify the transaction
      const verification = await verifyUSDCTransaction(
        sig.signature,
        expectedAmount,
        senderWalletAddress
      );
      
      // If we found a valid transaction, return it
      if (verification.isValid) {
        return {
          found: true,
          signature: sig.signature,
          amount: verification.amount,
          timestamp: verification.timestamp
        };
      }
    }
    
    // No matching transactions found
    return {
      found: false,
      errorMessage: 'No matching USDC payment found in recent transactions'
    };
    
  } catch (error) {
    console.error('Error checking recent transactions:', error);
    return {
      found: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error checking transactions'
    };
  }
}

/**
 * Listen for new transactions from a wallet over a specified time period
 * This is used for QR code payments where we poll for incoming transactions
 */
export async function listenForTransactionFromWallet(
  senderWalletAddress: string,
  expectedAmount: string,
  pollingIntervalMs: number = 10000, // 10 seconds
  timeoutMs: number = 300000 // 5 minutes
): Promise<{
  found: boolean;
  signature?: string;
  amount?: number;
  timestamp?: number;
  errorMessage?: string;
}> {
  return new Promise((resolve) => {
    console.log(`Starting to listen for transactions from ${senderWalletAddress}`);
    console.log(`Expected amount: ${expectedAmount} USDC`);
    console.log(`Polling interval: ${pollingIntervalMs}ms, Timeout: ${timeoutMs}ms`);
    
    // Track our latest check to avoid duplicate processing
    let latestCheckTime = Date.now();
    
    // Set timeout to stop listening after the specified time
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      resolve({
        found: false,
        errorMessage: 'Timeout waiting for transaction'
      });
    }, timeoutMs);
    
    // Poll for new transactions
    const intervalId = setInterval(async () => {
      try {
        // Calculate the time window to check for new transactions
        const timeWindowSeconds = Math.ceil((Date.now() - latestCheckTime) / 1000) + 10; // Add a 10s buffer
        
        // Update our latest check time
        latestCheckTime = Date.now();
        
        // Check for new transactions
        const result = await checkRecentTransactionsFromWallet(
          senderWalletAddress,
          expectedAmount,
          timeWindowSeconds
        );
        
        // If we found a matching transaction, stop polling and resolve
        if (result.found) {
          clearTimeout(timeoutId);
          clearInterval(intervalId);
          resolve(result);
        }
      } catch (error) {
        console.error('Error polling for transactions:', error);
        // Continue polling despite errors
      }
    }, pollingIntervalMs);
  });
}