// Content script for the Vyna.live browser extension
// This script runs in the context of web pages

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_PAGE_CONTENT') {
    // Extract page content when requested
    const content = extractPageContent();
    sendResponse({ success: true, content });
    return true;
  }
});

// Function to extract content from the current page
function extractPageContent() {
  // Get page metadata
  const title = document.title;
  const url = window.location.href;
  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  
  // Extract main content
  // This is a basic implementation - could be enhanced for specific sites
  const textContent = document.body.innerText.substring(0, 5000); // Limit to 5000 chars
  
  return {
    title,
    url,
    metaDescription,
    textContent,
    timestamp: new Date().toISOString()
  };
}

// Initialize content script
console.log('Vyna.live extension content script initialized');