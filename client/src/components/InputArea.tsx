import { useState, useRef } from "react";
import { Paperclip, Image, Globe, ArrowRight, Lightbulb, Send, Loader2 } from "lucide-react";

interface InputAreaProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

export default function InputArea({ onSubmit, isLoading }: InputAreaProps) {
  const [message, setMessage] = useState("");
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 1000;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setMessage(value);
      setCharCount(value.length);
    }
  };

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSubmit(message);
      setMessage("");
      setCharCount(0);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <div className="text-[#1F2937] font-medium flex items-center space-x-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span>Ask anything to enhance your stream</span>
        </div>
        <div className="flex items-center">
          <button className="secondary-button flex items-center text-sm">
            <Globe className="h-4 w-4 mr-1" />
            <span>Web Search</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={3}
          className="input-field w-full resize-none"
          placeholder="Type your research question here..."
        />

        <div className="absolute bottom-3 right-3 flex items-center space-x-3">
          <div className="text-xs text-[#6B7280] bg-gray-100 px-2 py-1 rounded-md">
            {charCount}/{MAX_CHARS}
          </div>
          <button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-subtle"
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center space-x-3">
          <button className="text-gray-500 hover:text-purple-600 transition-colors">
            <Paperclip className="h-5 w-5" />
          </button>
          <button className="text-gray-500 hover:text-purple-600 transition-colors">
            <Image className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
