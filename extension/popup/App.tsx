import React, { useState, useEffect } from 'react';
import AuthPage, { AuthPageProps } from '@libs/components/AuthPage';
import Dashboard from '@libs/components/Dashboard';
import { getAuthData, StoredAuthData } from '@libs/utils/storage';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authData, setAuthData] = useState<StoredAuthData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if the user is already authenticated
    async function checkAuth() {
      try {
        const storedAuthData = await getAuthData();
        if (storedAuthData) {
          setAuthData(storedAuthData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError('Failed to retrieve authentication data');
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, []);
  
  const handleLoginSuccess = (data: StoredAuthData) => {
    setAuthData(data);
    setIsAuthenticated(true);
    setError(null);
  };
  
  const handleLogout = () => {
    setAuthData(null);
    setIsAuthenticated(false);
  };
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Vyna AI Assistant...</p>
      </div>
    );
  }
  
  return (
    <div className="app-wrapper">
      {isAuthenticated && authData ? (
        <Dashboard 
          authData={authData} 
          onLogout={handleLogout} 
        />
      ) : (
        <AuthPage 
          onLoginSuccess={handleLoginSuccess} 
          error={error}
        />
      )}
    </div>
  );
};

export default App;
