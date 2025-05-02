// Storage Utility Functions for Browser Extension

// Define types for stored data
export interface UserAuth {
  user: any;
  token: string;
  expiresAt?: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  defaultCommentaryStyle: 'play-by-play' | 'color';
  autoSaveNotes: boolean;
}

// Constants
const USER_AUTH_KEY = 'userAuth';
const SETTINGS_KEY = 'settings';

// Default settings
const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  defaultCommentaryStyle: 'color',
  autoSaveNotes: true
};

// Initialize storage with default values if needed
export const initStorage = async (): Promise<void> => {
  try {
    // Check if settings exist, if not create them
    const settings = await chrome.storage.local.get(SETTINGS_KEY);
    if (!settings[SETTINGS_KEY]) {
      await chrome.storage.local.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
    }
    
    // Check if auth token is expired and clear if needed
    const auth = await chrome.storage.local.get(USER_AUTH_KEY);
    if (auth[USER_AUTH_KEY]?.expiresAt && auth[USER_AUTH_KEY].expiresAt < Date.now()) {
      await chrome.storage.local.remove(USER_AUTH_KEY);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

// User Authentication Storage

// Set user authentication data
export const setUserAuth = async (authData: UserAuth): Promise<void> => {
  try {
    // Add expiration time if not present (default 7 days)
    if (!authData.expiresAt) {
      authData.expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
    }
    
    await chrome.storage.local.set({ [USER_AUTH_KEY]: authData });
  } catch (error) {
    console.error('Error saving auth data:', error);
    throw error;
  }
};

// Get user authentication data
export const getUserAuth = async (): Promise<UserAuth | null> => {
  try {
    const data = await chrome.storage.local.get(USER_AUTH_KEY);
    return data[USER_AUTH_KEY] || null;
  } catch (error) {
    console.error('Error getting auth data:', error);
    return null;
  }
};

// Clear user authentication data (logout)
export const clearUserAuth = async (): Promise<void> => {
  try {
    await chrome.storage.local.remove(USER_AUTH_KEY);
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};

// Settings Storage

// Get user settings
export const getSettings = async (): Promise<Settings> => {
  try {
    const data = await chrome.storage.local.get(SETTINGS_KEY);
    return data[SETTINGS_KEY] || DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
};

// Update user settings
export const updateSettings = async (settings: Settings): Promise<void> => {
  try {
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', settings.theme);
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// Recent Searches Storage

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 10;

// Add a search query to recent searches
export const addRecentSearch = async (query: string): Promise<void> => {
  try {
    const data = await chrome.storage.local.get(RECENT_SEARCHES_KEY);
    let searches = data[RECENT_SEARCHES_KEY] || [];
    
    // Remove if already exists (to avoid duplicates)
    searches = searches.filter((item: string) => item !== query);
    
    // Add to beginning of array
    searches.unshift(query);
    
    // Limit to max items
    searches = searches.slice(0, MAX_RECENT_SEARCHES);
    
    await chrome.storage.local.set({ [RECENT_SEARCHES_KEY]: searches });
  } catch (error) {
    console.error('Error adding recent search:', error);
  }
};

// Get recent searches
export const getRecentSearches = async (): Promise<string[]> => {
  try {
    const data = await chrome.storage.local.get(RECENT_SEARCHES_KEY);
    return data[RECENT_SEARCHES_KEY] || [];
  } catch (error) {
    console.error('Error getting recent searches:', error);
    return [];
  }
};

// Clear recent searches
export const clearRecentSearches = async (): Promise<void> => {
  try {
    await chrome.storage.local.remove(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.error('Error clearing recent searches:', error);
  }
};

// Apply Settings Function

// Apply current settings to the UI
export const applyCurrentSettings = async (): Promise<void> => {
  try {
    const settings = await getSettings();
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    // Apply any other settings as needed
  } catch (error) {
    console.error('Error applying settings:', error);
  }
};
