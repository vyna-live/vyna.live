import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import { ReactNode, useEffect } from 'react';

interface PrivyProviderProps {
  children: ReactNode;
}

export const PrivyProvider = ({ children }: PrivyProviderProps) => {
  // Handle Privy config
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

  useEffect(() => {
    if (!privyAppId) {
      console.warn("VITE_PRIVY_APP_ID environment variable is not set. Web3 features will not work correctly.");
    }
  }, [privyAppId]);

  // For development purposes, we'll use a simple configuration
  // In production, we would need proper wallet chain configurations
  return (
    <BasePrivyProvider
      appId={privyAppId || ""}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#A67D44',
          logo: '/logo.png',
        },
      }}
    >
      {children}
    </BasePrivyProvider>
  );
};

export default PrivyProvider;