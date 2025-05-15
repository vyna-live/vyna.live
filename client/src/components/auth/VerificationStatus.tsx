import React, { useState } from 'react';
import { User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface VerificationStatusProps {
  user: User;
}

export default function VerificationStatus({ user }: VerificationStatusProps) {
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  
  // Don't show if email is already verified or if user doesn't have an email
  if (!user.email || user.isEmailVerified) {
    return null;
  }
  
  const handleResendVerification = async () => {
    if (isResending) return;
    
    setIsResending(true);
    try {
      const response = await apiRequest('POST', '/api/resend-verification');
      
      if (response.ok) {
        toast({
          title: 'Verification Email Sent',
          description: 'Please check your inbox for the verification link.',
          variant: 'default',
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resend verification email',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };
  
  return (
    <Alert className="bg-amber-900/20 border-amber-600/30 mt-4">
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-amber-400">
          Please verify your email address to unlock all features.
        </span>
        <Button 
          variant="outline"
          size="sm"
          onClick={handleResendVerification}
          disabled={isResending}
          className="text-xs h-8 border-amber-600/50 text-amber-400 hover:bg-amber-900/30"
        >
          {isResending ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          ) : (
            <span className="flex items-center">
              <Mail className="mr-1 h-3 w-3" />
              Resend Verification
            </span>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}