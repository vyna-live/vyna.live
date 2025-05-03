/**
 * Content script that runs in the context of web pages
 * Responsible for extracting page content and sending it to the background script
 */

import { extractPageContent } from './pageContentExtractor';

// Only run on standard web pages, not on extension pages, browser UI, etc.
if (shouldExtractContent()) {
  // Extract page content when the page loads
  extractAndSendContent();

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getPageContent') {
      extractAndSendContent().then(content => {
        sendResponse(content);
      });
      return true; // Required for async response
    }
  });

  // Listen for DOM changes to update content extraction
  // Using a debounced approach to avoid excessive processing
  let contentChangeTimer: number | null = null;
  const observer = new MutationObserver(() => {
    if (contentChangeTimer) {
      clearTimeout(contentChangeTimer);
    }
    
    contentChangeTimer = window.setTimeout(() => {
      extractAndSendContent();
    }, 1000); // Debounce for 1 second
  });

  // Start observing the document with the configured parameters
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

/**
 * Determine if we should extract content from current page
 */
function shouldExtractContent(): boolean {
  const url = window.location.href;
  
  // Skip extension pages, browser pages, etc.
  if (url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('about:') ||
      url.startsWith('moz-extension://') ||
      url.startsWith('edge://') ||
      url.startsWith('brave://') ||
      url.startsWith('vivaldi://') ||
      url.startsWith('file://')) {
    return false;
  }
  
  return true;
}

/**
 * Extract page content and send to background script
 */
async function extractAndSendContent() {
  try {
    const content = extractPageContent();
    
    // Send the content to the background script
    chrome.runtime.sendMessage({
      action: 'pageContentExtracted',
      data: {
        url: window.location.href,
        title: document.title,
        content: content
      }
    });
    
    return content;
  } catch (error) {
    console.error('Error extracting page content:', error);
    return '';
  }
}