import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoyaltyPasses, LoyaltyTier } from '@/components/LoyaltyPass';
import { Loader2, MessageSquare, ShieldCheck, BadgeCheck } from 'lucide-react';
import { useLocation } from 'wouter';

interface LoyaltyPass {
  id: number;
  streamerId: number;
  audienceId: number;
  tier: LoyaltyTier;
  createdAt: string;
  benefits: {
    description: string;
    features: string[];
  };
  streamerName?: string;
}

const ProfilePage = () => {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('passes');
  const [audiencePasses, setAudiencePasses] = useState<LoyaltyPass[]>([]);
  const [issuedPasses, setIssuedPasses] = useState<LoyaltyPass[]>([]);
  const [isLoadingPasses, setIsLoadingPasses] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchAudiencePasses();
      fetchStreamerPasses();
    }
  }, [user]);
  
  const fetchAudiencePasses = async () => {
    setIsLoadingPasses(true);
    try {
      const response = await fetch('/api/loyalty/audience/passes');
      if (!response.ok) {
        throw new Error('Failed to fetch audience passes');
      }
      const data = await response.json();
      setAudiencePasses(data);
    } catch (error) {
      console.error('Error fetching audience passes:', error);
      toast({
        title: 'Error fetching passes',
        description: 'Failed to load your loyalty passes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingPasses(false);
    }
  };
  
  const fetchStreamerPasses = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/loyalty/streamer/passes');
      if (!response.ok) {
        throw new Error('Failed to fetch streamer passes');
      }
      const data = await response.json();
      setIssuedPasses(data);
    } catch (error) {
      console.error('Error fetching streamer passes:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-gray-500 mb-4">Please sign in to view your profile</p>
          <Button onClick={() => setLocation('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-black text-white rounded-lg p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center text-2xl">
            {user.displayName ? user.displayName[0] : user.username[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.displayName || user.username}</h1>
            <p className="text-gray-400">@{user.username}</p>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="passes" className="text-sm sm:text-base">
            <ShieldCheck className="h-4 w-4 mr-2" />
            My Loyalty Passes
          </TabsTrigger>
          <TabsTrigger value="issued" className="text-sm sm:text-base">
            <BadgeCheck className="h-4 w-4 mr-2" />
            Issued Passes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="passes" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Your Loyalty Passes</h2>
          {isLoadingPasses ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          ) : (
            <LoyaltyPasses passes={audiencePasses} />
          )}
        </TabsContent>
        
        <TabsContent value="issued" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Passes You've Issued</h2>
          {issuedPasses.length === 0 ? (
            <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-lg">
              <BadgeCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No Issued Passes</p>
              <p className="text-sm mt-1">You haven't issued any loyalty passes to your audience yet.</p>
              <Button variant="outline" className="mt-4" onClick={() => setLocation('/livestream')}>
                Start Streaming
              </Button>
            </div>
          ) : (
            <LoyaltyPasses passes={issuedPasses} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;