import React, { useState, useEffect } from 'react';
import AiChatView from './AiChatView';
import NotepadView from './NotepadView';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [currentPageTitle, setCurrentPageTitle] = useState<string>('');
  const [currentPageUrl, setCurrentPageUrl] = useState<string>('');
  
  // Get current tab info
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url && tabs[0].title) {
        setCurrentPageTitle(tabs[0].title || 'Current Page');
        setCurrentPageUrl(tabs[0].url || '');
      }
    });
  }, []);

  return (
    <div className="vyna-dashboard">
      <header className="vyna-dashboard-header">
        <div className="vyna-logo">Vyna.live</div>
        
        <div className="vyna-user-profile">
          <span>{user?.username || 'User'}</span>
          <button className="vyna-logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="vyna-page-info">
        <h2>{currentPageTitle}</h2>
        <p className="vyna-page-url">{currentPageUrl}</p>
      </div>

      <div className="vyna-tabs">
        <button 
          className={`vyna-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          AI Chat
        </button>
        <button 
          className={`vyna-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
      </div>

      <div className="vyna-tab-content">
        {activeTab === 'chat' ? (
          <AiChatView currentPageTitle={currentPageTitle} currentPageUrl={currentPageUrl} />
        ) : (
          <NotepadView currentPageTitle={currentPageTitle} currentPageUrl={currentPageUrl} />
        )}
      </div>

      <style>{`
        .vyna-dashboard {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100%;
          background-color: var(--vyna-background);
        }

        .vyna-dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: var(--vyna-primary);
          color: white;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .vyna-logo {
          font-size: 18px;
          font-weight: 600;
        }

        .vyna-user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
        }

        .vyna-logout-btn {
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: white;
          padding: 4px 8px;
          font-size: 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .vyna-logout-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .vyna-page-info {
          padding: 12px 16px;
          border-bottom: 1px solid var(--vyna-border);
          background-color: white;
        }

        .vyna-page-info h2 {
          font-size: 16px;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .vyna-page-url {
          font-size: 12px;
          color: #666;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .vyna-tabs {
          display: flex;
          border-bottom: 1px solid var(--vyna-border);
          background-color: #f5f5f5;
        }

        .vyna-tab-btn {
          flex: 1;
          padding: 12px;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          color: var(--vyna-text);
          transition: all 0.2s;
        }

        .vyna-tab-btn.active {
          color: var(--vyna-secondary);
          border-bottom: 2px solid var(--vyna-secondary);
        }

        .vyna-tab-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
