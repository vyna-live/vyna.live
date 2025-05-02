// This background script handles authentication and API requests

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Vyna.live extension installed');
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'login') {
    // Handle login request
    fetch('https://vyna.live/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: message.username,
        password: message.password,
      }),
    })
      .then(response => response.json())
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Required to use sendResponse asynchronously
  }
  
  if (message.type === 'logout') {
    // Handle logout request
    chrome.storage.local.remove(['user', 'token'], () => {
      sendResponse({ success: true });
    });
    
    return true;
  }
  
  if (message.type === 'checkAuth') {
    // Check if user is authenticated
    chrome.storage.local.get(['user', 'token'], (result) => {
      if (result.user && result.token) {
        sendResponse({ isAuthenticated: true, user: result.user });
      } else {
        sendResponse({ isAuthenticated: false });
      }
    });
    
    return true;
  }
});
