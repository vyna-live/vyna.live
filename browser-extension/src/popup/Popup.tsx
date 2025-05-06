import React, { useState, useEffect } from 'react';
import LoginScreen from '../components/LoginScreen';
import MainInterface from '../components/MainInterface';

interface User {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

const Popup: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      try {
        setLoading(true);
        // Mock authentication check
        // In a real implementation, this would be replaced with an API call
        const mockUser: User = {
          id: 1,
          username: 'divine_samuel',
          displayName: 'Divine Samuel',
        };
        
        setUser(mockUser);
        setIsAuthenticated(true);
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (usernameOrEmail: string, password: string) => {
    try {
      setLoginLoading(true);
      setError('');

      // This would be replaced with an actual API call
      // In a real implementation, we would send both values to the server
      // and the server would determine if it's an email or username
      const isEmail = usernameOrEmail.includes('@');
      
      if ((usernameOrEmail === 'demo' || usernameOrEmail === 'demo@example.com') && password === 'password') {
        const mockUser: User = {
          id: 1,
          username: 'divine_samuel',
          displayName: 'Divine Samuel',
        };
        
        setUser(mockUser);
        setIsAuthenticated(true);
      } else {
        setError(`Invalid ${isEmail ? 'email' : 'username'} or password`);
      }
      
      setLoginLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoginLoading(true);
      setError('');

      // This would be replaced with an actual Google OAuth flow
      setTimeout(() => {
        const mockUser: User = {
          id: 1,
          username: 'divine_samuel',
          displayName: 'Divine Samuel',
        };
        
        setUser(mockUser);
        setIsAuthenticated(true);
        setLoginLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Google login error:', error);
      setError('An error occurred with Google login. Please try again.');
      setLoginLoading(false);
    }
  };
  
  const handleSignup = async (userData: { username: string; email: string; password: string; displayName?: string }) => {
    try {
      setLoginLoading(true);
      setError('');
      
      // This would be replaced with an actual API call to register the user
      console.log('Signing up with:', userData);
      
      // For demo purposes, we'll simulate a successful signup after a delay
      setTimeout(() => {
        const mockUser: User = {
          id: 1,
          username: userData.username,
          displayName: userData.displayName || userData.username,
        };
        
        setUser(mockUser);
        setIsAuthenticated(true);
        setLoginLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Signup error:', error);
      setError('An error occurred during signup. Please try again.');
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="w-[375px] h-[600px] flex justify-center items-center bg-[#1a1a1a] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="w-[375px] h-[600px] overflow-hidden">
      {isAuthenticated && user ? (
        <MainInterface user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen
          onLogin={handleLogin}
          onSignup={handleSignup}
          onGoogleLogin={handleGoogleLogin}
          error={error}
          isLoading={loginLoading}
        />
      )}
    </div>
  );
};

export default Popup;