import React, { useState, useEffect } from 'react';
import AuthPage from '../libs/components/AuthPage';
import Dashboard from '../libs/components/Dashboard';

const Popup: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is logged in
    chrome.storage.local.get(['user', 'token'], (result) => {
      if (result.user && result.token) {
        setUser(result.user);
        setIsAuthenticated(true);
        
        // Verify token is still valid
        fetch('https://vyna.live/api/user', {
          headers: {
            'Authorization': `Bearer ${result.token}`
          }
        })
          .then(response => {
            if (!response.ok) {
              throw new Error('Token expired');
            }
            return response.json();
          })
          .then(userData => {
            setUser(userData);
          })
          .catch(() => {
            // Token expired, clear storage
            chrome.storage.local.remove(['user', 'token']);
            setUser(null);
            setIsAuthenticated(false);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  const handleLogin = (userData: any, token: string) => {
    chrome.storage.local.set({ user: userData, token }, () => {
      setUser(userData);
      setIsAuthenticated(true);
    });
  };

  const handleLogout = () => {
    chrome.storage.local.remove(['user', 'token'], () => {
      setUser(null);
      setIsAuthenticated(false);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black text-white">
      {isAuthenticated ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <AuthPage onLogin={handleLogin} />
      )}
    </div>
  );
};

export default Popup;