import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Star, ShieldCheck } from 'lucide-react';

// Define the loyalty pass tiers
export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

// Define the loyalty pass structure
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

interface LoyaltyPassProps {
  pass: LoyaltyPass;
  className?: string;
}

export function LoyaltyPassCard({ pass, className }: LoyaltyPassProps) {
  // Icon and color mappings for each tier
  const tierStyles = {
    bronze: {
      icon: <ShieldCheck className="h-5 w-5" />,
      color: 'bg-amber-600/20 text-amber-600 border-amber-600/50',
      title: 'Bronze',
    },
    silver: {
      icon: <Star className="h-5 w-5" />,
      color: 'bg-slate-300/20 text-slate-500 border-slate-400/50', 
      title: 'Silver',
    },
    gold: {
      icon: <Crown className="h-5 w-5" />,
      color: 'bg-yellow-400/20 text-yellow-600 border-yellow-500/50',
      title: 'Gold',
    },
  };

  // Get the style for the current tier
  const style = tierStyles[pass.tier];

  // Format date for display
  const formattedDate = new Date(pass.createdAt).toLocaleDateString();

  return (
    <Card className={`overflow-hidden border-2 ${className}`}>
      <div className={`${style.color} py-1 px-4 border-b flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          {style.icon}
          <span className="font-semibold">{style.title} Pass</span>
        </div>
        <Badge variant="outline" className={style.color}>
          Since {formattedDate}
        </Badge>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {pass.streamerName ? `${pass.streamerName}'s Channel` : 'Channel Pass'}
        </CardTitle>
        <CardDescription>
          {pass.benefits.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <h4 className="text-sm font-semibold mb-2">Benefits:</h4>
        <ul className="space-y-1 text-sm">
          {pass.benefits.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between">
        <div className="text-xs text-gray-500">ID: #{pass.id}</div>
      </CardFooter>
    </Card>
  );
}

interface LoyaltyPassesProps {
  passes: LoyaltyPass[];
  className?: string;
}

export function LoyaltyPasses({ passes, className }: LoyaltyPassesProps) {
  if (!passes || passes.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">No Loyalty Passes</p>
        <p className="text-sm mt-1">You don't have any loyalty passes yet.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {passes.map((pass) => (
        <LoyaltyPassCard key={pass.id} pass={pass} />
      ))}
    </div>
  );
}