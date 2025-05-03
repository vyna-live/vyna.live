import React, { useState, useEffect } from 'react';
import { logout } from '@libs/utils/api';
import { getAuthData, clearAuthData, getUserPreferences } from '@libs/utils/storage';
import Logo from './ui/Logo';
import AiChatView from './AiChatView';
import NotepadView from './NotepadView';
import SettingsView from './SettingsView';

export interface DashboardProps {
  user: {
    userId?: number;
    username?: string;
    displayName?: string;
  } | null;
  onLogout: () => Promise<void>;
}

type View = 'ai-chat' | 'notepad' | 'settings';

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState<View>('ai-chat');
  const [preferences, setPreferences] = useState<any>(null);
  
  useEffect(() => {
    const loadPreferences = async () => {
      const prefs = await getUserPreferences();
      setPreferences(prefs);
    };
    
    loadPreferences();
  }, []);
  
  const handleLogout = async () => {
    try {
      await logout();
      await clearAuthData();
      onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, clear local storage
      await clearAuthData();
      onLogout();
    }
  };
  
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <Logo size="small" />
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user?.displayName || user?.username}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Sign Out
          </button>
        </div>
      </header>
      
      <main className="dashboard-content">
        {activeView === 'ai-chat' && <AiChatView />}
        {activeView === 'notepad' && <NotepadView />}
        {activeView === 'settings' && <SettingsView onLogout={handleLogout} />}
      </main>
      
      <nav className="dashboard-nav">
        <button 
          className={`nav-button ${activeView === 'ai-chat' ? 'active' : ''}`}
          onClick={() => setActiveView('ai-chat')}
        >
          AI Chat
        </button>
        <button 
          className={`nav-button ${activeView === 'notepad' ? 'active' : ''}`}
          onClick={() => setActiveView('notepad')}
        >
          Notepad
        </button>
        <button 
          className={`nav-button ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          Settings
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;
