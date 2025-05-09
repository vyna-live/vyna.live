import React, { ReactNode } from 'react';
import { PrivyProvider as ActualPrivyProvider } from '@privy-io/react-auth';
import { useToast } from '@/hooks/use-toast';

interface PrivyProviderProps {
  children: ReactNode;
}

export default function PrivyProvider({ children }: PrivyProviderProps) {
  const { toast } = useToast();

  // Configuration for Privy
  const config = {
    appId: import.meta.env.PRIVY_APP_ID as string,
    onError: (error: Error) => {
      console.error('Privy error:', error);
      toast({
        title: 'Authentication Error',
        description: 'There was an issue with authentication. Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Successfully authenticated with wallet',
        variant: 'default',
      });
    },
    appearance: {
      theme: 'dark',
      accentColor: '#DCC5A2',
      logo: '/logo.png',
    },
    // Configure wallet options
    walletConnectors: [
      // External wallets
      {
        name: 'metamask',
        options: {}
      },
      {
        name: 'walletconnect',
        options: {}
      },
      {
        name: 'phantom',  // For Solana transactions
        options: {}
      },
      // Other options like Coinbase Wallet can be added here
    ],
    // Enable embedded wallets - allows for email/social login without external wallet
    embeddedWallets: {
      createOnLogin: 'all-users', // Create an embedded wallet for all users who log in
      noPromptOnSignature: false, // Show prompts when requesting signatures
    },
  };

  return (
    <ActualPrivyProvider {...config}>
      {children}
    </ActualPrivyProvider>
  );
}