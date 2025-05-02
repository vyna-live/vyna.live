// Background script for the Vyna AI Assistant extension

import { PageContent } from '../libs/utils/api';
import { initStorage, getUserAuth } from '../libs/utils/storage';

// State for storing the current extracted content
let currentPageContent: PageContent | null = null;

// Initialize the extension
async function initExtension() {
  try {
    // Initialize storage with default settings if needed
    await initStorage();
    
    // Check authentication status
    const auth = await getUserAuth();
    
    // Set badge text based on auth status
    chrome.action.setBadgeText({
      text: auth ? 'ON' : ''
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: '#5D1C34'
    });
    
    console.log('Vyna extension initialized successfully');
  } catch (error) {
    console.error('Error initializing Vyna extension:', error);
  }
}

// Handle getting content from the active tab
async function getActiveTabContent(): Promise<PageContent | null> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tabs.length === 0) {
      console.warn('No active tab found');
      return null;
    }
    
    const activeTab = tabs[0];
    
    if (!activeTab.id) {
      console.warn('Active tab has no ID');
      return null;
    }
    
    // Inject and execute content script if needed
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content/content.js']
      });
    } catch (error) {
      console.warn('Could not execute content script (might already be injected):', error);
    }
    
    // Send message to content script to extract content
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(
        activeTab.id!,
        { action: 'extractContent' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error extracting content:', chrome.runtime.lastError);
            resolve(null);
          } else {
            resolve(response as PageContent);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error getting active tab content:', error);
    return null;
  }
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'getPageContent') {
    // Get content from the current active tab
    getActiveTabContent().then((content) => {
      if (content) {
        currentPageContent = content;
      }
      sendResponse({ success: true, content: currentPageContent });
    });
    return true; // Required for async response
  }
  
  if (message.action === 'contentScriptLoaded') {
    // Content script is loaded, we can now extract content
    console.log('Content script loaded on:', message.url);
    sendResponse({ success: true });
    return false;
  }
  
  if (message.action === 'openPopup') {
    // Try to open the popup programmatically
    chrome.action.openPopup();
    sendResponse({ success: true });
    return false;
  }
  
  // Return false for unhandled messages
  return false;
});

// Run initialization when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  initExtension();
  console.log('Vyna extension installed/updated');
});

// Run initialization when the extension is started
initExtension();
