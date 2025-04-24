import { Sparkles, Zap } from "lucide-react";

interface HeaderProps {
  username: string;
}

export default function Header({ username }: HeaderProps) {
  return (
    <div className="mb-10 animate-fade-in">
      <div className="flex items-center space-x-2 mb-1">
        <Sparkles className="h-5 w-5 text-purple-500" />
        <span className="text-sm font-medium text-purple-600">STREAMCAST AI</span>
      </div>
      
      <div className="glass-card p-8 mb-8">
        <h1 className="text-4xl font-bold text-[#1F2937] mb-2 flex items-center">
          Welcome back, <span className="purple-gradient-text ml-2">{username}</span>
        </h1>
        <h2 className="text-3xl font-bold purple-gradient-text mb-4">
          What would you like to know today?
        </h2>
        <div className="flex items-center space-x-2 text-[#6B7280]">
          <Zap className="h-4 w-4 text-amber-500" />
          <p className="text-gray-600">
            Try one of the popular prompts below or ask your own question to get started
          </p>
        </div>
      </div>
    </div>
  );
}
