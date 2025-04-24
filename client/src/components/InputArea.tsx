import { useState, useRef } from "react";
import { Send, Loader2, SearchIcon } from "lucide-react";

interface InputAreaProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

export default function InputArea({ onSubmit, isLoading }: InputAreaProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSubmit(message);
      setMessage("");
      if (inputRef.current) {
        inputRef.current.focus();
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
    <div className="relative w-full">
      <div className="relative border border-[hsl(var(--ai-border))] rounded-xl bg-[hsl(var(--ai-card))] overflow-hidden">
        <div className="flex items-center">
          <div className="flex-grow flex items-center">
            <div className="px-3 text-[hsl(var(--ai-text-secondary))]">
              <SearchIcon className="h-5 w-5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full py-3 px-1 bg-transparent border-none outline-none text-[hsl(var(--ai-text-primary))]" 
              placeholder="Ask anything..."
            />
          </div>
          
          <div className="flex items-center pr-3">
            <div className="flex space-x-1 mr-2">
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-[hsl(var(--ai-text-secondary))]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-[hsl(var(--ai-text-secondary))]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={handleSubmit}
              className="w-9 h-9 flex items-center justify-center bg-[hsl(var(--ai-accent))] rounded-lg text-black disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-center text-[hsl(var(--ai-text-secondary))]">
        <span className="mr-1">Research</span>
        <span className="px-1.5 py-0.5 rounded border border-[hsl(var(--ai-border))] bg-[hsl(var(--ai-card))]">Tab</span>
      </div>
    </div>
  );
}
