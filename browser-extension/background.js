// Background script for Vyna Helper extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Vyna Helper Extension installed');
  
  // Initialize storage with default values
  chrome.storage.local.get(['notes', 'chatHistory'], (result) => {
    if (!result.notes) {
      chrome.storage.local.set({ 'notes': 'Welcome to Vyna Helper!' });
    }
    
    if (!result.chatHistory) {
      chrome.storage.local.set({ 
        'chatHistory': [
          { 
            content: 'Welcome to Vyna AI Chat! How can I help you with your livestreams today?', 
            sender: 'ai' 
          }
        ] 
      });
    }
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchAI') {
    // Handle AI request if needed
    sendResponse({ success: true });
  }
  
  return true; // Required for async response
});