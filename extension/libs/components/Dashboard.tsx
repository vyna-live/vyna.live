import React, { useState, useEffect } from 'react';
import AiChatView from './AiChatView';
import NotepadView from './NotepadView';
import SettingsView from './SettingsView';
import { StoredAuthData } from '@libs/utils/storage';
import Logo from './ui/Logo';
import { logout } from '@libs/utils/api';

type Tab = 'ai-chat' | 'notepad' | 'settings';

interface DashboardProps {
  authData: StoredAuthData;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ authData, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('ai-chat');
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [pageContext, setPageContext] = useState<{
    url: string;
    title: string;
    content: string;
  } | null>(null);
  
  // Get the current page context from the content script
  useEffect(() => {
    // Request context from background script which will get it from content script
    chrome.runtime.sendMessage({ action: 'getPageContext' }, (response) => {
      if (response && response.data) {
        setPageContext(response.data);
      }
    });
    
    // Listen for context updates from the background script
    const contextListener = (message: any) => {
      if (message.action === 'pageContextUpdated' && message.data) {
        setPageContext(message.data);
      }
    };
    
    chrome.runtime.onMessage.addListener(contextListener);
    
    return () => {
      chrome.runtime.onMessage.removeListener(contextListener);
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  return (
    <div className="app-container">
      <header className="header">
        <div className="header-logo">
          <Logo size="small" variant="light" />
          <span className="username">
            {authData.displayName || authData.username}
          </span>
        </div>
        <div className="header-actions">
          <button 
            className="btn-link" 
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </header>
      
      <div className="content">
        <nav className="nav-tabs">
          <div 
            className={`nav-tab ${activeTab === 'ai-chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-chat')}
          >
            AI Chat
          </div>
          <div 
            className={`nav-tab ${activeTab === 'notepad' ? 'active' : ''}`}
            onClick={() => setActiveTab('notepad')}
          >
            Notepad
          </div>
          <div 
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </div>
        </nav>
        
        <div className="tab-content">
          {activeTab === 'ai-chat' && (
            <AiChatView 
              userId={authData.userId || 0} 
              pageContext={pageContext}
            />
          )}
          
          {activeTab === 'notepad' && (
            <NotepadView userId={authData.userId || 0} />
          )}
          
          {activeTab === 'settings' && (
            <SettingsView onLogout={handleLogout} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
