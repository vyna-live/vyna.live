import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../utils/api';
import { clearUserAuth } from '../utils/storage';
import { getCurrentUser } from '../utils/api';
import Logo from './ui/Logo';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  
  const handleLogout = async () => {
    setLoading(true);
    try {
      // Get user token from storage
      const auth = await chrome.storage.local.get('userAuth');
      if (auth.userAuth?.token) {
        await logout(auth.userAuth.token);
      }
      await clearUserAuth();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear auth on error
      await clearUserAuth();
      onLogout();
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 flex flex-col h-full">
      <header className="flex justify-between items-center mb-6">
        <Logo size="small" />
        <div className="flex items-center">
          <span className="text-sm mr-3">{user.username}</span>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="text-sm text-primary"
          >
            {loading ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </header>
      
      <div className="flex-grow">
        <h1 className="text-xl font-medium mb-6">Vyna AI Assistant</h1>
        
        <div className="grid grid-cols-1 gap-4">
          <div 
            className="bg-primary bg-opacity-10 p-4 rounded-md flex items-center justify-between cursor-pointer"
            onClick={() => navigate('/ai-chat')}
          >
            <div>
              <h2 className="font-medium">AI Chat Assistant</h2>
              <p className="text-sm text-gray-700">Talk to Vyna AI in play-by-play or color commentary mode</p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="#5D1C34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <div 
            className="bg-secondary bg-opacity-10 p-4 rounded-md flex items-center justify-between cursor-pointer"
            onClick={() => navigate('/notepad')}
          >
            <div>
              <h2 className="font-medium">Notepad</h2>
              <p className="text-sm text-gray-700">Save and organize your AI chat responses</p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="#A67D44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <div 
            className="bg-accent bg-opacity-10 p-4 rounded-md flex items-center justify-between cursor-pointer"
            onClick={() => navigate('/settings')}
          >
            <div>
              <h2 className="font-medium">Settings</h2>
              <p className="text-sm text-gray-700">Customize your Vyna extension preferences</p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="#899481" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
      
      <footer className="mt-6 text-center text-xs text-gray-500">
        <p>Vyna Extension v1.0.0</p>
        <p className="mt-1">© 2025 Vyna.live</p>
      </footer>
    </div>
  );
};

export default Dashboard;
