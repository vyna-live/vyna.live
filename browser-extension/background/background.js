// Background script for Vyna.live extension

// Base URL for all API calls
const API_BASE_URL = 'https://vyna-live.replit.app';

// Authentication state
let authState = {
  isAuthenticated: false,
  token: null,
  user: null
};

// Initialize the extension
async function initialize() {
  // Try to restore auth state from storage
  const stored = await chrome.storage.local.get(['authToken', 'user']);
  
  if (stored.authToken && stored.user) {
    // Verify the token is still valid
    try {
      const response = await fetch(`${API_BASE_URL}/api/user`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        authState = {
          isAuthenticated: true,
          token: stored.authToken,
          user: userData
        };
        
        console.log('Authentication restored');
      } else {
        // Token invalid - clear storage
        clearAuthData();
      }
    } catch (error) {
      console.error('Error verifying authentication:', error);
      clearAuthData();
    }
  }
}

// Clear authentication data
function clearAuthData() {
  chrome.storage.local.remove(['authToken', 'user']);
  authState = {
    isAuthenticated: false,
    token: null,
    user: null
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_AUTH_STATE') {
    sendResponse(authState);
    return true;
  }
  
  if (message.type === 'LOGIN') {
    login(message.data.username, message.data.password)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.type === 'REGISTER') {
    register(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.type === 'LOGOUT') {
    logout().then(() => sendResponse({ success: true }));
    return true;
  }
  
  // Handle API calls
  if (message.type === 'API_REQUEST') {
    handleApiRequest(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Handle login
async function login(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    const data = await response.json();
    
    // Save authentication data
    authState = {
      isAuthenticated: true,
      token: data.token,
      user: data.user
    };
    
    await chrome.storage.local.set({
      authToken: data.token,
      user: data.user
    });
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Handle registration
async function register(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    
    const data = await response.json();
    
    // Auto-login after successful registration
    return login(userData.username, userData.password);
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

// Handle logout
async function logout() {
  try {
    // Send logout request with cookies
    await fetch(`${API_BASE_URL}/api/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearAuthData();
  }
}

// Handle API requests
async function handleApiRequest({ endpoint, method = 'GET', data = null, includeAuth = true }) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const fetchOptions = {
      method,
      headers,
      credentials: 'include' // Always include credentials for cookies
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    
    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401 && includeAuth) {
        clearAuthData();
        throw new Error('Authentication expired. Please log in again.');
      }
      
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }
    
    const responseData = await response.json().catch(() => ({}));
    return { success: true, data: responseData };
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Handle file uploads
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPLOAD_FILE') {
    const { fileData, fileName, fileType, hostId } = message.data;
    
    // Convert base64 to blob
    const byteString = atob(fileData.split(',')[1]);
    const mimeString = fileData.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('hostId', hostId);
    
    if (fileType) {
      formData.append('fileType', fileType);
    }
    
    fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      credentials: 'include', // Include cookies for authentication
      body: formData
    })
    .then(response => response.json())
    .then(data => sendResponse({ success: true, data }))
    .catch(error => {
      console.error('Upload error:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true;
  }
});

// Initialize the extension when installed or updated
chrome.runtime.onInstalled.addListener(details => {
  console.log('Extension installed or updated:', details.reason);
  initialize();
});

// Initialize when the background script loads
initialize();
