import React, { useState, useEffect } from 'react';
import LoginScreen from '../components/LoginScreen';
import MainInterface from '../components/MainInterface';

interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
}

const Popup: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Using Chrome extension API to check authentication state
        const authResponse = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' });
        
        if (authResponse.isAuthenticated) {
          setIsAuthenticated(true);
          setUser(authResponse.user);
        }
      } catch (error) {
        console.error('Authentication check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthState();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        data: {
          endpoint: '/api/login',
          method: 'POST',
          body: { username: email, password }
        }
      });

      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.data);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      // Open Google OAuth flow in a new tab
      await chrome.runtime.sendMessage({ type: 'GOOGLE_SIGN_IN' });
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        data: {
          endpoint: '/api/logout',
          method: 'POST'
        }
      });
      
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-[350px] h-[550px] bg-background flex items-center justify-center">
        <div className="loading-indicator"></div>
      </div>
    );
  }

  return (
    <div className="w-[350px] h-[550px] bg-background">
      {isAuthenticated && user ? (
        <MainInterface user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} />
      )}
    </div>
  );
};

export default Popup;