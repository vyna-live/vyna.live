import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { usePrivyAuth, PrivyUser } from '@/hooks/usePrivyAuth';
import { User } from '@shared/schema';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '../lib/queryClient';

interface PrivyAuthContextType {
  user: User | null;
  privyUser: PrivyUser | null;
  isLoading: boolean;
  isPrivyInitializing: boolean;
  isAuthenticated: boolean;
  connectWallet: () => Promise<void>;
  createEmbeddedWallet: () => Promise<void>;
  connectWithEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  wallets: any[];
}

// Initialize with a default value that matches the shape
const defaultPrivyAuthContext: PrivyAuthContextType = {
  user: null,
  privyUser: null,
  isLoading: false,
  isPrivyInitializing: true,
  isAuthenticated: false,
  connectWallet: async () => { throw new Error('Not implemented'); },
  createEmbeddedWallet: async () => { throw new Error('Not implemented'); },
  connectWithEmail: async () => { throw new Error('Not implemented'); },
  logout: async () => { throw new Error('Not implemented'); },
  wallets: [],
};

const PrivyAuthContext = createContext<PrivyAuthContextType>(defaultPrivyAuthContext);

export const PrivyAuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    isInitializing: isPrivyInitializing,
    isAuthenticated: isPrivyAuthenticated,
    user: privyUser,
    logout: privyLogout,
    connectWallet,
    createEmbeddedWallet,
    connectWithEmail,
    wallets
  } = usePrivyAuth();

  const [backendAuthenticated, setBackendAuthenticated] = useState(false);
  
  // Fetch current user from our backend
  const {
    data: user,
    isLoading: isLoadingUser,
    refetch: refetchUser,
  } = useQuery<User | null>({ 
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/user');
        if (!res.ok) {
          if (res.status === 401) return null;
          throw new Error('Failed to fetch user');
        }
        const userData = await res.json();
        setBackendAuthenticated(true);
        return userData;
      } catch (err) {
        console.error('Error fetching user:', err);
        setBackendAuthenticated(false);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Login to our backend with Privy credentials
  const loginBackendMutation = useMutation({
    mutationFn: async (privyId: string) => {
      const res = await apiRequest('POST', '/api/privy/login', { privyId });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Backend login failed');
      }
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(['/api/user'], userData);
      setBackendAuthenticated(true);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // First logout from our backend
      const res = await apiRequest('POST', '/api/logout');
      if (!res.ok) {
        throw new Error('Backend logout failed');
      }
      
      // Then logout from Privy
      await privyLogout();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      setBackendAuthenticated(false);
    },
  });

  // Sync Privy authentication with our backend
  useEffect(() => {
    const syncAuth = async () => {
      if (!isPrivyInitializing && isPrivyAuthenticated && privyUser) {
        if (!backendAuthenticated && !loginBackendMutation.isPending) {
          // If authenticated with Privy but not with our backend, login to backend
          try {
            await loginBackendMutation.mutateAsync(privyUser.id);
          } catch (error) {
            console.error('Error syncing with backend:', error);
          }
        }
      } else if (!isPrivyInitializing && !isPrivyAuthenticated && backendAuthenticated) {
        // If logged out of Privy but still logged in on backend, logout from backend
        await logoutMutation.mutateAsync();
      }
    };

    syncAuth();
  }, [isPrivyInitializing, isPrivyAuthenticated, privyUser, backendAuthenticated]);

  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const isLoading = isPrivyInitializing || isLoadingUser || loginBackendMutation.isPending || logoutMutation.isPending;
  const isAuthenticated = backendAuthenticated && isPrivyAuthenticated;

  return (
    <PrivyAuthContext.Provider
      value={{
        user: user || null,
        privyUser,
        isLoading,
        isPrivyInitializing,
        isAuthenticated,
        connectWallet,
        createEmbeddedWallet,
        connectWithEmail,
        logout,
        wallets,
      }}
    >
      {children}
    </PrivyAuthContext.Provider>
  );
};

export function usePrivyAuthContext() {
  const context = useContext(PrivyAuthContext);
  if (context === undefined) {
    throw new Error('usePrivyAuthContext must be used within a PrivyAuthProvider');
  }
  return context;
}