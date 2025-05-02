// API Utility Functions

// Base API URL
const API_BASE_URL = 'https://vyna.live/api';

// Helper function to construct API URLs
const buildUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Basic request function with error handling
const makeRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'An error occurred while making the request',
        status: response.status
      };
    }
    
    return {
      success: true,
      data,
      status: response.status
    };
  } catch (error) {
    console.error('API request error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
      status: 0
    };
  }
};

// Authentication Functions

// Register a new user
export const register = async (username: string, email: string, password: string) => {
  const url = buildUrl('/register');
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, email, password })
  };
  
  return await makeRequest(url, options);
};

// Login an existing user
export const login = async (username: string, password: string) => {
  const url = buildUrl('/login');
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  };
  
  return await makeRequest(url, options);
};

// Logout current user
export const logout = async (token: string) => {
  const url = buildUrl('/logout');
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  return await makeRequest(url, options);
};

// Get current user information
export const getCurrentUser = async (token: string) => {
  const url = buildUrl('/user');
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
  
  return await makeRequest(url, options);
};

// AI Chat Functions

// Get AI response
export const getAiResponse = async (message: string, commentaryStyle: 'play-by-play' | 'color', token: string) => {
  const url = buildUrl('/ai/chat');
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message, commentaryStyle })
  };
  
  return await makeRequest(url, options);
};

// Create new chat session
export const createChatSession = async (title: string, token: string) => {
  const url = buildUrl('/ai/chat/session');
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title })
  };
  
  return await makeRequest(url, options);
};

// Get chat sessions
export const getChatSessions = async (token: string) => {
  const url = buildUrl('/ai/chat/sessions');
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
  
  return await makeRequest(url, options);
};

// Get chat session messages
export const getChatSessionMessages = async (sessionId: number, token: string) => {
  const url = buildUrl(`/ai/chat/session/${sessionId}`);
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
  
  return await makeRequest(url, options);
};

// Notepad Functions

// Get user notes
export const getNotes = async (token: string) => {
  const url = buildUrl('/notes');
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
  
  return await makeRequest(url, options);
};

// Get specific note
export const getNote = async (noteId: number, token: string) => {
  const url = buildUrl(`/notes/${noteId}`);
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
  
  return await makeRequest(url, options);
};

// Save new note
export const saveNote = async (title: string, content: string, token: string) => {
  const url = buildUrl('/notes');
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, content })
  };
  
  return await makeRequest(url, options);
};

// Update existing note
export const updateNote = async (noteId: number, title: string, content: string, token: string) => {
  const url = buildUrl(`/notes/${noteId}`);
  const options = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, content })
  };
  
  return await makeRequest(url, options);
};

// Delete note
export const deleteNote = async (noteId: number, token: string) => {
  const url = buildUrl(`/notes/${noteId}`);
  const options = {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
  
  return await makeRequest(url, options);
};

// File upload function (for AI context)
export const uploadFile = async (file: File, token: string) => {
  const url = buildUrl('/files/upload');
  
  const formData = new FormData();
  formData.append('file', file);
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  };
  
  return await makeRequest(url, options);
};
