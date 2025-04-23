import { useState, useRef } from "react";
import { Paperclip, Image, Globe, ArrowRight } from "lucide-react";

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
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-[#1F2937] font-medium">Ask whatever you want....</div>
        <div className="flex items-center">
          <button className="flex items-center rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 transition-colors">
            <Globe className="h-4 w-4 mr-1" />
            All Web
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
          className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent resize-none"
          placeholder="Type your research question here..."
        />

        <div className="absolute bottom-3 right-3 flex items-center space-x-3">
          <div className="text-xs text-[#6B7280]">
            {charCount}/{MAX_CHARS}
          </div>
          <button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-[#A259FF] to-[#4F46E5] text-white rounded-md w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!message.trim() || isLoading}
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center space-x-3">
          <button className="text-[#6B7280] hover:text-[#A259FF]">
            <Paperclip className="h-5 w-5" />
          </button>
          <button className="text-[#6B7280] hover:text-[#A259FF]">
            <Image className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
