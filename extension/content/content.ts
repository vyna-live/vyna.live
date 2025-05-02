// Content script for the Vyna AI Assistant extension
// This script runs on web pages to extract content for AI analysis

import { PageContent } from '../libs/utils/api';

// Function to extract text content from the page
function extractPageContent(): PageContent {
  const selection = window.getSelection()?.toString() || '';
  const metaTags = document.getElementsByTagName('meta');
  let metaDescription = '';
  
  // Extract meta description if available
  for (let i = 0; i < metaTags.length; i++) {
    if (metaTags[i].getAttribute('name') === 'description') {
      metaDescription = metaTags[i].getAttribute('content') || '';
      break;
    }
  }
  
  // Extract main page text, prioritizing article content
  let pageText = '';
  
  // Try to get content from article elements first
  const articleElements = document.querySelectorAll('article, [role="article"], .article, .post, .content, main');
  
  if (articleElements.length > 0) {
    // Combine text from all article elements
    for (let i = 0; i < articleElements.length; i++) {
      pageText += articleElements[i].textContent || '';
    }
  } else {
    // Fallback to body content
    pageText = document.body.innerText || '';
  }
  
  // Clean up the page text (remove excessive whitespace)
  pageText = pageText.replace(/\s+/g, ' ').trim();
  
  // Limit the page text to a reasonable size (e.g., first 10000 characters)
  if (pageText.length > 10000) {
    pageText = pageText.substring(0, 10000) + '... (content truncated)';
  }
  
  return {
    title: document.title,
    url: window.location.href,
    selection,
    metaDescription,
    pageText
  };
}

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractContent') {
    const content = extractPageContent();
    sendResponse(content);
    return true; // Required for async response
  }
});

// Inject a button on the page for quick access (optional)
function injectVynaButton() {
  const buttonId = 'vyna-ai-button';
  
  // Don't add the button if it already exists
  if (document.getElementById(buttonId)) {
    return;
  }
  
  const button = document.createElement('div');
  button.id = buttonId;
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#5D1C34"/>
      <path d="M15 9L9 15M9 9L15 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #5D1C34;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s;
  `;
  
  button.addEventListener('mouseover', () => {
    button.style.transform = 'scale(1.1)';
  });
  
  button.addEventListener('mouseout', () => {
    button.style.transform = 'scale(1)';
  });
  
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
  
  document.body.appendChild(button);
}

// Initialize the content script
function init() {
  // Decide whether to inject the button based on user settings
  // For now, let's temporarily disable it
  // injectVynaButton();
  
  // Let the background script know that the content script is loaded
  chrome.runtime.sendMessage({ action: 'contentScriptLoaded', url: window.location.href });
}

// Run initialization when the page is fully loaded
if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}
