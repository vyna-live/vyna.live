type ApiRequestOptions = {
  method: string;
  endpoint: string;
  data?: any;
  token?: string;
};

const API_BASE_URL = 'https://vyna.live/api';

// Global state for background process
let token: string | null = null;

// Get the session token from storage
const getToken = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['token'], (result) => {
      resolve(result.token || null);
    });
  });
};

// Set token in local state and storage
const setToken = async (newToken: string): Promise<void> => {
  token = newToken;
  await chrome.storage.local.set({ token: newToken });
};

// Clear token from local state and storage
const clearToken = async (): Promise<void> => {
  token = null;
  await chrome.storage.local.remove(['token']);
};

// Handle API requests from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle API requests
  if (request.type === 'apiRequest') {
    handleApiRequest(request, sendResponse);
    return true; // Keep the message channel open for async response
  }

  // Extract content from active page
  if (request.type === 'extractCurrentPageContent') {
    extractPageContent(sendResponse);
    return true; // Keep the message channel open for async response
  }

  // Handle message to content script
  if (request.type === 'messageToContent') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id!, { ...request.data });
      }
    });
    return false;
  }
});

// Function to handle API requests
async function handleApiRequest(request: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    // Get current token if available
    if (!token) {
      token = await getToken();
    }

    // Build request URL
    const url = `${API_BASE_URL}${request.endpoint}`;

    // Build request options
    const fetchOptions: RequestInit = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add auth token if available
    if (token) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.data) {
      fetchOptions.body = JSON.stringify(request.data);
    }

    // Make the request
    const response = await fetch(url, fetchOptions);

    // Handle non-OK responses
    if (!response.ok) {
      if (response.status === 401) {
        // Clear token on authentication error
        await clearToken();
        sendResponse({
          success: false,
          error: 'Authentication error. Please log in again.',
        });
        return;
      }

      // Try to parse error message from response
      try {
        const errorData = await response.json();
        sendResponse({
          success: false,
          error: errorData.error || `Request failed with status ${response.status}`,
        });
      } catch {
        sendResponse({
          success: false,
          error: `Request failed with status ${response.status}`,
        });
      }
      return;
    }

    // Special handling for login/register endpoints
    if (['/login', '/register'].includes(request.endpoint)) {
      const data = await response.json();
      if (data.token) {
        await setToken(data.token);
      }
      sendResponse({ success: true, data });
      return;
    }

    // Handle successful response
    try {
      const data = await response.json();
      sendResponse({ success: true, data });
    } catch (e) {
      // If response cannot be parsed as JSON, send empty data
      sendResponse({ success: true, data: null });
    }
  } catch (error) {
    console.error('API request error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}

// Function to extract content from active page
async function extractPageContent(sendResponse: (response: any) => void): Promise<void> {
  try {
    // Promise-based wrapper for chrome.tabs.query
    const getTabs = (): Promise<chrome.tabs.Tab[]> => {
      return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          resolve(tabs);
        });
      });
    };

    const tabs = await getTabs();
    
    if (tabs.length > 0 && tabs[0].id) {
      // Get page title and URL
      const title = tabs[0].title || 'Unknown Page';
      const url = tabs[0].url || '';
      
      // Wrap sendMessage in a promise with error handling
      const sendMessageToTab = (tabId: number, message: any): Promise<any> => {
        return new Promise((resolve) => {
          chrome.tabs.sendMessage(
            tabId,
            message,
            (response) => {
              // Check for chrome.runtime.lastError
              const lastError = chrome.runtime.lastError;
              if (lastError) {
                resolve(null); // Return null on error
              } else {
                resolve(response);
              }
            }
          );
        });
      };
      
      // Try to get content from content script
      let contentResponse = await sendMessageToTab(tabs[0].id, { action: 'extractContent' });
      
      // If no response, try injecting the content script
      if (!contentResponse) {
        // Wrap executeScript in a promise
        const injectContentScript = (tabId: number): Promise<void> => {
          return new Promise((resolve) => {
            try {
              // Using chrome.scripting is only available in MV3
              // In older browser versions, we might need to fall back to other methods
              if (chrome.scripting) {
                chrome.scripting.executeScript(
                  {
                    target: { tabId },
                    files: ['content.js'],
                  },
                  () => resolve()
                );
              } else {
                // Fallback for older extensions
                chrome.tabs.executeScript(tabId, { file: 'content.js' }, () => resolve());
              }
            } catch (e) {
              // If scripting fails, resolve anyway so we can try other methods
              console.error('Failed to inject content script:', e);
              resolve();
            }
          });
        };
        
        // Inject the content script
        await injectContentScript(tabs[0].id);
        
        // Wait a bit for the script to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try again
        contentResponse = await sendMessageToTab(tabs[0].id, { action: 'extractContent' });
      }
      
      // Handle the final response
      if (!contentResponse) {
        sendResponse({
          success: true,
          title,
          url,
          content: `Could not extract content from this page. (URL: ${url})`,
        });
      } else {
        sendResponse({
          success: true,
          title,
          url,
          content: contentResponse.content,
        });
      }
    } else {
      sendResponse({
        success: false,
        error: 'No active tab found',
      });
    }
  } catch (error) {
    console.error('Content extraction error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}

// Initialize extension when installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Vyna Extension installed');
  
  // Set default settings
  chrome.storage.local.set({
    firstInstall: true,
    settings: {
      extractPageContent: true,
      commentaryStyle: 'color',
      theme: 'light',
    },
  });
});
