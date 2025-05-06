// Content script for Vyna.live extension
// This script will run on all web pages

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PAGE_TITLE') {
    sendResponse({ title: document.title });
  }
  
  if (request.type === 'GET_SELECTED_TEXT') {
    const selectedText = window.getSelection().toString();
    sendResponse({ text: selectedText });
  }
  
  return true;
});
