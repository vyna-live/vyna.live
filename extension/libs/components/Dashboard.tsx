import React, { useState, useEffect } from 'react';
import ChatView from './ChatView';
import NotepadView from './NotepadView';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [userDetails, setUserDetails] = useState<any>(user);
  
  // Fetch latest user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get token from storage
        chrome.storage.local.get(['token'], async (result) => {
          if (result.token) {
            const response = await fetch('https://vyna.live/api/user', {
              headers: {
                'Authorization': `Bearer ${result.token}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              setUserDetails(userData);
              
              // Update storage with latest user data
              chrome.storage.local.set({ user: userData });
            }
          }
        });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    
    fetchUserData();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 bg-zinc-900 flex items-center justify-between">
        <div className="flex items-center">
          <img src="/assets/icon-48.png" alt="Vyna.live" className="h-8 w-8 mr-2" />
          <div>
            <h1 className="font-medium text-sm">Vyna.live</h1>
            <p className="text-xs text-zinc-400">{userDetails?.username || 'User'}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="text-xs text-zinc-400 hover:text-white"
        >
          Sign Out
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800">
        <button 
          className={`flex-1 p-2 text-center text-sm ${activeTab === 'chat' ? 'border-b-2 border-primary text-white' : 'text-zinc-400'}`}
          onClick={() => setActiveTab('chat')}
        >
          AI Chat
        </button>
        <button 
          className={`flex-1 p-2 text-center text-sm ${activeTab === 'notes' ? 'border-b-2 border-primary text-white' : 'text-zinc-400'}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <ChatView userId={userDetails?.id} />
        ) : (
          <NotepadView userId={userDetails?.id} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;