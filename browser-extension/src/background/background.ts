// Global state
let authState = {
  isAuthenticated: false,
  user: null,
  token: null
};

// API base URL
const API_BASE_URL = 'https://api.vyna.live';

// Event listeners for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_AUTH_STATE') {
    // Return current authentication state
    sendResponse(authState);
    return true;
  }
  
  if (message.type === 'API_REQUEST') {
    // Handle API requests
    handleApiRequest(message.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.type === 'GOOGLE_SIGN_IN') {
    // Handle Google sign-in flow
    initiateGoogleSignIn()
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Handle API requests
async function handleApiRequest({ endpoint, method, body }: { endpoint: string; method: string; body?: any }) {
  try {
    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {})
      },
      credentials: 'include' as RequestCredentials
    };
    
    // Add body for non-GET requests
    if (method !== 'GET' && body) {
      requestOptions.body = JSON.stringify(body);
    }
    
    // Make the API request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
    
    // Handle response status
    if (!response.ok) {
      if (response.status === 401) {
        // Clear auth state on unauthorized
        authState = {
          isAuthenticated: false,
          user: null,
          token: null
        };
      }
      
      const errorText = await response.text();
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }
    
    // Parse JSON response
    const data = await response.json();
    
    // Handle authentication responses
    if (endpoint === '/api/login' || endpoint === '/api/register') {
      authState = {
        isAuthenticated: true,
        user: data,
        token: response.headers.get('Authorization')?.replace('Bearer ', '') || null
      };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('API request error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Initialize Google Sign-In flow
async function initiateGoogleSignIn() {
  try {
    // Open a new tab with the Google OAuth URL
    const authUrl = `${API_BASE_URL}/auth/google`;
    
    // Create auth window
    const authWindow = await chrome.windows.create({
      url: authUrl,
      type: 'popup',
      width: 600,
      height: 700
    });
    
    // Monitor for window close or redirect
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        try {
          // Check if window still exists
          const window = await chrome.windows.get(authWindow.id!);
          
          if (!window) {
            clearInterval(checkInterval);
            reject(new Error('Authentication window was closed'));
          }
          
          // Check for auth result via API
          const authCheckResponse = await fetch(`${API_BASE_URL}/api/user`, {
            credentials: 'include'
          });
          
          if (authCheckResponse.ok) {
            // Authentication successful
            const userData = await authCheckResponse.json();
            
            // Update auth state
            authState = {
              isAuthenticated: true,
              user: userData,
              token: authCheckResponse.headers.get('Authorization')?.replace('Bearer ', '') || null
            };
            
            // Close the auth window
            await chrome.windows.remove(authWindow.id!);
            clearInterval(checkInterval);
            
            resolve({ success: true, user: userData });
          }
        } catch (error) {
          console.error('Auth check error:', error);
        }
      }, 1000);
      
      // Set a timeout to prevent endless checking
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Authentication timed out'));
      }, 120000); // 2 minutes timeout
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

// Initialize extension
async function initializeExtension() {
  try {
    // Check if user is already authenticated
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const userData = await response.json();
      
      // Update auth state
      authState = {
        isAuthenticated: true,
        user: userData,
        token: response.headers.get('Authorization')?.replace('Bearer ', '') || null
      };
      
      console.log('User is authenticated:', userData);
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Run initialization
initializeExtension();