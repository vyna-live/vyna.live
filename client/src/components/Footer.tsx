import React from 'react';
import { useLocation } from 'wouter';
import Logo from './Logo';

export default function Footer() {
  const [, navigate] = useLocation();
  
  return (
    <footer className="bg-black border-t border-[#252525] mt-auto py-4">
      <div className="container mx-auto flex items-center justify-between px-6">
        <div className="flex items-center">
          <Logo variant="light" size="sm" />
        </div>
        
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => navigate('/documentation')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Documentation
          </button>
          
          <button 
            onClick={() => window.open('https://twitter.com/vynalive', '_blank')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Follow us
          </button>
        </div>
      </div>
    </footer>
  );
}