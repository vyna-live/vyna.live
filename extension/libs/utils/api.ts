// Base URL for the API
const API_BASE_URL = 'https://vyna.live/api';

/**
 * Base function for making API requests
 */
async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Auth-related API functions
 */
export async function getAuthStatus(): Promise<{ isAuthenticated: boolean, user?: any }> {
  try {
    const user = await apiRequest<any>('GET', '/user');
    return { isAuthenticated: true, user };
  } catch (error) {
    return { isAuthenticated: false };
  }
}

export async function login(credentials: { username: string; password: string }): Promise<any> {
  return apiRequest<any>('POST', '/login', credentials);
}

export async function logout(): Promise<void> {
  return apiRequest<void>('POST', '/logout');
}

export async function register(userData: { 
  username: string; 
  email: string; 
  password: string; 
  displayName?: string 
}): Promise<any> {
  return apiRequest<any>('POST', '/register', userData);
}

/**
 * AI Chat API functions
 */
export async function getChatSessions(): Promise<any[]> {
  return apiRequest<any[]>('GET', '/ai-chat/sessions');
}

export async function createChatSession(title: string): Promise<any> {
  return apiRequest<any>('POST', '/ai-chat/sessions', { title });
}

export async function getChatMessages(sessionId: number): Promise<any[]> {
  return apiRequest<any[]>('GET', `/ai-chat/sessions/${sessionId}/messages`);
}

export async function sendChatMessage(sessionId: number, message: string, commentaryStyle?: 'play-by-play' | 'color'): Promise<any> {
  return apiRequest<any>('POST', `/ai-chat/sessions/${sessionId}/messages`, { 
    content: message,
    commentaryStyle: commentaryStyle || 'color'
  });
}

/**
 * Notepad API functions
 */
export async function getNotes(): Promise<any[]> {
  return apiRequest<any[]>('GET', '/notepads');
}

export async function createNote(title: string, content: string): Promise<any> {
  return apiRequest<any>('POST', '/notepads', { title, content });
}

export async function updateNote(noteId: number, data: { title?: string; content?: string }): Promise<any> {
  return apiRequest<any>('PUT', `/notepads/${noteId}`, data);
}

export async function deleteNote(noteId: number): Promise<void> {
  return apiRequest<void>('DELETE', `/notepads/${noteId}`);
}

/**
 * File upload API functions
 */
export async function uploadFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  
  const url = `${API_BASE_URL}/files/upload`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `File upload failed with status ${response.status}`);
  }
  
  return response.json();
}

/**
 * Page context API function to send current page data to be processed
 */
export async function sendPageContext(pageData: {
  url: string;
  title: string;
  content: string;
}): Promise<any> {
  return apiRequest<any>('POST', '/context', pageData);
}
