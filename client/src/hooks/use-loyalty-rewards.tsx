import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define loyalty tier types
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyPass {
  id: number;
  userId: number;
  tier: LoyaltyTier;
  xpPoints: number;
  walletAddress: string | null;
  benefits: string[];
  verxioId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyActivity {
  id: number;
  userId: number;
  activityType: string;
  pointsEarned: number;
  description: string;
  createdAt: string;
}

export interface LoyaltyResponse {
  loyaltyPass: LoyaltyPass;
  recentActivities: LoyaltyActivity[];
  nextTier: {
    name: string;
    progress: number;
    currentXp: number;
    xpNeeded: number;
    benefits: string[];
  } | null;
}

export function useLoyaltyRewards() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showEnrollPrompt, setShowEnrollPrompt] = useState(false);

  // Query for loyalty data
  const {
    data: loyaltyData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<LoyaltyResponse>({
    queryKey: ['/api/research/rewards/user'],
    enabled: !!isAuthenticated,
  });

  // Check if not enrolled
  const isNotEnrolled = isError && (error as any)?.status === 404;

  useEffect(() => {
    if (isNotEnrolled && isAuthenticated) {
      setShowEnrollPrompt(true);
    }
  }, [isNotEnrolled, isAuthenticated]);

  // Enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: async (walletAddress: string | null = null) => {
      const response = await apiRequest('POST', '/api/research/rewards/enroll', { walletAddress });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/research/rewards/user'] });
      toast({
        title: 'Welcome to AI Research Rewards!',
        description: 'You\'ve successfully enrolled in the program.',
      });
      setShowEnrollPrompt(false);
    },
    onError: (error) => {
      toast({
        title: 'Enrollment failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Award points mutation
  const awardPointsMutation = useMutation({
    mutationFn: async ({ activityType, description }: { activityType: string, description: string }) => {
      const response = await apiRequest('POST', '/api/research/rewards/points', {
        activityType,
        description
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/research/rewards/user'] });
      toast({
        title: 'Research Points Earned!',
        description: `+${data.pointsAwarded} XP added to your research profile`,
      });
      
      // If user should upgrade, notify them
      if (data.shouldUpgrade) {
        toast({
          title: 'Tier Upgrade Available!',
          description: `You can now upgrade to ${data.nextTier} tier`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to award research points. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Upgrade mutation
  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/research/rewards/upgrade');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/research/rewards/user'] });
      if (data.success) {
        toast({
          title: 'Tier Upgraded!',
          description: data.message,
        });
      } else {
        toast({
          description: data.message,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Upgrade failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Helper function to check if points can be awarded for an activity
  const canAwardPointsForActivity = (activityType: string): boolean => {
    if (!isAuthenticated) return false;
    if (!loyaltyData?.loyaltyPass) return false;
    
    // Check if user already did this activity recently
    const recentActivities = loyaltyData.recentActivities || [];
    const lastActivity = recentActivities.find(a => a.activityType === activityType);
    
    if (!lastActivity) return true;
    
    // Check if the activity was done within the last hour
    const activityTime = new Date(lastActivity.createdAt).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    return (now - activityTime) > oneHour;
  };

  return {
    loyaltyData,
    isLoading,
    isError: isError && !isNotEnrolled,
    isNotEnrolled,
    showEnrollPrompt,
    setShowEnrollPrompt,
    enroll: enrollMutation.mutate,
    isEnrolling: enrollMutation.isPending,
    awardPoints: awardPointsMutation.mutate,
    isAwarding: awardPointsMutation.isPending,
    upgrade: upgradeMutation.mutate,
    isUpgrading: upgradeMutation.isPending,
    canAwardPointsForActivity,
    refetchRewards: refetch
  };
}

// Helper functions for formatting
export function formatTierName(tier: LoyaltyTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export const tierColors: Record<LoyaltyTier, string> = {
  bronze: 'text-amber-700',
  silver: 'text-slate-400',
  gold: 'text-yellow-400',
  platinum: 'text-indigo-400'
};

export const tierBackgroundColors: Record<LoyaltyTier, string> = {
  bronze: 'bg-amber-100',
  silver: 'bg-slate-100',
  gold: 'bg-yellow-100',
  platinum: 'bg-indigo-100'
};