import React, { useState, useEffect } from 'react';
import AiChatView from './AiChatView';
import NotepadView from './NotepadView';
import '../../../popup/styles/popup.css';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [currentPageTitle, setCurrentPageTitle] = useState<string>('');
  const [currentPageUrl, setCurrentPageUrl] = useState<string>('');
  const [isFullView, setIsFullView] = useState<boolean>(false);
  
  // Get current tab info
  useEffect(() => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].url && tabs[0].title) {
          setCurrentPageTitle(tabs[0].title || 'Current Page');
          setCurrentPageUrl(tabs[0].url || '');
        }
      });
    } catch (err) {
      console.error('Error getting active tab:', err);
      setCurrentPageTitle('Vyna Assistant');
    }
  }, []);

  const openFullDashboard = () => {
    // Open the full dashboard in a new tab
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  };

  return (
    <div className="container">
      <div className="header">
        <h3>Vyna Assistant</h3>
        <div className="flex gap-sm">
          <span className="text-sm">{user?.displayName || user?.username || 'User'}</span>
          <button className="btn btn-text" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="content p-sm">
        <div className="card p-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-ellipsis overflow-hidden">{currentPageTitle}</h3>
            <button className="btn btn-sm" onClick={openFullDashboard}>Expand</button>
          </div>
          <p className="text-sm text-secondary text-ellipsis overflow-hidden">  
            {currentPageUrl}
          </p>
        </div>

        <div className="tabs mt-md">
          <div className="tab-buttons">
            <button 
              className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              AI Chat
            </button>
            <button 
              className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'chat' ? (
              <AiChatView currentPageTitle={currentPageTitle} currentPageUrl={currentPageUrl} />
            ) : (
              <NotepadView currentPageTitle={currentPageTitle} currentPageUrl={currentPageUrl} />
            )}
          </div>
        </div>
      </div>

      <div className="footer">
        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary">© 2025 Vyna.live</span>
          <button 
            className="btn-text text-xs"
            onClick={openFullDashboard}
          >
            Open Dashboard
          </button>
        </div>
      </div>

      <style>{`
        .tabs {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .tab-buttons {
          display: flex;
          border-bottom: 1px solid var(--vyna-border);
        }
        
        .tab-button {
          flex: 1;
          padding: var(--vyna-spacing-sm) var(--vyna-spacing-md);
          background: none;
          border: none;
          font-size: var(--vyna-font-sm);
          font-weight: 500;
          cursor: pointer;
          color: var(--vyna-text-secondary);
          transition: all 0.2s;
        }
        
        .tab-button.active {
          color: var(--vyna-secondary);
          border-bottom: 2px solid var(--vyna-secondary);
        }
        
        .tab-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .text-ellipsis {
          white-space: nowrap;
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btn-sm {
          padding: 4px 8px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
