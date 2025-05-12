import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Award, Check, TrendingUp, Star, Sparkles, Book, FileText, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  useLoyaltyRewards, 
  formatTierName, 
  tierColors, 
  tierBackgroundColors, 
  LoyaltyTier 
} from "@/hooks/use-loyalty-rewards";

const tierIcons = {
  bronze: <Book className="h-5 w-5" />,
  silver: <FileText className="h-5 w-5" />,
  gold: <Star className="h-5 w-5" />,
  platinum: <Sparkles className="h-5 w-5" />
};

export function ResearchRewards() {
  const { user } = useAuth();
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  
  // Use our custom hook for loyalty rewards
  const {
    loyaltyData: rewardsData,
    isLoading,
    isError,
    isNotEnrolled,
    enroll,
    isEnrolling,
    upgrade,
    isUpgrading,
    showEnrollPrompt,
    refetchRewards
  } = useLoyaltyRewards();
  
  // Check if user is enrolled
  const isEnrolled = !!rewardsData?.loyaltyPass;
  
  // Show enrollment dialog if not enrolled
  useEffect(() => {
    if (isNotEnrolled || showEnrollPrompt) {
      setShowEnrollDialog(true);
    }
  }, [isNotEnrolled, showEnrollPrompt]);

  if (isLoading) return <LoadingSkeleton />;

  if (isError && !isNotEnrolled) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardHeader>
          <CardTitle className="text-amber-500">Research Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-gray-400">We're having trouble loading your research rewards data.</p>
          </div>
          <Button 
            variant="outline" 
            className="bg-stone-800 hover:bg-stone-700 border-stone-700 text-amber-500"
            onClick={() => refetchRewards()}
          >
            Try again
          </Button>
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
              <Button onClick={() => enroll(null)} disabled={isEnrolling}>
                {isEnrolling ? "Enrolling..." : "Enroll Now"}
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
            <CardTitle className="text-gray-900 font-semibold">AI Research Rewards</CardTitle>
            <CardDescription className="text-gray-800">Your research journey and achievements</CardDescription>
          </div>
          <Badge variant="outline" className={`${tierClass} border-current px-3 py-1 bg-black/10`}>
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
            {loyaltyPass.benefits ? (
              <>
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  {loyaltyPass.benefits.description}
                </div>
                <ul className="space-y-2">
                  {loyaltyPass.benefits.features && Array.isArray(loyaltyPass.benefits.features) ? (
                    loyaltyPass.benefits.features.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500">No specific benefits listed</li>
                  )}
                </ul>
              </>
            ) : (
              <div className="text-sm text-gray-500">
                No benefits available for this tier.
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        {nextTier && (
          <Button 
            variant="outline" 
            onClick={() => upgrade()}
            disabled={isUpgrading || nextTier.progress < 100}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            {isUpgrading ? "Checking..." : "Check for Upgrade"}
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