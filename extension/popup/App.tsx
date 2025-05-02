import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from '../libs/components/AuthPage';
import Dashboard from '../libs/components/Dashboard';
import NotepadView from '../libs/components/NotepadView';
import AiChatView from '../libs/components/AiChatView';
import SettingsView from '../libs/components/SettingsView';
import { getUserAuth, initStorage } from '../libs/utils/storage';

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Initialize the extension
    const init = async () => {
      try {
        await initStorage();
        const userAuth = await getUserAuth();
        setUser(userAuth?.user || null);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <Router>
      <Routes>
        {!user ? (
          <Route path="*" element={<AuthPage onAuthSuccess={(userData) => setUser(userData)} />} />
        ) : (
          <>
            <Route path="/" element={<Dashboard user={user} onLogout={() => setUser(null)} />} />
            <Route path="/ai-chat" element={<AiChatView user={user} />} />
            <Route path="/notepad" element={<NotepadView user={user} />} />
            <Route path="/settings" element={<SettingsView user={user} />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

export default App;
