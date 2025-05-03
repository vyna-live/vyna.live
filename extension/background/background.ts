/**
 * Background script for the Vyna AI Assistant browser extension
 * Manages user authentication, page context, and communication between components
 */

import { savePageContext } from '@libs/utils/storage';

// Handle installation
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    // Open onboarding page on first install
    chrome.tabs.create({
      url: 'https://vyna.live/welcome-extension'
    });
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle different message types
  switch (message.action) {
    case 'pageContentExtracted':
      handlePageContentExtracted(message.data);
      break;
    
    case 'requestPageContext':
      requestPageContext(sender.tab?.id).then(sendResponse);
      return true; // Required for async response
    
    case 'checkAuth':
      // The popup is checking auth status - no action needed here
      // Auth is handled via storage APIs
      break;
    
    case 'setAuthData':
      // Auth data is already stored via storage APIs by popup
      // Just update badge if needed
      updateExtensionBadge(true);
      break;
    
    case 'clearAuthData':
      // Auth data is already cleared via storage APIs by popup
      // Just update badge if needed
      updateExtensionBadge(false);
      break;
  }
});

/**
 * Handle extracted page content from content script
 */
function handlePageContentExtracted(data: { url: string; title: string; content: string }) {
  // Store the content for use by the popup
  savePageContext(data);
}

/**
 * Request page content from the active tab
 */
async function requestPageContext(tabId?: number): Promise<{ url: string; title: string; content: string } | null> {
  if (!tabId) {
    // Get active tab if no tabId provided
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) return null;
    tabId = tabs[0].id;
  }
  
  if (!tabId) return null;
  
  try {
    // Send message to content script to get page content
    const response = await chrome.tabs.sendMessage(tabId, { action: 'getPageContent' });
    return response || null;
  } catch (error) {
    console.error('Error requesting page context:', error);
    return null;
  }
}

/**
 * Update extension badge based on auth status
 */
function updateExtensionBadge(isAuthenticated: boolean) {
  if (isAuthenticated) {
    chrome.action.setBadgeText({ text: '' }); // Remove badge
    chrome.action.setIcon({ 
      path: {
        16: '/icons/icon16.png',
        48: '/icons/icon48.png',
        128: '/icons/icon128.png'
      }
    });
  } else {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#5D1C34' });
  }
}