import { createContext, ReactNode, useContext } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';

interface PasswordResetContextType {
  verifyResetToken: (token: string) => Promise<{ valid: boolean; userId?: number }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
}

// Initialize with default values
const defaultContext: PasswordResetContextType = {
  verifyResetToken: async () => { throw new Error('Not implemented'); },
  resetPassword: async () => { throw new Error('Not implemented'); },
};

const PasswordResetContext = createContext<PasswordResetContextType>(defaultContext);

export const PasswordResetProvider = ({ children }: { children: ReactNode }) => {
  // Token verification mutation
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

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const response = await apiRequest('POST', '/api/reset-password', { token, password });
      return await response.json();
    },
    onError: (error: any) => {
      console.error('Password reset error:', error);
      return { success: false, message: 'Failed to reset password' };
    }
  });

  // Functions exposed to components
  const verifyResetToken = (token: string) => {
    return verifyResetTokenMutation.mutateAsync(token);
  };

  const resetPassword = (token: string, password: string) => {
    return resetPasswordMutation.mutateAsync({ token, password });
  };

  const contextValue: PasswordResetContextType = {
    verifyResetToken,
    resetPassword,
  };

  return (
    <PasswordResetContext.Provider value={contextValue}>
      {children}
    </PasswordResetContext.Provider>
  );
};

export const usePasswordReset = () => {
  const context = useContext(PasswordResetContext);
  if (!context) {
    throw new Error('usePasswordReset must be used within a PasswordResetProvider');
  }
  return context;
};