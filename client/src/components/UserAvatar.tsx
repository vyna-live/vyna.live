import React, { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, LogOut, Settings, Star, User, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { SolanaWalletButton } from './SolanaWalletButton';

export default function UserAvatar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Default avatar if user doesn't have one
  const avatarUrl = user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.username;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const handleSettings = () => {
    setIsOpen(false);
    setLocation('/settings');
  };
  
  const handleUpgrade = () => {
    setIsOpen(false);
    setLocation('/subscription');
  };
  
  const handleProfile = () => {
    setIsOpen(false);
    setLocation('/profile');
  };
  
  return (
    <div className="flex items-center gap-3">
      <SolanaWalletButton />
        
      <div className="relative z-[9999]" ref={dropdownRef}>
        <button 
          className="flex items-center py-1.5 px-1.5 rounded-full bg-[#252525] hover:bg-[#303030] transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          <img 
            src={avatarUrl} 
            alt={user?.username || 'User'} 
            className="w-7 h-7 rounded-full"
          />
        </button>
        
        {isOpen && (
          <>
            {/* Background overlay to block any content beneath */}
            <div 
              className="fixed inset-0 bg-transparent z-[9998]" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown menu */}
            <div 
              className="fixed right-0 top-[60px] mr-4 w-60 rounded-lg shadow-xl py-1 bg-[#1a1a1a] border border-[#333] z-[9999]"
              style={{
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.8)'
              }}
            >
              <div className="px-4 py-3 border-b border-[#333] bg-[#1a1a1a]">
                <p className="text-sm font-medium text-white">{user?.displayName || user?.username}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              
              <button
                onClick={handleUpgrade}
                className="flex items-center w-full px-4 py-2.5 text-left hover:bg-[#252525] transition-colors bg-[#1a1a1a]"
              >
                <Star size={18} className="text-[#DCC5A2] mr-2" />
                <div>
                  <span className="block text-sm font-medium text-white">VynaAI Plus</span>
                  <span className="block text-xs text-gray-400">Upgrade to access smarter features</span>
                </div>
              </button>
              
              <button
                onClick={handleProfile}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-100 hover:bg-[#252525] transition-colors bg-[#1a1a1a]"
              >
                <User size={16} className="text-gray-400 mr-2" />
                Profile & Passes
              </button>
              
              <button
                onClick={handleSettings}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-100 hover:bg-[#252525] transition-colors bg-[#1a1a1a]"
              >
                <Settings size={16} className="text-gray-400 mr-2" />
                Settings
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-100 hover:bg-[#252525] transition-colors bg-[#1a1a1a]"
              >
                <LogOut size={16} className="text-gray-400 mr-2" />
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}