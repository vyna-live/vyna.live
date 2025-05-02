// Background script for Vyna.live Extension

// Add missing type definitions for Chrome Extension API
declare namespace chrome {
  namespace cookies {
    interface Cookie {
      name: string;
      value: string;
      domain: string;
      hostOnly: boolean;
      path: string;
      secure: boolean;
      httpOnly: boolean;
      sameSite: string;
      session: boolean;
      expirationDate?: number;
      storeId: string;
    }

    function getAll(details: { url: string; name: string }): Promise<Cookie[]>;
  }

  namespace runtime {
    interface LastError {
      message?: string;
    }
    const lastError: LastError | undefined;
  }
}

// Constants
const API_BASE_URL = 'https://vyna.live/api';
const LOCAL_API_BASE_URL = 'http://localhost:5000/api';

// State
let authToken: string | null = null;
let isAuthenticated = false;
let currentUser: any = null;

// Initialize extension
function init() {
  chrome.storage.local.get(['authToken', 'user'], (result) => {
    if (result.authToken) {
      authToken = result.authToken;
      currentUser = result.user || null;
      isAuthenticated = true;
      
      // Verify token is still valid
      verifyToken();
    }
  });
  
  // Listen for installation or update
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      // First installation
      chrome.tabs.create({ url: chrome.runtime.getURL('popup/welcome.html') });
    }
  });
}

// Verify if the token is still valid
async function verifyToken() {
  try {
    // Use development server when working locally
    const baseUrl = chrome.runtime.getURL('').startsWith('chrome-extension://') ? 
      API_BASE_URL : LOCAL_API_BASE_URL;
    
    const response = await fetch(`${baseUrl}/extension/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `connect.sid=${authToken}`
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      isAuthenticated = true;
      
      // Store updated user data
      chrome.storage.local.set({ user: data.user });
      
      // Send auth status to any open popup or tabs
      broadcastAuthStatus(true, data.user);
      
      return true;
    } else {
      // Token is invalid, clear it
      logout();
      return false;
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
}

// Handle login
async function login(credentials: { username: string, password: string }) {
  try {
    // Use development server when working locally
    const baseUrl = chrome.runtime.getURL('').startsWith('chrome-extension://') ? 
      API_BASE_URL : LOCAL_API_BASE_URL;
    
    const response = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(credentials)
    });
    
    if (response.ok) {
      const user = await response.json();
      
      // Get cookie from the response
      const cookieString = response.headers.get('set-cookie');
      let sessionCookie = null;
      
      if (cookieString) {
        const cookies = cookieString.split(';');
        const sessionCookiePair = cookies.find(cookie => cookie.trim().startsWith('connect.sid='));
        if (sessionCookiePair) {
          sessionCookie = sessionCookiePair.split('=')[1];
        }
      }
      
      // If we couldn't extract it from headers, try to use the browser cookies API
      if (!sessionCookie) {
        const cookies = await chrome.cookies.getAll({
          url: baseUrl,
          name: 'connect.sid'
        });
        
        if (cookies.length > 0) {
          sessionCookie = cookies[0].value;
        }
      }
      
      if (sessionCookie) {
        // Store authentication information
        authToken = sessionCookie;
        currentUser = user;
        isAuthenticated = true;
        
        chrome.storage.local.set({ 
          authToken: sessionCookie,
          user: user
        });
        
        broadcastAuthStatus(true, user);
        return { success: true, user };
      } else {
        return { success: false, error: 'Could not retrieve session cookie' };
      }
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Connection error' };
  }
}

// Handle logout
function logout() {
  authToken = null;
  currentUser = null;
  isAuthenticated = false;
  
  // Clear stored authentication information
  chrome.storage.local.remove(['authToken', 'user']);
  
  // Notify components about logout
  broadcastAuthStatus(false, null);
}

// Broadcast authentication status to all components
function broadcastAuthStatus(status: boolean, user: any) {
  try {
    chrome.runtime.sendMessage({
      type: 'authStatusChanged',
      isAuthenticated: status,
      user: user
    });
  } catch (error) {
    // Ignore errors when no listeners are available
    console.debug('No listeners for auth status update', error);
  }
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Authentication related messages
  if (message.type === 'login') {
    login(message.credentials).then(sendResponse);
    return true; // Will respond asynchronously
  }
  
  if (message.type === 'logout') {
    logout();
    sendResponse({ success: true });
    return false;
  }
  
  if (message.type === 'getAuthStatus') {
    sendResponse({
      isAuthenticated,
      user: currentUser
    });
    return false;
  }
  
  if (message.type === 'verifyToken') {
    verifyToken().then((isValid) => {
      sendResponse({
        isAuthenticated: isValid,
        user: isValid ? currentUser : null
      });
    });
    return true; // Will respond asynchronously
  }
  
  // Content extraction related messages
  if (message.type === 'extractCurrentPageContent') {
    // Send message to content script of the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id!, { type: 'extractPageContent' }, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: 'Content script not available' });
          } else {
            sendResponse(response);
          }
        });
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true; // Will respond asynchronously
  }
  
  // Highlight text in the current page
  if (message.type === 'highlightText') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(
          tabs[0].id!,
          { type: 'highlightText', text: message.text },
          (response) => {
            sendResponse(response);
          }
        );
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true; // Will respond asynchronously
  }
  
  // Send API request on behalf of the extension
  if (message.type === 'apiRequest') {
    const { method, endpoint, data } = message;
    
    // Use development server when working locally
    const baseUrl = chrome.runtime.getURL('').startsWith('chrome-extension://') ? 
      API_BASE_URL : LOCAL_API_BASE_URL;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Cookie'] = `connect.sid=${authToken}`;
    }
    
    const requestOptions: RequestInit = {
      method: method || 'GET',
      headers,
      credentials: 'include'
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(data);
    }
    
    fetch(`${baseUrl}${endpoint}`, requestOptions)
      .then(async (response) => {
        let responseData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
        
        sendResponse({
          success: response.ok,
          status: response.status,
          data: responseData
        });
      })
      .catch((error) => {
        sendResponse({
          success: false,
          error: error.message
        });
      });
    
    return true; // Will respond asynchronously
  }
  
  return false; // For other messages, don't wait for a response
});

// Initialize on load
init();
