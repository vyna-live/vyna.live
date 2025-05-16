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
  getAccount,
} from "@solana/spl-token";

// Set up Buffer for browser environment
import { Buffer } from "buffer";
// Make buffer available globally for the SPL token library
globalThis.Buffer = globalThis.Buffer || Buffer;

// For adding a memo to each transaction to prevent duplicate processing
const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

// USDC Token Mint address (using Devnet USDC for testing)
// This is the official Devnet USDC mint address
const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

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

// Global type augmentation for browser wallet providers
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

  // Send USDC token transaction
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
        title: "Preparing USDC payment",
        description: "Setting up your subscription payment...",
      });

      try {
        // Connect to Solana devnet (or mainnet in production)
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

        // Parse sender and recipient addresses
        const senderPublicKey = new PublicKey(wallet.publicKey);
        const recipientPublicKey = new PublicKey(recipient);

        // Create a new transaction
        const transaction = new Transaction();

        // Generate payment ID to track this specific transaction
        const paymentId =
          Date.now().toString() + Math.random().toString(36).substring(2, 8);

        // Log transaction participants
        console.log("USDC Payment Transaction:");
        console.log(`- Sender: ${senderPublicKey.toString()}`);
        console.log(`- Recipient: ${recipientPublicKey.toString()}`);
        console.log(`- Payment ID: ${paymentId}`);

        // Convert the payment amount to USDC token units (with 6 decimals)
        const amountInUSDC = parseFloat(amount);
        const tokenAmount = BigInt(amountInUSDC * 10 ** USDC_DECIMALS);
        console.log(
          `- Amount: ${amountInUSDC} USDC (${tokenAmount} base units)`,
        );

        // Get the sender's associated token account for USDC
        const senderTokenAccount = await getAssociatedTokenAddress(
          USDC_MINT,
          senderPublicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );
        console.log(`- Sender token account: ${senderTokenAccount.toString()}`);

        const usdcAccount = await getAccount(connection, senderTokenAccount);
        console.log("USDC Balance:", Number(usdcAccount.amount) / 1_000_000);

        // Get recipient's associated token account
        const recipientTokenAccount = await getAssociatedTokenAddress(
          USDC_MINT,
          recipientPublicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );
        console.log(
          `- Recipient token account: ${recipientTokenAccount.toString()}`,
        );

        // Check if recipient token account exists
        const recipientAccountInfo = await connection.getAccountInfo(
          recipientTokenAccount,
        );

        // If recipient token account doesn't exist, create it
        if (!recipientAccountInfo) {
          console.log("Creating recipient token account - it doesn't exist");

          transaction.add(
            createAssociatedTokenAccountInstruction(
              senderPublicKey,
              recipientTokenAccount,
              recipientPublicKey,
              USDC_MINT,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID,
            ),
          );
          console.log("Added recipient token account creation instruction");
        }

        // Add the token transfer instruction
        transaction.add(
          createTransferInstruction(
            senderTokenAccount,
            recipientTokenAccount,
            senderPublicKey,
            tokenAmount,
            [],
            TOKEN_PROGRAM_ID,
          ),
        );
        console.log("Added USDC token transfer instruction");

        // Add memo instruction with payment details
        const memoMessage = `Vyna.live USDC payment: ${paymentId}`;
        const memoData = Buffer.from(memoMessage, "utf-8");

        const memoInstruction = new TransactionInstruction({
          keys: [],
          programId: MEMO_PROGRAM_ID,
          data: memoData,
        });

        // Add memo instruction to transaction
        transaction.add(memoInstruction);

        // Get recent blockhash and set transaction fee payer
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = senderPublicKey;

        console.log(
          "Transaction prepared with instructions:",
          transaction.instructions.length,
        );
        console.log("Transaction ready with blockhash:", blockhash);

        // Sign and send the transaction based on wallet provider
        let signature = "";

        if (wallet.provider === "phantom" && window.phantom?.solana) {
          toast({
            title: "Waiting for approval",
            description:
              "Please approve the transaction in your Phantom wallet",
          });

          try {
            // Request Phantom wallet signature
            console.log("Requesting Phantom wallet signature");
            const signedTransaction =
              await window.phantom.solana.signTransaction?.(transaction);

            if (!signedTransaction) {
              throw new Error("Failed to sign transaction with Phantom wallet");
            }

            toast({
              title: "Sending transaction",
              description: "Your USDC payment is being processed...",
            });

            console.log("Transaction signed, sending to Solana network");

            // Send the transaction to the Solana network
            const txSignature = await connection.sendRawTransaction(
              signedTransaction.serialize(),
              {
                skipPreflight: false,
                maxRetries: 3,
                preflightCommitment: "confirmed",
              },
            );

            signature = txSignature;
            console.log("Transaction sent with signature:", txSignature);
            console.log(
              `Solana Explorer URL: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
            );

            // Wait for transaction confirmation with timeout
            try {
              const confirmation = await connection.confirmTransaction(
                {
                  signature: txSignature,
                  blockhash: blockhash,
                  lastValidBlockHeight: lastValidBlockHeight,
                },
                "confirmed",
              );

              if (confirmation.value.err) {
                console.error(
                  "Transaction confirmed but has errors:",
                  confirmation.value.err,
                );
                throw new Error(
                  `Transaction failed: ${confirmation.value.err}`,
                );
              }

              console.log("Transaction confirmed successfully:", confirmation);
            } catch (error) {
              console.error("Error confirming transaction:", error);

              // Check if the transaction was successful anyway
              const signatureStatus =
                await connection.getSignatureStatus(txSignature);
              if (signatureStatus.value && !signatureStatus.value.err) {
                console.log(
                  "Transaction successful despite confirmation error",
                );
              } else {
                // Safe error message extraction
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                throw new Error(`Transaction may have failed: ${errorMessage}`);
              }
            }

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
            // Request Solflare wallet signature
            console.log("Requesting Solflare wallet signature");
            const signedTransaction =
              await window.solflare.signTransaction?.(transaction);

            if (!signedTransaction) {
              throw new Error(
                "Failed to sign transaction with Solflare wallet",
              );
            }

            toast({
              title: "Sending transaction",
              description: "Your USDC payment is being processed...",
            });

            console.log("Transaction signed, sending to Solana network");

            // Send the transaction to the Solana network
            const txSignature = await connection.sendRawTransaction(
              signedTransaction.serialize(),
              {
                skipPreflight: false,
                maxRetries: 3,
                preflightCommitment: "confirmed",
              },
            );

            signature = txSignature;
            console.log("Transaction sent with signature:", txSignature);
            console.log(
              `Solana Explorer URL: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
            );

            // Wait for transaction confirmation with timeout
            try {
              const confirmation = await connection.confirmTransaction(
                {
                  signature: txSignature,
                  blockhash: blockhash,
                  lastValidBlockHeight: lastValidBlockHeight,
                },
                "confirmed",
              );

              if (confirmation.value.err) {
                console.error(
                  "Transaction confirmed but has errors:",
                  confirmation.value.err,
                );
                throw new Error(
                  `Transaction failed: ${confirmation.value.err}`,
                );
              }

              console.log("Transaction confirmed successfully:", confirmation);
            } catch (error) {
              console.error("Error confirming transaction:", error);

              // Check if the transaction was successful anyway
              const signatureStatus =
                await connection.getSignatureStatus(txSignature);
              if (signatureStatus.value && !signatureStatus.value.err) {
                console.log(
                  "Transaction successful despite confirmation error",
                );
              } else {
                // Safe error message extraction
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                throw new Error(`Transaction may have failed: ${errorMessage}`);
              }
            }

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

            const errorMessage = String(error).toLowerCase();
            if (errorMessage.includes("already been processed")) {
              toast({
                title: "Transaction Note",
                description:
                  "This transaction appears to have already been processed successfully.",
                variant: "default",
              });

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
        console.error("Error in sendTransaction:", error);
        toast({
          title: "Payment error",
          description:
            "There was an error processing your USDC payment. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [wallet, toast],
  );

  return (
    <SolanaWalletContext.Provider
      value={{
        wallet,
        isConnecting,
        connectWallet,
        disconnectWallet,
        sendTransaction,
      }}
    >
      {children}
    </SolanaWalletContext.Provider>
  );
};
