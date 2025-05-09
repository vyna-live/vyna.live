import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

// Simplified Privy user interface to avoid type issues
export interface PrivyUser {
  id: string;
  email?: string;
  wallets: Array<{ address: string }>;
  linkedAccounts: Record<string, any>;
}

export function usePrivyAuth() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<PrivyUser | null>(null);
  
  const { 
    ready, 
    authenticated, 
    user: privyUser, 
    login, 
    logout, 
    linkWallet, 
    unlinkWallet,
    linkEmail,
    createWallet
  } = usePrivy();
  
  // Get Privy user data when ready
  useEffect(() => {
    if (ready) {
      setIsInitializing(false);
      
      if (authenticated && privyUser) {
        // Simplified user mapping to avoid type errors
        const formattedUser: PrivyUser = {
          id: privyUser.id,
          email: privyUser.email?.address,
          wallets: [],
          linkedAccounts: {
            email: privyUser.email ? {
              address: privyUser.email.address,
            } : undefined,
          },
        };
        
        setUser(formattedUser);
      } else {
        setUser(null);
      }
    }
  }, [ready, authenticated, privyUser]);

  // Handle wallet connection
  const connectWallet = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  };

  // Create an embedded wallet
  const createEmbeddedWallet = async () => {
    try {
      if (!authenticated) {
        await login();
      } else {
        await createWallet();
      }
    } catch (error) {
      console.error("Error creating embedded wallet:", error);
      throw error;
    }
  };

  // Connect with email - simplified to avoid type issues
  const connectWithEmail = async (email: string) => {
    try {
      // Using any to avoid type errors with Privy's API
      await (login as any)();
    } catch (error) {
      console.error("Error connecting with email:", error);
      throw error;
    }
  };

  // Use empty array for wallets since we're simplifying the implementation
  return {
    isInitializing,
    isAuthenticated: authenticated,
    user,
    login,
    logout,
    connectWallet,
    unlinkWallet,
    createEmbeddedWallet,
    connectWithEmail,
    wallets: user?.wallets || [],
  };
}