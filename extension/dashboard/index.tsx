import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Dashboard from '../libs/components/Dashboard';
import AuthPage from '../libs/components/AuthPage';
import './dashboard.css';

function DashboardApp() {
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

  // Show loading state
  if (loading) {
    return (
      <div className="vyna-loading">
        <div className="vyna-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} error={error} />;
  }

  // Show dashboard if authenticated
  return <Dashboard user={user} onLogout={handleLogout} />;
}

// Render the dashboard
const root = ReactDOM.createRoot(document.getElementById('dashboard-root')!);
root.render(
  <React.StrictMode>
    <DashboardApp />
  </React.StrictMode>
);
