// API utility functions for browser extension

// Base API URL
const API_BASE_URL = 'https://vyna.live/api';

// Types
interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  token?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Function to make API requests
export async function apiRequest<T>(
  options: ApiRequestOptions
): Promise<ApiResponse<T>> {
  try {
    // Get saved token if not provided
    let token = options.token;
    if (!token) {
      const storage = await new Promise<{token?: string}>((resolve) => {
        chrome.storage.local.get(['token'], (items) => {
          resolve(items as {token?: string});
        });
      });
      token = storage.token;
    }

    // Build request URL
    const url = `${API_BASE_URL}${options.endpoint}`;

    // Build request options
    const fetchOptions: RequestInit = {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add authorization header if token exists
    if (token) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    // Add body for POST/PUT requests
    if (['POST', 'PUT'].includes(options.method) && options.data) {
      fetchOptions.body = JSON.stringify(options.data);
    }

    // Make the request
    const response = await fetch(url, fetchOptions);

    // Handle non-OK responses
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        throw new Error('Authentication error. Please log in again.');
      }
      
      // Try to parse error message from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      } catch {
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    // Parse and return successful response
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('API request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Authentication functions
export async function login(username: string, password: string): Promise<ApiResponse<{user: any, token: string}>> {
  return apiRequest({
    method: 'POST',
    endpoint: '/login',
    data: { username, password },
  });
}

export async function register(userData: {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}): Promise<ApiResponse<{user: any, token: string}>> {
  return apiRequest({
    method: 'POST',
    endpoint: '/register',
    data: userData,
  });
}

export async function logout(): Promise<ApiResponse<void>> {
  return apiRequest({
    method: 'POST',
    endpoint: '/logout',
  });
}

export async function getCurrentUser(): Promise<ApiResponse<any>> {
  return apiRequest({
    method: 'GET',
    endpoint: '/user',
  });
}

// AI Chat functions
export async function sendChatMessage(message: string, commentaryStyle: 'play-by-play' | 'color', pageInfo?: { title: string, url: string, content?: string }): Promise<ApiResponse<any>> {
  const data: any = {
    message,
    commentaryStyle,
    source: 'extension',
  };

  // Add page info if available
  if (pageInfo) {
    data.pageTitle = pageInfo.title;
    data.pageUrl = pageInfo.url;
    if (pageInfo.content) {
      data.pageContent = pageInfo.content;
    }
  }

  return apiRequest({
    method: 'POST',
    endpoint: '/ai/chat',
    data,
  });
}

// Notes functions
export async function saveNote(title: string, content: string, sourceUrl?: string): Promise<ApiResponse<any>> {
  return apiRequest({
    method: 'POST',
    endpoint: '/notepads',
    data: {
      title,
      content,
      source: 'extension',
      sourceUrl,
    },
  });
}

export async function getNotes(): Promise<ApiResponse<any[]>> {
  return apiRequest({
    method: 'GET',
    endpoint: '/notepads',
  });
}

export async function getNote(id: number): Promise<ApiResponse<any>> {
  return apiRequest({
    method: 'GET',
    endpoint: `/notepads/${id}`,
  });
}

export async function updateNote(id: number, data: { title?: string, content?: string }): Promise<ApiResponse<any>> {
  return apiRequest({
    method: 'PUT',
    endpoint: `/notepads/${id}`,
    data,
  });
}

export async function deleteNote(id: number): Promise<ApiResponse<void>> {
  return apiRequest({
    method: 'DELETE',
    endpoint: `/notepads/${id}`,
  });
}
