import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, updateSettings } from '../utils/storage';
import { clearUserAuth } from '../utils/storage';
import Logo from './ui/Logo';

interface SettingsViewProps {
  user: any;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  // Settings state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [defaultCommentaryStyle, setDefaultCommentaryStyle] = useState<'play-by-play' | 'color'>('color');
  const [autoSaveNotes, setAutoSaveNotes] = useState<boolean>(true);
  
  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        setTheme(settings.theme);
        setDefaultCommentaryStyle(settings.defaultCommentaryStyle);
        setAutoSaveNotes(settings.autoSaveNotes);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveSuccess(false);
    
    try {
      await updateSettings({
        theme,
        defaultCommentaryStyle,
        autoSaveNotes
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <header className="flex justify-between items-center p-4 border-b">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-primary"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="ml-2">Back</span>
        </button>
        <Logo size="small" variant="icon" />
      </header>
      
      <div className="flex-grow p-4 overflow-y-auto">
        <h1 className="text-xl font-medium mb-6">Settings</h1>
        
        {saveSuccess && (
          <div className="bg-green-50 p-3 rounded-md text-green-600 text-sm mb-6">
            Settings saved successfully
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <h2 className="font-medium mb-3">Appearance</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  className="w-full"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="font-medium mb-3">AI Assistant</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Default Commentary Style</label>
                <select
                  value={defaultCommentaryStyle}
                  onChange={(e) => setDefaultCommentaryStyle(e.target.value as 'play-by-play' | 'color')}
                  className="w-full"
                >
                  <option value="color">Color Commentary (detailed, insightful)</option>
                  <option value="play-by-play">Play-by-Play (quick, action-oriented)</option>
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="font-medium mb-3">Notepad</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-save"
                  checked={autoSaveNotes}
                  onChange={(e) => setAutoSaveNotes(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="auto-save" className="text-sm font-medium">Auto-save notes</label>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="font-medium mb-3">Account</h2>
            <div className="mb-2">
              <span className="text-sm">Signed in as: </span>
              <span className="text-sm font-medium">{user.username}</span>
            </div>
            <button
              onClick={() => {
                clearUserAuth();
                window.location.reload();
              }}
              className="text-red-600 text-sm font-medium"
            >
              Sign out
            </button>
          </div>
          
          <div>
            <h2 className="font-medium mb-3">About</h2>
            <div className="text-sm space-y-1">
              <p>Vyna Extension v1.0.0</p>
              <p>© 2025 Vyna.live</p>
              <p className="mt-2">
                <a 
                  href="https://vyna.live/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary"
                >
                  Privacy Policy
                </a>
                {' '}&middot;{' '}
                <a 
                  href="https://vyna.live/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary"
                >
                  Terms of Service
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="border-t p-4">
        <button
          onClick={handleSaveSettings}
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </footer>
    </div>
  );
};

export default SettingsView;
