import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Award, Check, TrendingUp, Star, Sparkles, Book, FileText, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define loyalty tier types
type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

interface LoyaltyPass {
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

interface LoyaltyActivity {
  id: number;
  userId: number;
  activityType: string;
  pointsEarned: number;
  description: string;
  createdAt: string;
}

interface LoyaltyResponse {
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

const tierColors = {
  bronze: "text-amber-700",
  silver: "text-slate-400",
  gold: "text-yellow-400",
  platinum: "text-indigo-400"
};

const tierBackgroundColors = {
  bronze: "bg-amber-100",
  silver: "bg-slate-100",
  gold: "bg-yellow-100",
  platinum: "bg-indigo-100"
};

const tierIcons = {
  bronze: <Book className="h-5 w-5" />,
  silver: <FileText className="h-5 w-5" />,
  gold: <Star className="h-5 w-5" />,
  platinum: <Sparkles className="h-5 w-5" />
};

export function ResearchRewards() {
  const { user } = useAuth();
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  // Query for loyalty pass
  const { 
    data: rewardsData, 
    isLoading, 
    isError, 
    error
  } = useQuery<LoyaltyResponse>({
    queryKey: ['/api/research/rewards/user'],
    enabled: !!user,
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/research/rewards/enroll', { walletAddress: null });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/research/rewards/user'] });
      toast({
        title: "Welcome to AI Research Rewards!",
        description: "You've successfully enrolled in the program.",
      });
      setShowEnrollDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Enrollment failed",
        description: error.message,
        variant: "destructive",
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
          title: "Tier Upgraded!",
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
        title: "Upgrade failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Check if user is enrolled
  const isEnrolled = !!rewardsData?.loyaltyPass;
  const isNotFound = isError && (error as any)?.status === 404;

  // Handle 404 (not enrolled yet)
  useEffect(() => {
    if (isNotFound) {
      setShowEnrollDialog(true);
    }
  }, [isNotFound]);

  if (isLoading) return <LoadingSkeleton />;

  if (isError && !isNotFound) {
    return (
      <Card className="border-red-200 bg-red-50 mb-6">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Research Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">There was a problem loading your research rewards. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isEnrolled) {
    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>AI Research Rewards</CardTitle>
            <CardDescription>Join our research rewards program to earn points and unlock benefits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6">
              <Award className="h-16 w-16 text-amber-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Enhance Your Research Experience</h3>
              <p className="text-center text-gray-500 mb-4">
                Earn points for every research action and unlock exclusive benefits as you progress through tiers.
              </p>
              <Button onClick={() => setShowEnrollDialog(true)}>
                Enroll Now
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join AI Research Rewards</DialogTitle>
              <DialogDescription>
                Earn points for conducting research, sharing insights, and providing feedback.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <h4 className="font-medium mb-2">Program Benefits:</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Earn XP for research activities</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Unlock advanced research tools</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Get priority support and exclusive features</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Early access to new AI models</span>
                </li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEnrollDialog(false)}>Cancel</Button>
              <Button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
                {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // User is enrolled, display their loyalty pass and progress
  const { loyaltyPass, recentActivities, nextTier } = rewardsData;
  const tierDisplay = loyaltyPass.tier.charAt(0).toUpperCase() + loyaltyPass.tier.slice(1);
  const tierClass = tierColors[loyaltyPass.tier as LoyaltyTier] || "text-gray-500";
  const tierBgClass = tierBackgroundColors[loyaltyPass.tier as LoyaltyTier] || "bg-gray-100";
  const tierIcon = tierIcons[loyaltyPass.tier as LoyaltyTier] || <Award className="h-5 w-5" />;

  return (
    <Card className="mb-6">
      <CardHeader className={`${tierBgClass} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Research Rewards</CardTitle>
            <CardDescription>Your research journey and achievements</CardDescription>
          </div>
          <Badge variant="outline" className={`${tierClass} border-current px-3 py-1`}>
            <div className="flex items-center gap-1">
              {tierIcon}
              <span>{tierDisplay} Researcher</span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* XP and Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">{loyaltyPass.xpPoints} XP</div>
              {nextTier && (
                <div className="text-sm text-gray-500">
                  {nextTier.xpNeeded - nextTier.currentXp} XP to {nextTier.name}
                </div>
              )}
            </div>
            {nextTier && (
              <Progress value={nextTier.progress} className="h-2" />
            )}
          </div>

          {/* Recent Activities */}
          {recentActivities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Activities</h3>
              <ul className="space-y-3">
                {recentActivities.slice(0, 3).map((activity) => (
                  <li key={activity.id} className="flex items-start justify-between text-sm">
                    <div className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <ActivityIcon type={activity.activityType} />
                      </div>
                      <span>{activity.description}</span>
                    </div>
                    <Badge variant="outline" className="font-medium">
                      +{activity.pointsEarned} XP
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Current Benefits</h3>
            <ul className="space-y-2">
              {loyaltyPass.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        {nextTier && (
          <Button 
            variant="outline" 
            onClick={() => upgradeMutation.mutate()}
            disabled={upgradeMutation.isPending || nextTier.progress < 100}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            {upgradeMutation.isPending ? "Checking..." : "Check for Upgrade"}
          </Button>
        )}
        <Button variant="link" className="text-gray-500" onClick={() => window.open('/research-rewards', '_blank')}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch(type) {
    case 'completeResearch':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'shareInsight':
      return <Star className="h-4 w-4 text-amber-500" />;
    case 'provideFeedback':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'dailyLogin':
      return <Zap className="h-4 w-4 text-purple-500" />;
    default:
      return <Award className="h-4 w-4 text-gray-500" />;
  }
}

function LoadingSkeleton() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-[180px] mb-2" />
            <Skeleton className="h-4 w-[240px]" />
          </div>
          <Skeleton className="h-8 w-[120px]" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-5 w-[50px]" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          
          <div>
            <Skeleton className="h-4 w-[150px] mb-3" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-3" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-6 w-[60px]" />
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Skeleton className="h-4 w-[150px] mb-3" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2" />
                  <Skeleton className="h-4 w-[250px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-8 w-[100px]" />
      </CardFooter>
    </Card>
  );
}