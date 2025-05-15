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
  // Password reset functions
  forgotPassword: (email: string) => Promise<{ message: string; resetUrl?: string; token?: string }>;
  verifyResetToken: (token: string) => Promise<{ valid: boolean; userId?: number }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
}

// Initialize with a default value that matches the shape
const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => { throw new Error('Not implemented'); },
  register: async () => { throw new Error('Not implemented'); },
  logout: async () => { throw new Error('Not implemented'); },
  forgotPassword: async () => { throw new Error('Not implemented'); },
  verifyResetToken: async () => { throw new Error('Not implemented'); },
  resetPassword: async () => { throw new Error('Not implemented'); },
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  // Check if we're on a path that shouldn't require authentication
  const { pathname } = window.location;
  const isAuthExemptPath = [
    '/reset-password',
    '/forgot-password',
    '/verify-email'
  ].some(path => pathname.startsWith(path));
  
  // Fetch current user, but skip for certain paths
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
    // Don't run the query at all on exempt paths
    enabled: !isAuthExemptPath,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { usernameOrEmail: string; password: string }) => {
      const res = await apiRequest('POST', '/api/login', credentials);
      if (!res.ok) {
        const errorData = await res.json();
        // Only throw the error message, not the entire response
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
  const register = async (userData: { username: string; email: string; password: string }) => {
    return await registerMutation.mutateAsync(userData);
  };

  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Password reset functions
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/forgot-password', { email });
      return await response.json();
    },
    onError: (error: any) => {
      console.error('Forgot password error:', error);
    }
  });

  const verifyResetTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      // Use a cache to prevent duplicate requests
      const cacheKey = `resetToken_${token}`;
      const cachedResult = sessionStorage.getItem(cacheKey);
      
      if (cachedResult) {
        try {
          return JSON.parse(cachedResult);
        } catch (e) {
          // If parsing fails, proceed with API call
          console.warn('Failed to parse cached token result');
        }
      }
      
      const response = await apiRequest('GET', `/api/verify-reset-token/${token}`);
      const data = await response.json();
      const result = { valid: !!data.userId, userId: data.userId };
      
      // Cache the result to prevent future requests
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (e) {
        console.warn('Failed to cache token result');
      }
      
      return result;
    },
    onError: (error: any) => {
      console.error('Token verification error:', error);
      return { valid: false };
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      try {
        const response = await apiRequest('POST', '/api/reset-password', { token, password });
        const data = await response.json();
        return { 
          success: response.ok, 
          message: data.message || 'Password updated successfully' 
        };
      } catch (error: any) {
        console.error('Reset password error:', error);
        throw new Error(error.message || 'Failed to reset password');
      }
    }
  });
  
  // Password reset function wrappers
  const forgotPassword = async (email: string) => {
    return await forgotPasswordMutation.mutateAsync(email);
  };
  
  const verifyResetToken = async (token: string) => {
    return await verifyResetTokenMutation.mutateAsync(token);
  };
  
  const resetPassword = async (token: string, password: string) => {
    return await resetPasswordMutation.mutateAsync({ token, password });
  };

  // Don't show loading state for auth-exempt paths when it's just the user loading
  const isLoading = (isAuthExemptPath ? false : isLoadingUser) || 
                   loginMutation.isPending || registerMutation.isPending || 
                   logoutMutation.isPending || forgotPasswordMutation.isPending || 
                   verifyResetTokenMutation.isPending || resetPasswordMutation.isPending;
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
        forgotPassword,
        verifyResetToken,
        resetPassword,
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
