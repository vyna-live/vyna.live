// Background script for Vyna.live extension

// Base URL for all API calls
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://api.vyna.live';

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
  
  if (stored.authToken || stored.user) {
    // Verify the user session is still valid using cookies and/or token
    try {
      console.log('Attempting to restore authentication state');
      
      // Use both token and cookie-based auth for maximum compatibility
      const response = await fetch(`${API_BASE_URL}/api/user`, {
        headers: {
          'Accept': 'application/json',
          ...(stored.authToken ? { 'Authorization': `Bearer ${stored.authToken}` } : {})
        },
        credentials: 'include' // Include cookies for session-based auth
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User data retrieved successfully:', userData);
        
        authState = {
          isAuthenticated: true,
          token: stored.authToken || null,
          user: userData
        };
        
        console.log('Authentication restored successfully');
      } else {
        console.log('Authentication restoration failed:', response.status);
        // Auth invalid - clear storage
        clearAuthData();
      }
    } catch (error) {
      console.error('Error verifying authentication:', error);
      clearAuthData();
    }
  } else {
    console.log('No stored authentication found');
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
  
  if (message.type === 'GOOGLE_AUTH') {
    handleGoogleAuth()
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
async function login(usernameOrEmail, password) {
  try {
    console.log('Attempting login with:', usernameOrEmail);
    
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ usernameOrEmail, password }),
      credentials: 'include' // Include cookies in the request
    });
    
    console.log('Login response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Login successful, user data:', data);
    
    // Save authentication data - ensure we have the correct user data structure
    const userData = data.user || data;
    
    // Store this session in the extension storage
    authState = {
      isAuthenticated: true,
      token: data.token || null, // Some authentication systems don't use tokens
      user: userData
    };
    
    await chrome.storage.local.set({
      authToken: authState.token,
      user: userData
    });
    
    return { success: true, user: userData };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Handle Google authentication
async function handleGoogleAuth() {
  try {
    console.log('Starting Google authentication flow');
    
    // This is a simplified version - in a real extension, you'd use chrome.identity.launchWebAuthFlow
    // For now, we'll just redirect to the Google auth endpoint
    const redirectURL = chrome.identity.getRedirectURL();
    console.log('Redirect URL:', redirectURL);
    
    // In a real implementation, you would use your own Google Client ID
    // For now, we'll use a placeholder that will be replaced in production
    const clientId = API_BASE_URL.includes('localhost') 
      ? 'DEVELOPMENT_GOOGLE_CLIENT_ID' 
      : 'PRODUCTION_GOOGLE_CLIENT_ID';
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectURL);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', 'profile email');
    
    console.log('Launching web auth flow with URL:', authUrl.toString());
    
    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true
    });
    
    console.log('Received auth response URL:', responseUrl);
    
    // Parse the access token from the response URL
    const accessToken = new URLSearchParams(new URL(responseUrl).hash.substring(1)).get('access_token');
    console.log('Extracted access token:', accessToken ? 'Token received' : 'No token found');
    
    // Send the token to your backend
    const response = await fetch(`${API_BASE_URL}/api/google-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ token: accessToken }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Google authentication failed');
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
    console.error('Google auth error:', error);
    throw error;
  }
}

// Handle registration
async function register(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData),
      credentials: 'include'
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
    await fetch(`${API_BASE_URL}/api/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {})
      },
      credentials: 'include'
    });
    console.log("Logout request sent successfully");
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
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Include credentials for session-based auth
    const fetchOptions = {
      method,
      headers,
      credentials: 'include'  // Include cookies for session auth
    };
    
    // Also include token auth if available
    if (includeAuth && authState.token) {
      headers['Authorization'] = `Bearer ${authState.token}`;
    }
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(data);
    }
    
    console.log(`API Request to ${endpoint}:`, { 
      method, 
      includeAuth, 
      hasToken: !!authState.token,
      withCredentials: true
    });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    
    if (!response.ok) {
      console.error(`API error for ${endpoint}:`, { status: response.status, statusText: response.statusText });
      
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
      headers: {
        'Authorization': `Bearer ${authState.token}`
      },
      body: formData,
      credentials: 'include'
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
