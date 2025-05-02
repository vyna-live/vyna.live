import React, { useState, useEffect } from 'react';
import AuthPage from '../libs/components/AuthPage';
import Dashboard from '../libs/components/Dashboard';
import { getCurrentUser, login } from '../libs/utils/api';
import { getStorageData, setUserAuth, clearUserAuth } from '../libs/utils/storage';
import './styles/popup.css';

const Popup: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const storage = await getStorageData();
        
        if (storage.user && storage.token) {
          setUser(storage.user);
          setIsAuthenticated(true);
          
          // Verify token is still valid
          const response = await getCurrentUser();
          
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Token expired, clear storage
            await clearUserAuth();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = async (credentials: { username: string; password: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await login(credentials.username, credentials.password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        await setUserAuth(user, token);
        setUser(user);
        setIsAuthenticated(true);
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await clearUserAuth();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="ml.md">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {isAuthenticated ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <AuthPage onLogin={handleLogin} error={error} />
      )}
    </div>
  );
};

export default Popup;