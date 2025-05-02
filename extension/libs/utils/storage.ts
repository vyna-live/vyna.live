// Storage utility for the extension

// User data type
export interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  role?: string;
  token: string;
}

// Settings type
export interface ExtensionSettings {
  theme: 'light' | 'dark';
  commentaryStyle: 'play-by-play' | 'color';
  extractPageContent: boolean;
}

// Default settings
export const DEFAULT_SETTINGS: ExtensionSettings = {
  theme: 'light',
  commentaryStyle: 'color',
  extractPageContent: true,
};

// Store user data
export const storeUser = async (userData: User): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ user: userData }, () => {
      resolve();
    });
  });
};

// Get stored user data
export const getStoredUser = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['user'], (result) => {
      resolve(result.user || null);
    });
  });
};

// Clear user data
export const clearUserData = async (): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['user'], () => {
      resolve();
    });
  });
};

// Store auth token
export const storeToken = async (token: string): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ token }, () => {
      resolve();
    });
  });
};

// Get stored auth token
export const getStoredToken = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['token'], (result) => {
      resolve(result.token || null);
    });
  });
};

// Store settings
export const storeSettings = async (settings: Partial<ExtensionSettings>): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      const currentSettings = result.settings || DEFAULT_SETTINGS;
      const updatedSettings = { ...currentSettings, ...settings };
      
      chrome.storage.local.set({ settings: updatedSettings }, () => {
        resolve();
      });
    });
  });
};

// Get stored settings
export const getStoredSettings = async (): Promise<ExtensionSettings> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve(result.settings || DEFAULT_SETTINGS);
    });
  });
};

// Store chat history for quick access
export const storeChatHistory = async (chats: any[]): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ recentChats: chats.slice(0, 10) }, () => {
      resolve();
    });
  });
};

// Get stored chat history
export const getStoredChatHistory = async (): Promise<any[]> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['recentChats'], (result) => {
      resolve(result.recentChats || []);
    });
  });
};

// Store notepad history for quick access
export const storeNotepadHistory = async (notepads: any[]): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ recentNotepads: notepads.slice(0, 10) }, () => {
      resolve();
    });
  });
};

// Get stored notepad history
export const getStoredNotepadHistory = async (): Promise<any[]> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['recentNotepads'], (result) => {
      resolve(result.recentNotepads || []);
    });
  });
};
