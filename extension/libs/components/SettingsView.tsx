import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredSettings, storeSettings, DEFAULT_SETTINGS } from '@libs/utils/storage';
import { ExtensionSettings } from '@libs/utils/storage';
import Logo from '@libs/components/ui/Logo';

const SettingsView: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  
  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const storedSettings = await getStoredSettings();
        setSettings(storedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // Handle setting changes
  const handleSettingChange = (key: keyof ExtensionSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  
  // Save settings
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await storeSettings(settings);
      setSaveStatus('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset settings to default
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings(DEFAULT_SETTINGS);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="settings-view-container p-4">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-3 text-gray-600 hover:text-primary"
          >
            ←
          </button>
          <h1 className="font-medium text-lg">Settings</h1>
        </div>
        
        <Logo size={32} />
      </header>
      
      {saveStatus && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${saveStatus.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
        >
          {saveStatus}
        </div>
      )}
      
      <div className="settings-group mb-6">
        <h2 className="text-sm font-medium mb-3 text-gray-700">General Settings</h2>
        
        <div className="settings-option mb-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="theme" className="block text-sm font-medium mb-1">
                Theme
              </label>
              <p className="text-xs text-gray-500">Choose your preferred theme</p>
            </div>
            <select
              id="theme"
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
              className="text-sm rounded-md border-gray-300 focus:ring-primary focus:border-primary"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        
        <div className="settings-option mb-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="extractPageContent" className="block text-sm font-medium mb-1">
                Extract Page Content
              </label>
              <p className="text-xs text-gray-500">Automatically extract content from web pages</p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="extractPageContent"
                checked={settings.extractPageContent}
                onChange={(e) => handleSettingChange('extractPageContent', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="settings-group mb-6">
        <h2 className="text-sm font-medium mb-3 text-gray-700">AI Assistant Settings</h2>
        
        <div className="settings-option mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Default Commentary Style
            </label>
            <p className="text-xs text-gray-500 mb-3">Choose how the AI responds to your messages</p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="commentaryStyle-color"
                name="commentaryStyle"
                value="color"
                checked={settings.commentaryStyle === 'color'}
                onChange={() => handleSettingChange('commentaryStyle', 'color')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label htmlFor="commentaryStyle-color" className="ml-2 block text-sm">
                <span className="font-medium">Color Commentary</span>
                <p className="text-xs text-gray-500">Detailed, insightful responses with context and explanations</p>
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="radio"
                id="commentaryStyle-play-by-play"
                name="commentaryStyle"
                value="play-by-play"
                checked={settings.commentaryStyle === 'play-by-play'}
                onChange={() => handleSettingChange('commentaryStyle', 'play-by-play')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label htmlFor="commentaryStyle-play-by-play" className="ml-2 block text-sm">
                <span className="font-medium">Play-by-Play</span>
                <p className="text-xs text-gray-500">Quick, action-oriented responses focused on key points</p>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={handleReset}
          className="text-sm text-gray-600 hover:text-red-600"
          disabled={isSaving}
        >
          Reset to Default
        </button>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
