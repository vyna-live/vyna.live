import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// Set up Buffer for browser environment
import { Buffer } from "buffer";
// Make buffer available globally for the SPL token library
globalThis.Buffer = globalThis.Buffer || Buffer;

// For adding a memo to each transaction to prevent duplicate processing
const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

// USDC Token Mint address (using Devnet USDC for testing)
// This is the official Devnet USDC mint address
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

// For production mainnet: 
// const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybAPX3ovGdTAbS1ZC1nQjL");

// USDC has 6 decimal places
const USDC_DECIMALS = 6;

// Define wallet object interface
interface Wallet {
  publicKey: string;
  name: string;
  provider: "phantom" | "solflare" | "other";
}

// Define context interface
interface SolanaWalletContextType {
  wallet: Wallet | null;
  isConnecting: boolean;
  connectWallet: (provider?: "phantom" | "solflare") => Promise<boolean>;
  disconnectWallet: () => void;
  sendTransaction: (transaction: {
    amount: string;
    recipient: string;
    paymentMethod: "usdc";
  }) => Promise<{ signature: string }>;
}

// Create context with default values
export const SolanaWalletContext = createContext<SolanaWalletContextType>({
  wallet: null,
  isConnecting: false,
  connectWallet: async () => false,
  disconnectWallet: () => {},
  sendTransaction: async () => ({ signature: "" }),
});

// Custom hook for accessing wallet context
export const useSolanaWallet = () => useContext(SolanaWalletContext);

// Provider component
export const SolanaWalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Load saved wallet on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem("solanaWallet");
    if (savedWallet) {
      try {
        setWallet(JSON.parse(savedWallet));
      } catch (error) {
        console.error("Failed to load saved wallet", error);
        localStorage.removeItem("solanaWallet");
      }
    }
  }, []);

  // Check if the browser has a Solana wallet extension
  const hasPhantomWallet = useCallback(() => {
    return typeof window !== "undefined" && "phantom" in window;
  }, []);

  const hasSolflareWallet = useCallback(() => {
    return typeof window !== "undefined" && "solflare" in window;
  }, []);

  // Connect to wallet
  const connectWallet = useCallback(
    async (provider: "phantom" | "solflare" = "phantom"): Promise<boolean> => {
      try {
        setIsConnecting(true);

        if (provider === "phantom" && hasPhantomWallet()) {
          try {
            const response = await window.phantom?.solana.connect();
            const publicKey = response?.publicKey.toString();

            if (!publicKey) {
              throw new Error("Failed to connect to Phantom wallet");
            }

            const connectedWallet = {
              publicKey,
              name: "Phantom",
              provider: "phantom" as const,
            };

            setWallet(connectedWallet);
            localStorage.setItem(
              "solanaWallet",
              JSON.stringify(connectedWallet),
            );

            toast({
              title: "Wallet connected",
              description: "Successfully connected to Phantom wallet",
            });

            return true;
          } catch (error) {
            console.error("Phantom wallet connection error:", error);
            toast({
              title: "Connection Failed",
              description: "Failed to connect to Phantom wallet",
              variant: "destructive",
            });
            return false;
          }
        } else if (provider === "solflare" && hasSolflareWallet()) {
          try {
            const response = await window.solflare?.connect();
            const publicKey = response?.publicKey.toString();

            if (!publicKey) {
              throw new Error("Failed to connect to Solflare wallet");
            }

            const connectedWallet = {
              publicKey,
              name: "Solflare",
              provider: "solflare" as const,
            };

            setWallet(connectedWallet);
            localStorage.setItem(
              "solanaWallet",
              JSON.stringify(connectedWallet),
            );

            toast({
              title: "Wallet connected",
              description: "Successfully connected to Solflare wallet",
            });

            return true;
          } catch (error) {
            console.error("Solflare wallet connection error:", error);
            toast({
              title: "Connection Failed",
              description: "Failed to connect to Solflare wallet",
              variant: "destructive",
            });
            return false;
          }
        } else {
          toast({
            title: "Wallet not found",
            description: `${provider === "phantom" ? "Phantom" : "Solflare"} wallet extension not detected. Please install it first.`,
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error connecting wallet:", error);
        toast({
          title: "Connection error",
          description: "Failed to connect to wallet. Please try again.",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsConnecting(false);
      }
    },
    [hasPhantomWallet, hasSolflareWallet, toast],
  );

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      if (wallet?.provider === "phantom" && window.phantom?.solana) {
        await window.phantom.solana.disconnect();
      } else if (wallet?.provider === "solflare" && window.solflare) {
        await window.solflare.disconnect();
      }

      setWallet(null);
      localStorage.removeItem("solanaWallet");

      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({
        title: "Disconnect error",
        description: "Failed to disconnect wallet properly. Please try again.",
        variant: "destructive",
      });
    }
  }, [wallet, toast]);

  // Send transaction for USDC payment
  const sendTransaction = useCallback(
    async ({
      amount,
      recipient,
      paymentMethod,
    }: {
      amount: string;
      recipient: string;
      paymentMethod: "usdc";
    }) => {
      if (!wallet) {
        throw new Error("Wallet not connected");
      }

      toast({
        title: "Preparing transaction",
        description: "Setting up your USDC payment...",
      });

      try {
        // Set up connection to Solana devnet
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

        // Create new transaction
        const transaction = new Transaction();

        // Generate a unique identifier for this transaction
        const uniqueId = Date.now().toString() + Math.random().toString().substring(2, 8);

        // Create PublicKeys from wallet addresses
        const senderPublicKey = new PublicKey(wallet.publicKey);
        const recipientPublicKey = new PublicKey(recipient);

        // Convert amount to USDC token units (USDC has 6 decimal places)
        const usdcAmount = BigInt(
          Math.floor(parseFloat(amount) * Math.pow(10, USDC_DECIMALS))
        );

        console.log(`Processing USDC payment: ${usdcAmount} units from ${senderPublicKey.toString()} to ${recipientPublicKey.toString()}`);

        // Step 1: Get the associated token addresses
        const senderTokenAccount = await getAssociatedTokenAddress(
          USDC_MINT,
          senderPublicKey
        );

        const recipientTokenAccount = await getAssociatedTokenAddress(
          USDC_MINT,
          recipientPublicKey
        );

        console.log(`Sender token account: ${senderTokenAccount.toString()}`);
        console.log(`Recipient token account: ${recipientTokenAccount.toString()}`);

        // Step 2: Check if recipient token account exists and create it if not
        try {
          // This will throw an error if the account doesn't exist
          const accountInfo = await connection.getAccountInfo(recipientTokenAccount);
          
          if (!accountInfo) {
            console.log("Creating recipient token account");
            
            // Add instruction to create recipient associated token account
            transaction.add(
              createAssociatedTokenAccountInstruction(
                senderPublicKey, // payer
                recipientTokenAccount, // ata
                recipientPublicKey, // owner
                USDC_MINT // mint
              )
            );
          } else {
            console.log("Recipient token account already exists");
          }
        } catch (error) {
          console.log("Creating recipient token account due to error:", error);
          
          // Add instruction to create recipient associated token account
          transaction.add(
            createAssociatedTokenAccountInstruction(
              senderPublicKey, // payer
              recipientTokenAccount, // ata
              recipientPublicKey, // owner
              USDC_MINT // mint
            )
          );
        }

        // Step 3: Add token transfer instruction
        transaction.add(
          createTransferInstruction(
            senderTokenAccount, // source
            recipientTokenAccount, // destination
            senderPublicKey, // owner
            usdcAmount // amount
          )
        );

        // Step 4: Add memo instruction with payment details
        const memoMessage = `Vyna.live USDC payment: ${uniqueId}`;
        const memoData = Buffer.from(memoMessage, "utf-8");

        const memoInstruction = new TransactionInstruction({
          keys: [],
          programId: MEMO_PROGRAM_ID,
          data: memoData,
        });

        // Add memo instruction to transaction
        transaction.add(memoInstruction);

        // Step 5: Get recent blockhash and set transaction fee payer
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = senderPublicKey;
        
        console.log("Transaction prepared with instructions:", transaction.instructions.length);

        // Sign and send the transaction based on wallet provider
        let signature = "";

        if (wallet.provider === "phantom" && window.phantom?.solana) {
          toast({
            title: "Waiting for approval",
            description:
              "Please approve the transaction in your Phantom wallet",
          });

          try {
            // Request signature from Phantom wallet
            console.log("Requesting signature from Phantom wallet");
            const signedTransaction = await window.phantom.solana.signTransaction?.(transaction);

            if (!signedTransaction) {
              throw new Error("Failed to sign transaction with Phantom wallet");
            }

            toast({
              title: "Sending transaction",
              description: "Your USDC payment is being processed...",
            });

            console.log("Transaction signed, sending to network");
            
            // Send the signed transaction to the network
            const txSignature = await connection.sendRawTransaction(
              signedTransaction.serialize(),
              { 
                skipPreflight: false,
                preflightCommitment: "confirmed"
              }
            );
            
            signature = txSignature;
            console.log("Transaction sent with signature:", txSignature);
            
            // Wait for transaction confirmation
            const confirmation = await connection.confirmTransaction({
              signature: txSignature,
              blockhash: blockhash,
              lastValidBlockHeight: lastValidBlockHeight
            }, "confirmed");
            
            console.log("Transaction confirmed:", confirmation);

            toast({
              title: "Transaction successful",
              description: "Your USDC payment has been confirmed",
              variant: "default",
            });

            console.log("USDC Transaction confirmed:", txSignature);
            console.log(
              `View on explorer: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
            );
          } catch (error) {
            console.error("Transaction error:", error);

            // Check if the error is about a transaction already being processed
            const errorMessage = String(error).toLowerCase();
            if (errorMessage.includes("already been processed")) {
              // If the transaction was already processed, we can consider it a success
              toast({
                title: "Transaction Note",
                description:
                  "This transaction appears to have already been processed successfully.",
                variant: "default",
              });

              // Return the most recent signature if available, or a placeholder
              return { signature: signature || "ALREADY_PROCESSED" };
            }

            toast({
              title: "Transaction failed",
              description: errorMessage.includes("insufficient funds")
                ? "Insufficient funds for transaction fees"
                : "Could not complete USDC payment",
              variant: "destructive",
            });

            throw new Error(
              "Transaction failed: " +
                (error instanceof Error ? error.message : String(error)),
            );
          }
        } else if (wallet.provider === "solflare" && window.solflare) {
          toast({
            title: "Waiting for approval",
            description:
              "Please approve the transaction in your Solflare wallet",
          });

          try {
            // Request signature from Solflare wallet
            console.log("Requesting signature from Solflare wallet");
            const signedTransaction = await window.solflare.signTransaction?.(transaction);

            if (!signedTransaction) {
              throw new Error("Failed to sign transaction with Solflare wallet");
            }

            toast({
              title: "Sending transaction",
              description: "Your USDC payment is being processed...",
            });

            console.log("Transaction signed, sending to network");
            
            // Send the signed transaction to the network
            const txSignature = await connection.sendRawTransaction(
              signedTransaction.serialize(),
              { 
                skipPreflight: false,
                preflightCommitment: "confirmed"
              }
            );
            
            signature = txSignature;
            console.log("Transaction sent with signature:", txSignature);
            
            // Wait for transaction confirmation
            const confirmation = await connection.confirmTransaction({
              signature: txSignature,
              blockhash: blockhash,
              lastValidBlockHeight: lastValidBlockHeight
            }, "confirmed");
            
            console.log("Transaction confirmed:", confirmation);

            toast({
              title: "Transaction successful",
              description: "Your USDC payment has been confirmed",
              variant: "default",
            });

            console.log("USDC Transaction confirmed:", txSignature);
            console.log(
              `View on explorer: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
            );
          } catch (error) {
            console.error("Transaction error:", error);

            // Check if the error is about a transaction already being processed
            const errorMessage = String(error).toLowerCase();
            if (errorMessage.includes("already been processed")) {
              // If the transaction was already processed, we can consider it a success
              toast({
                title: "Transaction Note",
                description:
                  "This transaction appears to have already been processed successfully.",
                variant: "default",
              });

              // Return the most recent signature if available, or a placeholder
              return { signature: signature || "ALREADY_PROCESSED" };
            }

            toast({
              title: "Transaction failed",
              description: errorMessage.includes("insufficient funds")
                ? "Insufficient funds for transaction fees"
                : "Could not complete USDC payment",
              variant: "destructive",
            });

            throw new Error(
              "Transaction failed: " +
                (error instanceof Error ? error.message : String(error)),
            );
          }
        } else {
          throw new Error("Unsupported wallet provider");
        }

        return { signature };
      } catch (error) {
        console.error("Error sending transaction:", error);

        // Check for already processed transactions at the global level as well
        const errorMessage = String(error).toLowerCase();
        if (errorMessage.includes("already been processed")) {
          toast({
            title: "Transaction Note",
            description:
              "This transaction appears to have already been processed successfully.",
            variant: "default",
          });

          return { signature: "ALREADY_PROCESSED" };
        }

        // More user-friendly error messages based on error type
        if (errorMessage.includes("insufficient funds")) {
          toast({
            title: "Transaction Error",
            description: "Insufficient funds for this payment",
            variant: "destructive",
          });
          throw new Error("Insufficient funds for this payment");
        } else if (errorMessage.includes("rejected")) {
          toast({
            title: "Transaction Error",
            description: "You rejected the transaction. Please try again",
            variant: "destructive",
          });
          throw new Error("Transaction was rejected. Please try again");
        } else if (errorMessage.includes("timeout")) {
          toast({
            title: "Transaction Error",
            description: "Transaction timed out. The network may be congested",
            variant: "destructive",
          });
          throw new Error(
            "Transaction timed out. The network may be congested",
          );
        } else {
          toast({
            title: "Transaction Error",
            description:
              error instanceof Error
                ? error.message
                : "Failed to send transaction",
            variant: "destructive",
          });
          throw new Error(
            error instanceof Error
              ? error.message
              : "Failed to send transaction",
          );
        }
      }
    },
    [wallet, toast],
  );

  // Context value
  const value = {
    wallet,
    isConnecting,
    connectWallet,
    disconnectWallet,
    sendTransaction,
  };

  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
};

// Add types for wallet extensions to avoid TypeScript errors
declare global {
  interface Window {
    phantom?: {
      solana: {
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
        signTransaction?: (transaction: Transaction) => Promise<Transaction>;
        signAllTransactions?: (
          transactions: Transaction[],
        ) => Promise<Transaction[]>;
      };
    };
    solflare?: {
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      signTransaction?: (transaction: Transaction) => Promise<Transaction>;
      signAllTransactions?: (
        transactions: Transaction[],
      ) => Promise<Transaction[]>;
    };
  }
}
