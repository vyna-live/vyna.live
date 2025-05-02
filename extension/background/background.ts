// Background script for Vyna browser extension

// Import PageContent type from content script
import { PageContent } from '../content/content';

// Store page content temporarily
let currentPageContent: PageContent | null = null;

// Store user's selection
let currentSelection: string = '';

// Initialize badge
chrome.action.setBadgeBackgroundColor({ color: '#5D1C34' }); // Vyna maroon color

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle content script loading
  if (message.action === 'contentScriptLoaded') {
    // Content script loaded on a page, can track this if needed
    chrome.action.setBadgeText({ text: '✓' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2000);
    
    // Clear the current page content as we're on a new page
    currentPageContent = null;
  }
  
  // Handle selection updates from content script
  else if (message.action === 'updateSelection') {
    currentSelection = message.selection;
  }
  
  // Handle page content requests from popup
  else if (message.action === 'getPageContent') {
    // If we already have page content cached, return it immediately
    if (currentPageContent) {
      // Update with latest selection
      currentPageContent.selection = currentSelection;
      sendResponse({
        success: true,
        content: currentPageContent
      });
      return true;
    }
    
    // Otherwise, get it from the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || !tabs[0].id) {
        sendResponse({
          success: false,
          error: 'No active tab found'
        });
        return;
      }
      
      // Send message to content script to get page content
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageContent' }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script might not be loaded
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message || 'Could not communicate with page'
          });
          return;
        }
        
        if (response && response.success) {
          // Cache the page content
          currentPageContent = response.content;
          // Make sure we have the most recent selection
          if (currentSelection) {
            currentPageContent.selection = currentSelection;
          }
          
          sendResponse({
            success: true,
            content: currentPageContent
          });
        } else {
          sendResponse({
            success: false,
            error: 'Failed to extract page content'
          });
        }
      });
    });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
});

// Listen for tab updates to reset page content
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Reset page content when a tab completes loading
    currentPageContent = null;
    currentSelection = '';
  }
});

// Listen for installation or update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First time installation
    chrome.tabs.create({
      url: 'https://vyna.live/welcome-extension'
    });
  } else if (details.reason === 'update') {
    // Extension updated - could show release notes
    console.log('Vyna extension updated to version', chrome.runtime.getManifest().version);
  }
});
