import React, { useState, useEffect } from 'react';
import { getUserPreferences, updateUserPreferences, clearAuthData, UserPreferences } from '@libs/utils/storage';
import Logo from './ui/Logo';

interface SettingsViewProps {
  onLogout: () => Promise<void>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onLogout }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    fontSize: 'medium',
    teleprompterSpeed: 5,
    defaultCommentaryStyle: 'color'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        const userPrefs = await getUserPreferences();
        setPreferences(userPrefs);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPreferences();
  }, []);
  
  // Handle saving preferences
  const handleSavePreferences = async () => {
    try {
      setIsLoading(true);
      await updateUserPreferences(preferences);
      setSaveMessage('Settings saved successfully');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaveMessage('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle preference change
  const handlePreferenceChange = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  return (
    <div className="settings-view">
      <div className="settings-header">
        <h2>Settings</h2>
      </div>
      
      <div className="settings-content">
        <div className="about-section">
          <Logo size="small" variant="default" />
          <div className="version-info">
            <p>Version 1.0.0</p>
            <p><a href="https://vyna.live/help" target="_blank" rel="noopener noreferrer">Help Center</a></p>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Appearance</h3>
          
          <div className="setting-item">
            <label htmlFor="theme">Theme</label>
            <select 
              id="theme" 
              value={preferences.theme} 
              onChange={(e) => handlePreferenceChange('theme', e.target.value as 'light' | 'dark' | 'system')}
              disabled={isLoading}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
          
          <div className="setting-item">
            <label htmlFor="fontSize">Font Size</label>
            <select 
              id="fontSize" 
              value={preferences.fontSize} 
              onChange={(e) => handlePreferenceChange('fontSize', e.target.value as 'small' | 'medium' | 'large')}
              disabled={isLoading}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>AI Assistant</h3>
          
          <div className="setting-item">
            <label htmlFor="defaultCommentaryStyle">Default Commentary Style</label>
            <select 
              id="defaultCommentaryStyle" 
              value={preferences.defaultCommentaryStyle} 
              onChange={(e) => handlePreferenceChange('defaultCommentaryStyle', e.target.value as 'play-by-play' | 'color')}
              disabled={isLoading}
            >
              <option value="color">Color Commentary</option>
              <option value="play-by-play">Play-by-Play Commentary</option>
            </select>
          </div>
          
          <div className="setting-item">
            <label htmlFor="teleprompterSpeed">Teleprompter Speed</label>
            <div className="slider-container">
              <input 
                type="range" 
                id="teleprompterSpeed" 
                min="1" 
                max="10" 
                value={preferences.teleprompterSpeed} 
                onChange={(e) => handlePreferenceChange('teleprompterSpeed', parseInt(e.target.value))}
                disabled={isLoading}
              />
              <span className="slider-value">{preferences.teleprompterSpeed}</span>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Account</h3>
          
          <button 
            className="logout-button" 
            onClick={onLogout}
            disabled={isLoading}
          >
            Sign Out
          </button>
        </div>
        
        <div className="settings-actions">
          <button 
            className="save-button"
            onClick={handleSavePreferences}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
          
          {saveMessage && (
            <div className="save-message">{saveMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
