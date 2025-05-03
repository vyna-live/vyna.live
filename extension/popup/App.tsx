import React, { useState, useEffect } from 'react';
import AuthPage from '@libs/components/AuthPage';
import Dashboard from '@libs/components/Dashboard';
import { getAuthData, clearAuthData } from '@libs/utils/storage';
import { type StoredAuthData } from '@libs/utils/storage';

const App: React.FC = () => {
  const [authData, setAuthData] = useState<StoredAuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await getAuthData();
        setAuthData(data);
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Handle login success
  const handleLoginSuccess = (data: StoredAuthData) => {
    setAuthData(data);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await clearAuthData();
      setAuthData(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!authData || !authData.token) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Show dashboard if authenticated
  return <Dashboard user={authData} onLogout={handleLogout} />;
};

export default App;