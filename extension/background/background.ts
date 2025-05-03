/**
 * Background script for Vyna AI Assistant
 * 
 * This script runs in the background and is responsible for:
 * 1. Handling messages from content scripts
 * 2. Managing authentication state
 * 3. Coordinating with the API
 * 4. Storing and retrieving data
 */

import { savePageContext, getPageContext } from '@libs/utils/storage';
import { sendPageContext } from '@libs/utils/api';

interface PageData {
  url: string;
  title: string;
  content: string;
}

// Global state to track the active tab
let activeTabId: number | null = null;
let currentPageContent: PageData | null = null;

/**
 * Initialize the extension when installed or updated
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First-time installation
    console.log('Vyna AI Assistant installed');
    
    // Open the welcome page
    chrome.tabs.create({
      url: 'https://vyna.live/welcome-extension'
    });
  } else if (details.reason === 'update') {
    console.log(`Vyna AI Assistant updated to version ${chrome.runtime.getManifest().version}`);
  }
});

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages based on action
  if (message.action === 'setPageContext') {
    handlePageContext(message.data, sender.tab?.id);
    sendResponse({ success: true });
  } else if (message.action === 'getPageContext') {
    getPageContext().then(context => {
      sendResponse({ success: true, data: context });
    });
    return true; // Keep the message channel open for async response
  } else if (message.action === 'refreshPageContext') {
    refreshPageContext().then(response => {
      sendResponse(response);
    });
    return true; // Keep the message channel open for async response
  }
});

/**
 * Track active tab changes
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  activeTabId = activeInfo.tabId;
  await requestContentFromActiveTab();
});

/**
 * Track tab URL changes
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.status === 'complete') {
    await requestContentFromActiveTab();
  }
});

/**
 * Handle page context data from content script
 */
async function handlePageContext(pageData: PageData, tabId?: number) {
  if (tabId && tabId === activeTabId) {
    currentPageContent = pageData;
    await savePageContext(pageData);
    
    // Optionally send to API if user is authenticated
    try {
      await sendPageContext(pageData);
    } catch (error) {
      console.log('Failed to send page context to API, user may not be authenticated');
    }
  }
}

/**
 * Request fresh content from the active tab
 */
async function requestContentFromActiveTab(): Promise<PageData | null> {
  if (!activeTabId) return null;
  
  try {
    // Check if the tab is still available
    const tab = await chrome.tabs.get(activeTabId);
    
    // Skip if it's a chrome:// or edge:// or about: URL (extensions can't access these)
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
      return null;
    }
    
    // Send a message to the content script to get the page content
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(activeTabId!, { action: 'getPageContent' }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not available or not loaded yet
          console.log('Content script not available:', chrome.runtime.lastError.message);
          resolve(null);
          return;
        }
        
        if (response) {
          handlePageContext(response, activeTabId);
          resolve(response);
        } else {
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Error requesting content from tab:', error);
    return null;
  }
}

/**
 * Refresh the page context data (used by popup)
 */
async function refreshPageContext(): Promise<{ success: boolean; data?: PageData }> {
  const data = await requestContentFromActiveTab();
  if (data) {
    return { success: true, data };
  } else {
    return { success: false };
  }
}
