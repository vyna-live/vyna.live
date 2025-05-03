import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@libs/utils/storage';

export interface SettingsViewProps {
  onLogout?: () => void;
}

interface Settings {
  autoFetchPageContent: boolean;
  enableNotifications: boolean;
  defaultCommentaryStyle: 'play-by-play' | 'color';
  theme: 'light' | 'dark' | 'system';
}

const SettingsView: React.FC<SettingsViewProps> = ({ onLogout }) => {
  const [settings, setSettings] = useState<Settings>({
    autoFetchPageContent: true,
    enableNotifications: true,
    defaultCommentaryStyle: 'color',
    theme: 'system'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      const storedSettings = await getSettings();
      if (storedSettings) {
        setSettings(storedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      await updateSettings(settings);
      setSavedMessage('Settings saved successfully!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleToggleChange = (key: keyof Settings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings({
        ...settings,
        [key]: !settings[key]
      });
    }
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, key: keyof Settings) => {
    setSettings({
      ...settings,
      [key]: e.target.value
    });
  };
  
  return (
    <div className="settings-container">
      <div className="settings-section">
        <h3>General Settings</h3>
        
        <div className="settings-row">
          <div>
            <div className="settings-label">Auto-fetch Page Content</div>
            <div className="settings-description">Automatically extract content from webpages</div>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.autoFetchPageContent}
              onChange={() => handleToggleChange('autoFetchPageContent')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="settings-row">
          <div>
            <div className="settings-label">Enable Notifications</div>
            <div className="settings-description">Show desktop notifications</div>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.enableNotifications}
              onChange={() => handleToggleChange('enableNotifications')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Display Settings</h3>
        
        <div className="settings-row">
          <div>
            <div className="settings-label">Default Commentary Style</div>
            <div className="settings-description">Choose default AI commentary style</div>
          </div>
          <select 
            value={settings.defaultCommentaryStyle}
            onChange={(e) => handleSelectChange(e, 'defaultCommentaryStyle')}
            className="settings-select"
          >
            <option value="color">Color Commentary</option>
            <option value="play-by-play">Play-by-Play Commentary</option>
          </select>
        </div>
        
        <div className="settings-row">
          <div>
            <div className="settings-label">Theme</div>
            <div className="settings-description">Choose app appearance</div>
          </div>
          <select 
            value={settings.theme}
            onChange={(e) => handleSelectChange(e, 'theme' as keyof Settings)}
            className="settings-select"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
        </div>
      </div>
      
      <div className="settings-actions">
        {savedMessage && <div className="settings-saved-message">{savedMessage}</div>}
        <button 
          className="btn-primary" 
          onClick={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      
      <div className="settings-section">
        <h3>About</h3>
        <div className="about-content">
          <p>Vyna AI Assistant Version 1.0.0</p>
          <p>© 2025 Vyna.live. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
