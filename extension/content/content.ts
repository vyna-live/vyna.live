// Content script for Vyna browser extension
// This script extracts content from the current web page to provide context for the AI assistant

// Define the structure of page content
export interface PageContent {
  url: string;
  title: string;
  description: string;
  selection: string;
  mainText: string;
  metaData: {
    [key: string]: string;
  };
}

// Extract the meta description from the page
function getMetaDescription(): string {
  const metaDesc = document.querySelector('meta[name="description"]');
  return metaDesc ? (metaDesc as HTMLMetaElement).content : '';
}

// Extract meta data from the page
function getMetaData(): { [key: string]: string } {
  const metaData: { [key: string]: string } = {};
  const metaTags = document.querySelectorAll('meta');
  
  metaTags.forEach((tag) => {
    const name = tag.getAttribute('name') || tag.getAttribute('property');
    const content = tag.getAttribute('content');
    
    if (name && content) {
      metaData[name] = content;
    }
  });
  
  return metaData;
}

// Extract the main content text from the page
function getMainText(): string {
  // Try to identify the main content area (this is heuristic and may need improvement)
  const contentSelectors = [
    'article',
    '[role="main"]',
    'main',
    '.content',
    '#content',
    '.post-content',
    '.article-content',
    '.main-content'
  ];
  
  let mainContent = '';
  
  // Try each selector until we find content
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent && element.textContent.trim().length > 150) {
      mainContent = element.textContent.trim();
      break;
    }
  }
  
  // If we couldn't find main content with selectors, use body text
  if (!mainContent && document.body.textContent) {
    // Get all paragraphs and headings
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    const textArray: string[] = [];
    
    textElements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text.length > 20) { // Only include substantive pieces of text
        textArray.push(text);
      }
    });
    
    mainContent = textArray.join('\n\n');
  }
  
  // If still no content, use the entire body text
  if (!mainContent && document.body.textContent) {
    mainContent = document.body.textContent.trim();
  }
  
  // Limit text length to prevent very large messages
  const maxLength = 5000;
  if (mainContent.length > maxLength) {
    mainContent = mainContent.substring(0, maxLength) + '... (content truncated)';
  }
  
  return mainContent;
}

// Get the user's text selection
function getUserSelection(): string {
  const selection = window.getSelection();
  return selection ? selection.toString().trim() : '';
}

// Extract all content
function extractPageContent(): PageContent {
  return {
    url: window.location.href,
    title: document.title,
    description: getMetaDescription(),
    selection: getUserSelection(),
    mainText: getMainText(),
    metaData: getMetaData()
  };
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageContent') {
    sendResponse({
      success: true,
      content: extractPageContent()
    });
  }
  return true; // Required for async sendResponse
});

// Also listen for selection changes to update available context
document.addEventListener('selectionchange', () => {
  const selection = getUserSelection();
  if (selection) {
    // Store selection in runtime so it's accessible when needed
    chrome.runtime.sendMessage({
      action: 'updateSelection',
      selection: selection
    });
  }
});

// Send a message when the content script is first loaded
chrome.runtime.sendMessage({
  action: 'contentScriptLoaded',
  url: window.location.href
});
