/**
 * Utilities for working with browser extension storage
 */

// Types for stored data
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  teleprompterSpeed: number; // 1-10
  defaultCommentaryStyle: 'play-by-play' | 'color';
}

export interface StoredAuthData {
  token?: string;
  userId?: number;
  username?: string;
  displayName?: string;
  lastLogin?: string;
}

// Default values
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  fontSize: 'medium',
  teleprompterSpeed: 5,
  defaultCommentaryStyle: 'color',
};

/**
 * Get data from storage
 */
export async function getStorageData<T>(key: string, defaultValue: T): Promise<T> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key] === undefined ? defaultValue : result[key]);
    });
  });
}

/**
 * Save data to storage
 */
export async function setStorageData(key: string, value: any): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
}

/**
 * Remove data from storage
 */
export async function removeStorageData(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, () => {
      resolve();
    });
  });
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  return getStorageData<UserPreferences>('preferences', DEFAULT_PREFERENCES);
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
  const currentPreferences = await getUserPreferences();
  const updatedPreferences = { ...currentPreferences, ...preferences };
  await setStorageData('preferences', updatedPreferences);
  return updatedPreferences;
}

/**
 * Get authenticated user data
 */
export async function getAuthData(): Promise<StoredAuthData | null> {
  return getStorageData<StoredAuthData | null>('authData', null);
}

/**
 * Set authenticated user data
 */
export async function setAuthData(authData: StoredAuthData): Promise<void> {
  return setStorageData('authData', authData);
}

/**
 * Clear authenticated user data (logout)
 */
export async function clearAuthData(): Promise<void> {
  return removeStorageData('authData');
}

/**
 * Save currently selected session ID
 */
export async function setCurrentSessionId(sessionId: number): Promise<void> {
  return setStorageData('currentSessionId', sessionId);
}

/**
 * Get currently selected session ID
 */
export async function getCurrentSessionId(): Promise<number | null> {
  return getStorageData<number | null>('currentSessionId', null);
}

/**
 * Save page context for current page
 */
export async function savePageContext(pageData: {
  url: string;
  title: string;
  content: string;
}): Promise<void> {
  return setStorageData('pageContext', {
    ...pageData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get saved page context
 */
export async function getPageContext(): Promise<{
  url: string;
  title: string;
  content: string;
  timestamp: string;
} | null> {
  return getStorageData('pageContext', null);
}

/**
 * Settings interface for app settings
 */
interface AppSettings {
  autoFetchPageContent: boolean;
  enableNotifications: boolean;
  defaultCommentaryStyle: 'play-by-play' | 'color';
  theme: 'light' | 'dark' | 'system';
}

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  autoFetchPageContent: true,
  enableNotifications: true,
  defaultCommentaryStyle: 'color',
  theme: 'system'
};

/**
 * Get app settings
 */
export async function getSettings(): Promise<AppSettings> {
  return getStorageData<AppSettings>('settings', DEFAULT_SETTINGS);
}

/**
 * Update app settings
 */
export async function updateSettings(settings: AppSettings): Promise<void> {
  return setStorageData('settings', settings);
}
