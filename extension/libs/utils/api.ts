// API utility functions for the extension

const API_BASE_URL = 'https://vyna.live/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email?: string;
    displayName?: string;
    role?: string;
  };
}

// Generic API request function
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  token?: string
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.error || 'An unknown error occurred',
      };
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error('API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

// Authentication functions
export async function login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<LoginResponse>('POST', '/login', { username, password });
}

export async function register(username: string, email: string, password: string): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<LoginResponse>('POST', '/register', { username, email, password });
}

export async function logout(token: string): Promise<ApiResponse<null>> {
  return apiRequest<null>('POST', '/logout', undefined, token);
}

export async function getCurrentUser(token: string): Promise<ApiResponse<any>> {
  return apiRequest<any>('GET', '/user', undefined, token);
}

// AI Chat functions
export async function getAiResponse(message: string, commentaryStyle: 'play-by-play' | 'color', token: string): Promise<ApiResponse<any>> {
  return apiRequest<any>('POST', '/chat/ai', { message, commentaryStyle }, token);
}

export async function getChatHistory(token: string): Promise<ApiResponse<any>> {
  return apiRequest<any>('GET', '/chat/history', undefined, token);
}

export async function getChatSession(sessionId: number, token: string): Promise<ApiResponse<any>> {
  return apiRequest<any>('GET', `/chat/session/${sessionId}`, undefined, token);
}

export async function createChatSession(title: string, token: string): Promise<ApiResponse<any>> {
  return apiRequest<any>('POST', '/chat/session/create', { title }, token);
}

// Notepad functions
export async function saveNote(title: string, content: string, token: string): Promise<ApiResponse<any>> {
  return apiRequest<any>('POST', '/notes/create', { title, content }, token);
}

export async function getNotes(token: string): Promise<ApiResponse<any>> {
  return apiRequest<any>('GET', '/notes', undefined, token);
}

export async function getNote(noteId: number, token: string): Promise<ApiResponse<any>> {
  return apiRequest<any>('GET', `/notes/${noteId}`, undefined, token);
}

export async function updateNote(noteId: number, title: string, content: string, token: string): Promise<ApiResponse<any>> {
  return apiRequest<any>('PUT', `/notes/${noteId}`, { title, content }, token);
}

export async function deleteNote(noteId: number, token: string): Promise<ApiResponse<any>> {
  return apiRequest<any>('DELETE', `/notes/${noteId}`, undefined, token);
}

// Extract page content (for content script to background communication)
export interface PageContent {
  title: string;
  url: string;
  selection: string;
  metaDescription: string;
  pageText: string;
}
