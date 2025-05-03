/**
 * Background script for Vyna AI Assistant extension
 * Handles communication between popup and content scripts, manages storage, etc.
 */

import { getSettings, savePageContext } from '@libs/utils/storage';

// Store the current page context
let currentPageContext: {
  url: string;
  title: string;
  content: string;
} | null = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'pageContentExtracted') {
    // Save the extracted content
    currentPageContext = message.data;
    savePageContext(message.data)
      .then(() => console.log('Page context saved'))
      .catch(err => console.error('Error saving page context:', err));
    
    // Forward the data to any open popups
    chrome.runtime.sendMessage({
      action: 'pageContextUpdated',
      data: message.data
    }).catch(() => {
      // Ignore errors when popup is not open
    });
    
    return true;
  }
  
  if (message.action === 'getPageContext') {
    // Return the current page context
    sendResponse({
      data: currentPageContext
    });
    return true;
  }
  
  return false;
});

// Handle initial installation or update
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    // Set default settings
    getSettings().then(settings => {
      console.log('Default settings initialized:', settings);
    });
    
    // Open onboarding page
    chrome.tabs.create({
      url: 'https://vyna.live/extension-welcome'
    });
  }
});

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  // Context menu for selected text
  chrome.contextMenus.create({
    id: 'vynaAIChat',
    title: 'Ask Vyna AI about this',
    contexts: ['selection']
  });
  
  // Context menu for creating notes
  chrome.contextMenus.create({
    id: 'vynaCreateNote',
    title: 'Save to Vyna notes',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText || '';
  
  if (info.menuItemId === 'vynaAIChat' && selectedText) {
    // Open popup with the selected text
    chrome.storage.local.set({ 'pendingQuery': selectedText }, () => {
      chrome.action.openPopup();
    });
  }
  
  if (info.menuItemId === 'vynaCreateNote' && selectedText) {
    // Save selected text as a note
    chrome.storage.local.set({ 'pendingNote': {
      title: tab?.title || 'Note from webpage',
      content: `${selectedText}\n\nSource: ${tab?.url || 'Unknown source'}`
    }}, () => {
      // Show a notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Note saved',
        message: 'Text has been saved to your Vyna notes'
      });
    });
  }
});
