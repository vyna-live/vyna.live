// Storage utility functions for browser extension

// Types
export interface StorageData {
  user?: any;
  token?: string;
  settings?: ExtensionSettings;
  activeChatId?: string;
  activeNoteId?: number;
  chatSessions?: {[key: string]: ChatSession};
}

export interface ExtensionSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  defaultCommentaryStyle: 'play-by-play' | 'color';
  autoSaveNotes: boolean;
  notificationsEnabled: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Default settings
const DEFAULT_SETTINGS: ExtensionSettings = {
  theme: 'system',
  fontSize: 'medium',
  defaultCommentaryStyle: 'color',
  autoSaveNotes: false,
  notificationsEnabled: true,
};

// Get all storage data
export async function getStorageData(): Promise<StorageData> {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (data) => {
      resolve(data as StorageData);
    });
  });
}

// Set storage data
export async function setStorageData(data: Partial<StorageData>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}

// Clear all storage data
export async function clearStorageData(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      resolve();
    });
  });
}

// Get user data
export async function getUser(): Promise<any | null> {
  const data = await getStorageData();
  return data.user || null;
}

// Get auth token
export async function getToken(): Promise<string | undefined> {
  const data = await getStorageData();
  return data.token;
}

// Set user and token
export async function setUserAuth(user: any, token: string): Promise<void> {
  await setStorageData({ user, token });
}

// Clear user and token
export async function clearUserAuth(): Promise<void> {
  await setStorageData({ user: undefined, token: undefined });
}

// Get settings
export async function getSettings(): Promise<ExtensionSettings> {
  const data = await getStorageData();
  return { ...DEFAULT_SETTINGS, ...data.settings };
}

// Set settings
export async function setSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  const currentSettings = await getSettings();
  await setStorageData({
    settings: { ...currentSettings, ...settings }
  });
}

// Get chat sessions
export async function getChatSessions(): Promise<{[key: string]: ChatSession} | null> {
  const data = await getStorageData();
  return data.chatSessions || null;
}

// Get a specific chat session
export async function getChatSession(id: string): Promise<ChatSession | null> {
  const sessions = await getChatSessions();
  return sessions && sessions[id] ? sessions[id] : null;
}

// Save a chat session
export async function saveChatSession(session: ChatSession): Promise<void> {
  const sessions = await getChatSessions() || {};
  sessions[session.id] = session;
  await setStorageData({ chatSessions: sessions });
}

// Delete a chat session
export async function deleteChatSession(id: string): Promise<void> {
  const sessions = await getChatSessions();
  if (sessions && sessions[id]) {
    delete sessions[id];
    await setStorageData({ chatSessions: sessions });
  }
}

// Set active chat ID
export async function setActiveChatId(id: string): Promise<void> {
  await setStorageData({ activeChatId: id });
}

// Get active chat ID
export async function getActiveChatId(): Promise<string | null> {
  const data = await getStorageData();
  return data.activeChatId || null;
}

// Set active note ID
export async function setActiveNoteId(id: number): Promise<void> {
  await setStorageData({ activeNoteId: id });
}

// Get active note ID
export async function getActiveNoteId(): Promise<number | null> {
  const data = await getStorageData();
  return data.activeNoteId || null;
}
