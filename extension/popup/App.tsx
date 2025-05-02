import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { getAuthStatus } from '@libs/utils/api';
import AuthPage from '@libs/components/AuthPage';
import Dashboard from '@libs/components/Dashboard';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const authStatus = await getAuthStatus();
        setIsAuthenticated(authStatus.isAuthenticated);
      } catch (err) {
        console.error('Authentication check failed:', err);
        setError('Failed to check authentication status');
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
      
      // Call login API
      const response = await fetch('https://vyna.live/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {isAuthenticated ? (
          <Route path="*" element={<Dashboard />} />
        ) : (
          <Route path="*" element={<AuthPage onLogin={handleLogin} error={error} />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;
