import { useState } from "react";
import { RefreshCw, User, Mail, FileText, Zap } from "lucide-react";

interface PromptSuggestionsProps {
  onPromptClick: (prompt: string) => void;
}

const defaultPrompts = [
  {
    id: 1,
    text: "Write a to-do list for a personal project or task",
    icon: <User className="h-6 w-6" />,
  },
  {
    id: 2,
    text: "Generate an email reply to a job offer",
    icon: <Mail className="h-6 w-6" />,
  },
  {
    id: 3,
    text: "Summarise this article or text for me in one paragraph",
    icon: <FileText className="h-6 w-6" />,
  },
  {
    id: 4,
    text: "How does AI work in a technical capacity",
    icon: <Zap className="h-6 w-6" />,
  },
];

const alternatePrompts = [
  {
    id: 5,
    text: "Explain how to research effectively during a livestream",
    icon: <User className="h-6 w-6" />,
  },
  {
    id: 6,
    text: "Create talking points for a 10-minute segment on AI",
    icon: <Mail className="h-6 w-6" />,
  },
  {
    id: 7,
    text: "What are the best practices for citing sources on stream?",
    icon: <FileText className="h-6 w-6" />,
  },
  {
    id: 8,
    text: "Outline a research methodology for livestream content",
    icon: <Zap className="h-6 w-6" />,
  },
];

export default function PromptSuggestions({ onPromptClick }: PromptSuggestionsProps) {
  const [prompts, setPrompts] = useState(defaultPrompts);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    setTimeout(() => {
      setPrompts(prompts === defaultPrompts ? alternatePrompts : defaultPrompts);
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center"
            onClick={() => onPromptClick(prompt.text)}
          >
            <div className="text-[#6B7280] text-sm mb-4">
              {prompt.text}
            </div>
            <div className="w-8 h-8 flex items-center justify-center text-[#6B7280]">
              {prompt.icon}
            </div>
          </div>
        ))}
      </div>

      <button
        className={`flex items-center justify-center text-[#6B7280] hover:text-[#A259FF] transition-colors mt-2 mx-auto ${
          isRefreshing ? "animate-spin" : ""
        }`}
        onClick={handleRefresh}
      >
        <RefreshCw className="h-5 w-5 mr-1" />
        Refresh Prompts
      </button>
    </div>
  );
}
