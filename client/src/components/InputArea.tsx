import { useState, useRef } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

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
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="ai-input-field w-full pr-12"
        placeholder="Ask me anything..."
      />
      
      <button
        onClick={handleSubmit}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!message.trim() || isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        ) : (
          <ArrowUp className="h-4 w-4 text-gray-500" />
        )}
      </button>
    </div>
  );
}
