import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { ResearchRewards } from '@/components/ResearchRewards';
import { 
  Award, 
  FileText, 
  Star, 
  Sparkles, 
  ChevronLeft, 
  Check, 
  BarChart3,
  TrendingUp,
  MessageCircle
} from 'lucide-react';
import Logo from '@/components/Logo';
import UserAvatar from '@/components/UserAvatar';

export default function ResearchRewardsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  
  const tiers = [
    {
      name: 'Bronze Researcher',
      icon: <FileText className="h-7 w-7 text-amber-700" />,
      description: 'Begin your research journey',
      xpRequired: '0',
      benefits: [
        'Access to basic AI research tools',
        'Earn points for every research query',
        'Track your research progress',
        'Basic visualization tools'
      ]
    },
    {
      name: 'Silver Researcher',
      icon: <Star className="h-7 w-7 text-slate-400" />,
      description: 'Expand your research capabilities',
      xpRequired: '500',
      benefits: [
        'All Bronze benefits',
        'Increased daily research quota',
        'Advanced data visualization',
        'Export research to multiple formats'
      ]
    },
    {
      name: 'Gold Researcher',
      icon: <Award className="h-7 w-7 text-yellow-400" />,
      description: 'Become a research expert',
      xpRequired: '1,000',
      benefits: [
        'All Silver benefits',
        'Priority research query processing',
        'Early access to new research models',
        'Collaborative research tools'
      ]
    },
    {
      name: 'Platinum Researcher',
      icon: <Sparkles className="h-7 w-7 text-indigo-400" />,
      description: 'Master the art of AI research',
      xpRequired: '2,000',
      benefits: [
        'All Gold benefits',
        'Unlimited research queries',
        'Custom research domains',
        'Research API access',
        'Dedicated support for research projects'
      ]
    }
  ];
  
  const pointActivities = [
    {
      icon: <TrendingUp size={16} className="text-blue-500" />,
      name: 'Complete Research',
      description: 'Perform AI-assisted research queries',
      points: 10
    },
    {
      icon: <Star size={16} className="text-amber-500" />,
      name: 'Share Insight',
      description: 'Share valuable findings from your research',
      points: 25
    },
    {
      icon: <MessageCircle size={16} className="text-green-500" />,
      name: 'Provide Feedback',
      description: 'Give feedback on research results quality',
      points: 15
    },
    {
      icon: <BarChart3 size={16} className="text-purple-500" />,
      name: 'Daily Login',
      description: 'Login and perform research daily',
      points: 5
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#DCC5A2]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <Award className="h-20 w-20 text-[#DCC5A2] mb-6" />
        <h1 className="text-3xl font-bold mb-4">AI Research Rewards</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Please login to view your research rewards and progress
        </p>
        <Link to="/auth">
          <button className="bg-[#DCC5A2] text-[#121212] px-6 py-2 rounded-lg font-medium hover:bg-[#C4A87A] transition-colors">
            Login
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-6 border-b border-[#202020]">
        <div className="flex items-center">
          <Logo size="sm" />
        </div>
        <UserAvatar />
      </header>

      {/* Main content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
        {/* Back button and title */}
        <div className="flex items-center mb-8">
          <Link to="/">
            <button className="flex items-center text-[#999999] hover:text-white transition-colors">
              <ChevronLeft size={20} />
              <span className="ml-1">Back to home</span>
            </button>
          </Link>
        </div>

        <div className="flex items-center mb-6">
          <Award className="h-9 w-9 text-[#DCC5A2] mr-4" />
          <h1 className="text-3xl font-bold">AI Research Rewards</h1>
        </div>

        <p className="text-gray-400 mb-10 max-w-2xl">
          Our AI Research Rewards program recognizes your contributions and dedication 
          to research. Earn points for your research activities and unlock valuable 
          benefits as you progress through researcher tiers.
        </p>

        {/* Rewards component */}
        <ResearchRewards />

        {/* Program details */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-6">Research Tier Benefits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {tiers.map((tier, index) => (
              <div 
                key={index} 
                className="bg-[#1A1A1A] rounded-lg p-6 border border-[#333]"
              >
                <div className="flex items-center mb-4">
                  {tier.icon}
                  <div className="ml-3">
                    <h3 className="font-bold">{tier.name}</h3>
                    <p className="text-sm text-gray-400">{tier.xpRequired} XP required</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">{tier.description}</p>
                <ul className="space-y-2">
                  {tier.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold mb-6">How to Earn Points</h2>
          
          <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#333] mb-12">
            <p className="text-gray-300 mb-6">
              Complete these research activities to earn XP points and advance through tiers.
              Points accumulate over time and contribute to your researcher level.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {pointActivities.map((activity, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center flex-shrink-0 mr-3">
                    {activity.icon}
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{activity.name}</h3>
                    <p className="text-sm text-gray-400 mb-1">{activity.description}</p>
                    <p className="text-amber-500 font-medium">+{activity.points} XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#333] mb-8">
            <h2 className="text-xl font-bold mb-4">Program Rules</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-[#252525] flex items-center justify-center flex-shrink-0 mr-3 text-sm">1</span>
                <p className="text-gray-300">Points are awarded for genuine research activities. Automated or repetitive actions may not qualify for points.</p>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-[#252525] flex items-center justify-center flex-shrink-0 mr-3 text-sm">2</span>
                <p className="text-gray-300">Tiers unlock automatically as you reach the required XP thresholds.</p>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-[#252525] flex items-center justify-center flex-shrink-0 mr-3 text-sm">3</span>
                <p className="text-gray-300">Research activities must comply with our terms of service and community guidelines.</p>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-[#252525] flex items-center justify-center flex-shrink-0 mr-3 text-sm">4</span>
                <p className="text-gray-300">We reserve the right to modify the program structure, point values, or benefits.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}