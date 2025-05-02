import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from '@libs/components/AuthPage';
import Dashboard from '@libs/components/Dashboard';
import NotepadView from '@libs/components/NotepadView';
import AiChatView from '@libs/components/AiChatView';
import SettingsView from '@libs/components/SettingsView';
import { getStoredUser } from '@libs/utils/storage';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const user = await getStoredUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] min-w-[350px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="popup-container min-h-[400px] min-w-[350px] max-w-[400px]">
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/login" element={<AuthPage onAuthenticated={() => setIsAuthenticated(true)} />} />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/notepad/:id?"
          element={
            isAuthenticated ? (
              <NotepadView />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/ai-chat/:id?"
          element={
            isAuthenticated ? (
              <AiChatView />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <SettingsView />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  );
};

export default App;
