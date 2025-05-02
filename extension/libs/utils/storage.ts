// Storage utility functions for the extension

interface UserAuth {
  token: string;
  user: {
    id: number;
    username: string;
    email?: string;
    displayName?: string;
    role?: string;
  };
}

interface StorageData {
  userAuth: UserAuth | null;
  settings: {
    theme: 'light' | 'dark' | 'system';
    defaultCommentaryStyle: 'play-by-play' | 'color';
    autoSaveNotes: boolean;
  };
}

// Default settings
const DEFAULT_SETTINGS: StorageData['settings'] = {
  theme: 'system',
  defaultCommentaryStyle: 'color',
  autoSaveNotes: true
};

// Initialize storage with default values if not set
export async function initStorage(): Promise<void> {
  const data = await chrome.storage.local.get(['userAuth', 'settings']);
  
  if (!data.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
}

// Get user authentication data
export async function getUserAuth(): Promise<UserAuth | null> {
  const data = await chrome.storage.local.get('userAuth');
  return data.userAuth || null;
}

// Set user authentication data
export async function setUserAuth(authData: UserAuth): Promise<void> {
  await chrome.storage.local.set({ userAuth: authData });
}

// Clear user authentication data (logout)
export async function clearUserAuth(): Promise<void> {
  await chrome.storage.local.remove('userAuth');
}

// Get all storage data
export async function getStorageData(): Promise<StorageData> {
  const data = await chrome.storage.local.get(['userAuth', 'settings']);
  
  return {
    userAuth: data.userAuth || null,
    settings: data.settings || DEFAULT_SETTINGS
  };
}

// Update settings
export async function updateSettings(settings: Partial<StorageData['settings']>): Promise<void> {
  const data = await chrome.storage.local.get('settings');
  const currentSettings = data.settings || DEFAULT_SETTINGS;
  
  await chrome.storage.local.set({
    settings: { ...currentSettings, ...settings }
  });
}

// Get settings
export async function getSettings(): Promise<StorageData['settings']> {
  const data = await chrome.storage.local.get('settings');
  return data.settings || DEFAULT_SETTINGS;
}

// Clear all stored data
export async function clearUserData(): Promise<void> {
  await chrome.storage.local.remove(['userAuth']);
}