import React, { useState } from 'react';
import { X } from 'lucide-react';

interface JoinStreamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (streamLink: string) => void;
}

export default function JoinStreamDialog({ isOpen, onClose, onSubmit }: JoinStreamDialogProps) {
  const [streamLink, setStreamLink] = useState('');
  
  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (streamLink.trim()) {
      onSubmit(streamLink);
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={() => onClose()}
    >
      <div 
        className="bg-[#1C1C1C] w-full max-w-md rounded-lg shadow-lg overflow-hidden"
        style={{ maxWidth: '458px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-medium flex items-center">
              <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Enter stream link
            </h2>
            <button 
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input 
                type="text"
                value={streamLink}
                onChange={(e) => setStreamLink(e.target.value)}
                placeholder="jkhjfhkasfh.vynna.live"
                className="w-full p-3 bg-[#141414] text-white rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-[#D8C6AF] text-black font-medium rounded hover:bg-opacity-90 transition-opacity"
              disabled={!streamLink.trim()}
            >
              Join stream
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}