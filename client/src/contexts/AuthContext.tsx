import { createContext, ReactNode, useContext } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '../lib/queryClient';
import { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { usernameOrEmail: string; password: string }) => Promise<User>;
  register: (userData: { username: string; email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
}

// Initialize with a default value that matches the shape
const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => { throw new Error('Not implemented'); },
  register: async () => { throw new Error('Not implemented'); },
  logout: async () => { throw new Error('Not implemented'); },
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  // Fetch current user
  const {
    data: user,
    isLoading: isLoadingUser,
    error,
  } = useQuery<User | null>({ 
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/user');
        if (!res.ok) {
          if (res.status === 401) return null;
          throw new Error('Failed to fetch user');
        }
        return await res.json();
      } catch (err) {
        console.error('Error fetching user:', err);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { usernameOrEmail: string; password: string }) => {
      const res = await apiRequest('POST', '/api/login', credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Login failed');
      }
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(['/api/user'], userData);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: { username: string; email: string; password: string }) => {
      const res = await apiRequest('POST', '/api/register', userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(['/api/user'], userData);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/logout');
      if (!res.ok) {
        throw new Error('Logout failed');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
    },
  });



  // Login function
  const login = async (credentials: { usernameOrEmail: string; password: string }) => {
    return await loginMutation.mutateAsync(credentials);
  };

  // Register function
  const register = async (userData: { username: string; email: string; password: string; displayName?: string }) => {
    return await registerMutation.mutateAsync(userData);
  };

  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const isLoading = isLoadingUser || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user: user || null, // Ensure user is either the user object or null, not undefined
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
