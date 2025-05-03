/**
 * Content script for Vyna AI Assistant
 * 
 * This script runs in the context of the current webpage and is responsible for:
 * 1. Extracting the content of the page
 * 2. Sending it to the background script
 * 3. Injecting any UI components needed to interact with the page
 */

interface PageData {
  url: string;
  title: string;
  content: string;
}

const MAX_CONTENT_LENGTH = 15000; // Limit content to about 15KB

/**
 * Extract meaningful content from the current page
 */
function extractPageContent(): PageData {
  // Get the URL and title
  const url = document.location.href;
  const title = document.title;
  
  // Prioritize content based on common selectors for main content
  const contentSelectors = [
    'article',
    'main',
    '.content',
    '#content', 
    '.main-content',
    '.article-content',
    '.post-content'
  ];
  
  let content = '';
  
  // Try to find main content using selectors
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      content = element.textContent || '';
      if (content.length > 500) { // Only use it if it's substantial
        break;
      }
    }
  }
  
  // If no specific content found, use the body
  if (!content || content.length < 500) {
    // Get all text from the body, excluding scripts, styles, etc.
    const bodyContent = document.body.textContent || '';
    content = bodyContent;
  }
  
  // Clean up the content
  content = content
    .replace(/\s+/g, ' ')
    .trim();
  
  // Truncate if too long
  if (content.length > MAX_CONTENT_LENGTH) {
    content = content.substring(0, MAX_CONTENT_LENGTH) + '... [content truncated]';
  }
  
  return { url, title, content };
}

/**
 * Send page data to the background script
 */
function sendPageDataToBackground(pageData: PageData) {
  chrome.runtime.sendMessage({
    action: 'setPageContext',
    data: pageData
  });
}

/**
 * Initialize the content script
 */
function init() {
  // Extract and send page content immediately
  const pageData = extractPageContent();
  sendPageDataToBackground(pageData);
  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getPageContent') {
      sendResponse(extractPageContent());
      return true; // Keep the message channel open for async response
    }
  });
}

// Run the initialization
init();
