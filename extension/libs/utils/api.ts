// API utilities for the extension

import { getStoredToken } from './storage';

export interface ApiRequestOptions {
  method: string;
  endpoint: string;
  data?: any;
  token?: string;
}

// Base URL for the API
const API_BASE_URL = 'https://vyna.live/api';

// Function to make API requests
export const apiRequest = async <T>(
  method: string,
  endpoint: string,
  data?: any
): Promise<T> => {
  try {
    // Request through background script to handle cross-origin requests
    const response = await new Promise<{ success: boolean; data?: T; error?: string }>(
      (resolve) => {
        chrome.runtime.sendMessage(
          {
            type: 'apiRequest',
            method,
            endpoint,
            data,
          },
          (response) => {
            resolve(response);
          }
        );
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }

    return response.data as T;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    throw error;
  }
};

// Authentication API calls
export const login = async (username: string, password: string) => {
  return apiRequest<any>('POST', '/login', { username, password });
};

export const register = async (userData: {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}) => {
  return apiRequest<any>('POST', '/register', userData);
};

export const logout = async () => {
  return apiRequest<void>('POST', '/logout');
};

export const getCurrentUser = async () => {
  return apiRequest<any>('GET', '/user');
};

// AI Chat API calls
export const getAiChats = async () => {
  return apiRequest<any[]>('GET', '/ai-chats');
};

export const getAiChatById = async (chatId: number) => {
  return apiRequest<any>('GET', `/ai-chats/${chatId}`);
};

export const createAiChat = async (title: string, initialMessage?: string) => {
  return apiRequest<any>('POST', '/ai-chats', { title, initialMessage });
};

export const sendChatMessage = async (
  chatId: number,
  message: string,
  style?: 'play-by-play' | 'color',
  pageContent?: string
) => {
  return apiRequest<any>('POST', `/ai-chats/${chatId}/messages`, {
    content: message,
    commentaryStyle: style,
    pageContent,
  });
};

export const renameAiChat = async (chatId: number, title: string) => {
  return apiRequest<any>('PATCH', `/ai-chats/${chatId}`, { title });
};

export const deleteAiChat = async (chatId: number) => {
  return apiRequest<void>('DELETE', `/ai-chats/${chatId}`);
};

// Notepad API calls
export const getNotepads = async () => {
  return apiRequest<any[]>('GET', '/notepads');
};

export const getNotepadById = async (notepadId: number) => {
  return apiRequest<any>('GET', `/notepads/${notepadId}`);
};

export const createNotepad = async (title: string, content: string) => {
  return apiRequest<any>('POST', '/notepads', { title, content });
};

export const updateNotepad = async (notepadId: number, content: string, title?: string) => {
  const updateData: { content: string; title?: string } = { content };
  if (title) updateData.title = title;
  
  return apiRequest<any>('PATCH', `/notepads/${notepadId}`, updateData);
};

export const deleteNotepad = async (notepadId: number) => {
  return apiRequest<void>('DELETE', `/notepads/${notepadId}`);
};

// Utility to extract content from current page
export const extractCurrentPageContent = async (): Promise<{
  title: string;
  url: string;
  content: string;
}> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'extractCurrentPageContent' },
      (response) => {
        if (response && response.success) {
          resolve({
            title: response.title,
            url: response.url,
            content: response.content,
          });
        } else {
          reject(new Error(response?.error || 'Failed to extract page content'));
        }
      }
    );
  });
};
