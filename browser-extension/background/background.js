// Background script for Vyna.live extension

// Base URL for all API calls
const API_BASE_URL = 'https://vyna-assistant-diweesomchi.replit.app';

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
    login(message.data.usernameOrEmail, message.data.password)
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
    console.log('Using API URL:', API_BASE_URL);
    
    // Test CORS with a simple OPTIONS request first
    console.log('Testing CORS with OPTIONS request...');
    try {
      const optionsResponse = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'OPTIONS',
        headers: {
          'Accept': 'application/json',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Accept',
          'Origin': chrome.runtime.getURL('')
        }
      });
      console.log('OPTIONS request result:', {
        status: optionsResponse.status,
        statusText: optionsResponse.statusText,
        headers: [...optionsResponse.headers.entries()].map(e => `${e[0]}: ${e[1]}`).join(', ')
      });
    } catch (optionsError) {
      console.error('OPTIONS preflight failed:', optionsError);
    }
    
    // Now try the actual login request
    console.log('Sending actual login request...');
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': chrome.runtime.getURL('')
      },
      body: JSON.stringify({ usernameOrEmail, password }),
      credentials: 'include' // Include cookies in the request
    });
    
    console.log('Login response status:', response.status);
    console.log('Login response headers:', [...response.headers.entries()].map(e => `${e[0]}: ${e[1]}`).join(', '));
    
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
    console.log('Attempting to register user:', userData.username);
    console.log('Using API URL:', API_BASE_URL);
    
    // Test CORS with a simple OPTIONS request first
    console.log('Testing CORS with OPTIONS request for registration...');
    try {
      const optionsResponse = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'OPTIONS',
        headers: {
          'Accept': 'application/json',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Accept',
          'Origin': chrome.runtime.getURL('')
        }
      });
      console.log('Registration OPTIONS request result:', {
        status: optionsResponse.status,
        statusText: optionsResponse.statusText,
        headers: [...optionsResponse.headers.entries()].map(e => `${e[0]}: ${e[1]}`).join(', ')
      });
    } catch (optionsError) {
      console.error('Registration OPTIONS preflight failed:', optionsError);
    }
    
    // Now try the actual registration request
    console.log('Sending actual registration request...');
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': chrome.runtime.getURL('')
      },
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    
    console.log('Registration response status:', response.status);
    console.log('Registration response headers:', [...response.headers.entries()].map(e => `${e[0]}: ${e[1]}`).join(', '));
    
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
    console.log(`Preparing API request to ${endpoint}`, { 
      method, 
      includeAuth, 
      hasToken: !!authState.token,
      hasUser: !!authState.user,
      bodyData: data ? 'data present' : 'no data'
    });
    
    // Build the URL for the request
    let requestUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`Full API URL: ${requestUrl}`);
    
    // If this is going to be a POST/PUT/PATCH request, do an OPTIONS preflight test first
    if (method !== 'GET' && method !== 'HEAD') {
      console.log(`Testing CORS with OPTIONS request for ${method} ${endpoint}...`);
      try {
        const optionsResponse = await fetch(requestUrl, {
          method: 'OPTIONS',
          headers: {
            'Accept': 'application/json',
            'Access-Control-Request-Method': method,
            'Access-Control-Request-Headers': 'Content-Type,Accept,Authorization',
            'Origin': chrome.runtime.getURL('')
          }
        });
        console.log(`OPTIONS request result for ${endpoint}:`, {
          status: optionsResponse.status,
          statusText: optionsResponse.statusText,
          headers: [...optionsResponse.headers.entries()].map(e => `${e[0]}: ${e[1]}`).join(', ')
        });
      } catch (optionsError) {
        console.error(`OPTIONS preflight failed for ${endpoint}:`, optionsError);
      }
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': chrome.runtime.getURL('')
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
      console.log('Added Authorization header with token');
    }
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(data);
      console.log(`Request body prepared for ${method}`, { 
        dataKeys: Object.keys(data),
        contentLength: JSON.stringify(data).length
      });
    }
    
    // URL was already defined above, just log the request now
    console.log(`Sending ${method} request to: ${requestUrl}`);
    
    // If hostId is missing in the data but user is authenticated, add it
    if (data && !data.hostId && authState.user && authState.user.id && 
        (endpoint.includes('/api/ai-chat') || endpoint.includes('/api/ai-chat-sessions'))) {
      data.hostId = authState.user.id;
      console.log('Added missing hostId to request data:', authState.user.id);
      
      // Update the request body with the new data
      if (fetchOptions.body) {
        fetchOptions.body = JSON.stringify(data);
      }
    }
    
    const response = await fetch(requestUrl, fetchOptions);
    console.log(`Response received from ${endpoint}:`, { 
      status: response.status, 
      statusText: response.statusText,
      headers: [...response.headers.entries()].map(([key, value]) => `${key}: ${value}`).join(', ')
    });
    
    if (!response.ok) {
      console.error(`API error for ${endpoint}:`, { status: response.status, statusText: response.statusText });
      
      // Handle 401 Unauthorized
      if (response.status === 401 && includeAuth) {
        console.warn('Authentication invalid or expired, clearing auth data');
        clearAuthData();
        throw new Error('Authentication expired. Please log in again.');
      }
      
      // Try to get error details from the response
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    // Try to parse the JSON response
    let responseData;
    try {
      responseData = await response.json();
      console.log(`Parsed JSON response from ${endpoint}`, { 
        dataKeys: responseData ? Object.keys(responseData) : 'no data' 
      });
    } catch (parseError) {
      console.warn(`Could not parse JSON from ${endpoint}:`, parseError);
      responseData = {};
    }
    
    return { success: true, data: responseData };
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Handle file uploads
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPLOAD_FILE') {
    console.log('File upload request received:', { 
      fileName: message.data.fileName, 
      fileType: message.data.fileType,
      fileDataLength: message.data.fileData ? message.data.fileData.length : 0
    });
    
    const { fileData, fileName, fileType } = message.data;
    let { hostId } = message.data;
    
    // If no hostId is provided but user is authenticated, use the user's ID
    if (!hostId && authState.user && authState.user.id) {
      hostId = authState.user.id;
      console.log('Using authenticated user ID for file upload:', hostId);
    }
    
    // Validate required data
    if (!fileData) {
      console.error('File upload error: No file data provided');
      sendResponse({ success: false, error: 'No file data provided' });
      return true;
    }
    
    if (!hostId) {
      console.error('File upload error: No host ID provided and user not authenticated');
      sendResponse({ success: false, error: 'User ID not available, please log in again' });
      return true;
    }
    
    try {
      console.log('Processing file data for upload');
      
      // Convert base64 to blob
      const base64Data = fileData.split(',');
      if (base64Data.length < 2) {
        throw new Error('Invalid file data format');
      }
      
      const byteString = atob(base64Data[1]);
      const mimeString = base64Data[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeString });
      console.log('Created blob from file data:', { type: mimeString, size: blob.size });
      
      const formData = new FormData();
      formData.append('file', blob, fileName || 'unknown_file');
      formData.append('hostId', hostId);
      
      if (fileType) {
        formData.append('fileType', fileType);
      }
      
      console.log('Sending file upload request:', { 
        fileName: fileName || 'unknown_file',
        hostId,
        fileType: fileType || 'unspecified'
      });
      
      const fullUrl = `${API_BASE_URL}/api/files/upload`;
      console.log('Upload URL:', fullUrl);
      
      // Prepare headers with authentication
      const headers = {};
      if (authState.token) {
        headers['Authorization'] = `Bearer ${authState.token}`;
      }
      
      // Send the request
      fetch(fullUrl, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include'
      })
      .then(response => {
        console.log('File upload response status:', response.status);
        if (!response.ok) {
          return response.text().then(text => {
            try {
              // Try to parse as JSON
              const errorData = JSON.parse(text);
              throw new Error(errorData.message || errorData.error || `Upload failed with status ${response.status}`);
            } catch (e) {
              // If parsing fails, use the text as is
              throw new Error(`Upload failed with status ${response.status}: ${text}`);
            }
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('File upload successful:', data);
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error('Upload error:', error);
        sendResponse({ success: false, error: error.message });
      });
    } catch (error) {
      console.error('File processing error:', error);
      sendResponse({ success: false, error: error.message });
    }
    
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
