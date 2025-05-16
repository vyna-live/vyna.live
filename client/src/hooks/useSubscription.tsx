import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Subscription hook for managing user subscription data and actions
export function useSubscription() {
  // Get subscription tiers
  const {
    data: tiers = [],
    isLoading: isLoadingTiers,
    error: tiersError,
  } = useQuery({
    queryKey: ['/api/subscription/tiers'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/subscription/tiers');
      return res.json();
    },
  });

  // Get user's current subscription status
  const {
    data: status,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['/api/subscription/status'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/subscription/status');
        if (res.status === 401) {
          return null; // User not logged in
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        return null;
      }
    },
  });

  // Subscribe to a plan
  const subscribeMutation = useMutation({
    mutationFn: async ({ 
      tierId, 
      paymentMethod, 
      transactionSignature 
    }: { 
      tierId: string; 
      paymentMethod: string;
      transactionSignature?: string;
    }) => {
      const res = await apiRequest('POST', '/api/subscription/create', {
        tierId,
        paymentMethod,
        transactionSignature,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
  });

  return {
    tiers,
    status,
    isLoadingTiers,
    isLoadingStatus,
    tiersError,
    statusError,
    subscribe: subscribeMutation.mutate,
    isSubscribing: subscribeMutation.isPending,
    subscribeError: subscribeMutation.error,
    refetchStatus,
  };
}