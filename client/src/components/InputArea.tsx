import { useState, useRef } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";

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
      <div className="relative flex-grow group">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[hsl(var(--ai-text-secondary))]">
          <Sparkles className="h-5 w-5 opacity-70 group-focus-within:text-[hsl(var(--ai-accent))]" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="ai-input-field w-full pr-12 pl-12"
          placeholder="Ask me anything about your livestream..."
        />
        
        <button
          onClick={handleSubmit}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 ai-primary-button w-9 h-9 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!message.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
