import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

export interface PrivyUser {
  id: string;
  wallet?: {
    address: string;
    chainId: string;
  };
  email?: string;
  wallets: Array<{
    address: string;
    walletClientType: string; // 'privy' for embedded or the name of the external wallet
    chainId: string;
  }>;
  linkedAccounts: {
    email?: {
      address: string;
      verified: boolean;
    };
    google?: {
      subject: string;
    };
    discord?: {
      username: string;
      discriminator: string;
    };
    github?: {
      username: string;
    };
    twitter?: {
      username: string;
    };
  };
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
  
  const { wallets } = useWallets();

  useEffect(() => {
    if (ready) {
      setIsInitializing(false);
      
      if (authenticated && privyUser) {
        // Format user data to our app's format
        setUser({
          id: privyUser.id,
          wallet: privyUser.wallet ? {
            address: privyUser.wallet.address,
            chainId: privyUser.wallet.chainId,
          } : undefined,
          email: privyUser.email?.address,
          wallets: privyUser.linkedAccounts.wallet.map(wallet => ({
            address: wallet.address,
            walletClientType: wallet.walletClientType,
            chainId: wallet.chainId,
          })),
          linkedAccounts: {
            email: privyUser.email ? {
              address: privyUser.email.address,
              verified: privyUser.email.verified,
            } : undefined,
            google: privyUser.google ? {
              subject: privyUser.google.subject,
            } : undefined,
            twitter: privyUser.twitter ? {
              username: privyUser.twitter.username,
            } : undefined,
            discord: privyUser.discord ? {
              username: privyUser.discord.username,
              discriminator: privyUser.discord.discriminator,
            } : undefined,
            github: privyUser.github ? {
              username: privyUser.github.username,
            } : undefined,
          },
        });
      } else {
        setUser(null);
      }
    }
  }, [ready, authenticated, privyUser]);

  // Handle wallet connection
  const connectWallet = async () => {
    if (!authenticated) {
      await login();
    } else {
      await linkWallet();
    }
  };

  // Create an embedded wallet
  const createEmbeddedWallet = async () => {
    if (!authenticated) {
      await login();
    } else {
      await createWallet();
    }
  };

  // Connect with email
  const connectWithEmail = async (email: string) => {
    if (!authenticated) {
      await login({ loginMethod: 'email', email });
    } else {
      await linkEmail(email);
    }
  };

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
    wallets,
  };
}