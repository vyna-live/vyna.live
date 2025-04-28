import React, { useState } from 'react';

interface ExactInputAreaProps {
  onSubmit?: (message: string) => void;
}

export default function ExactInputArea({ onSubmit }: ExactInputAreaProps) {
  const [input, setInput] = useState<string>('Who is the best gamer in Nigeria as of April 2025?');

  const handleSendMessage = () => {
    if (onSubmit && input.trim()) {
      onSubmit(input);
    }
  };

  return (
    <div className="w-full">
      {/* Exactly matching the input design from the screenshot */}
      <div className="py-3 px-4 rounded-md bg-[#2A2A2A] text-sm text-white">
        <p className="w-full text-white text-sm font-normal">
          {input}
        </p>
      </div>
      
      {/* Exactly matching the icons from the screenshot */}
      <div className="flex mt-4 gap-6 items-center justify-center">
        <button className="text-[#808080] hover:text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5l6.74-6.76zM16 8l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="text-[#808080] hover:text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 10v2a7 7 0 01-7 7 7 7 0 01-7-7v-2M12 18v4M8 22h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="text-[#808080] hover:text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}