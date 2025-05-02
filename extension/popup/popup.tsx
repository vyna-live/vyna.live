import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './popup.css';

// Components
import AuthPage from '../libs/components/AuthPage';
import Dashboard from '../libs/components/Dashboard';

// Main Popup component
function Popup() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'getAuthStatus' }, (response) => {
      setIsAuthenticated(response.isAuthenticated);
      setUser(response.user);
      setLoading(false);
    });

    // Listen for auth status changes from background script
    const handleAuthChange = (message: any) => {
      if (message.type === 'authStatusChanged') {
        setIsAuthenticated(message.isAuthenticated);
        setUser(message.user);
      }
    };

    chrome.runtime.onMessage.addListener(handleAuthChange);

    return () => {
      chrome.runtime.onMessage.removeListener(handleAuthChange);
    };
  }, []);

  // Handle login
  const handleLogin = async (credentials: { username: string; password: string }) => {
    setLoading(true);
    setError(null);

    chrome.runtime.sendMessage(
      { type: 'login', credentials },
      (response) => {
        setLoading(false);
        
        if (response.success) {
          setIsAuthenticated(true);
          setUser(response.user);
        } else {
          setError(response.error || 'Login failed');
        }
      }
    );
  };

  // Handle logout
  const handleLogout = () => {
    chrome.runtime.sendMessage({ type: 'logout' }, () => {
      setIsAuthenticated(false);
      setUser(null);
    });
  };

  // Extract content from current page
  const extractPageContent = () => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'extractCurrentPageContent' },
        (response) => {
          if (response && response.success) {
            resolve(response);
          } else {
            reject(response?.error || 'Failed to extract page content');
          }
        }
      );
    });
  };

  // Open dashboard in new tab
  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="vyna-popup-loading">
        <div className="vyna-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} error={error} />;
  }

  // Show main popup content if authenticated
  return (
    <div className="vyna-popup">
      <header className="vyna-popup-header">
        <h1>Vyna.live Assistant</h1>
        <div className="vyna-user-info">
          {user?.username ? `Hello, ${user.username}` : 'Welcome'}
        </div>
      </header>

      <div className="vyna-popup-content">
        <div className="vyna-actions">
          <button 
            className="vyna-action-button"
            onClick={extractPageContent}
          >
            Extract Page Content
          </button>
          
          <button 
            className="vyna-action-button"
            onClick={openDashboard}
          >
            Open Dashboard
          </button>
        </div>
      </div>

      <footer className="vyna-popup-footer">
        <button 
          className="vyna-logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </footer>
    </div>
  );
}

// Render the popup
const root = ReactDOM.createRoot(document.getElementById('popup-root')!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
