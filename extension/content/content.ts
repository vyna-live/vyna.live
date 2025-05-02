// Content script for Vyna.live browser extension

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle content extraction request
  if (request.action === 'extractContent') {
    const content = extractPageContent();
    sendResponse({ content });
    return true;
  }
  
  // Handle other actions here
});

// Extract content from current page
function extractPageContent(): string {
  try {
    // Get the main content (prioritize article or main content)
    const mainContent = document.querySelector('article, [role="main"], main') || document.body;
    
    // Extract visible text, ignoring scripts, styles, etc.
    let visibleText = '';
    
    // Function to extract text from an element
    function extractTextFromElement(element: Element): void {
      // Skip hidden elements
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return;
      }
      
      // Skip script, style, and other non-content elements
      const tagName = element.tagName.toLowerCase();
      if (['script', 'style', 'noscript', 'iframe', 'svg', 'path', 'symbol', 'meta', 'link'].includes(tagName)) {
        return;
      }
      
      // Process headers with special formatting
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        const headerLevel = parseInt(tagName.substring(1), 10);
        const prefix = '#'.repeat(headerLevel) + ' ';
        const headerText = element.textContent?.trim();
        if (headerText) {
          visibleText += prefix + headerText + '\n\n';
        }
        return;
      }
      
      // Process paragraphs
      if (tagName === 'p') {
        const paragraphText = element.textContent?.trim();
        if (paragraphText) {
          visibleText += paragraphText + '\n\n';
        }
        return;
      }
      
      // Process list items
      if (tagName === 'li') {
        const listItemText = element.textContent?.trim();
        if (listItemText) {
          visibleText += '• ' + listItemText + '\n';
        }
        return;
      }
      
      // Process other elements with text content
      if (element.childNodes.length === 0) {
        const text = element.textContent?.trim();
        if (text) {
          visibleText += text + ' ';
        }
        return;
      }
      
      // Recursively process child elements
      element.childNodes.forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          extractTextFromElement(child as Element);
        } else if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent?.trim();
          if (text) {
            visibleText += text + ' ';
          }
        }
      });
      
      // Add line break after block elements
      if (['div', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'blockquote'].includes(tagName)) {
        visibleText += '\n';
      }
    }
    
    // Start extraction
    extractTextFromElement(mainContent);
    
    // Clean up the text (remove excessive whitespace)
    const cleanedText = visibleText
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .replace(/\n\s+/g, '\n') // Remove spaces at the beginning of lines
      .replace(/\n{3,}/g, '\n\n') // Replace 3+ consecutive line breaks with just 2
      .trim(); // Remove leading/trailing whitespace
    
    // Limit the content length (max 2000 characters)
    const maxLength = 2000;
    const truncatedText = cleanedText.length > maxLength
      ? cleanedText.substring(0, maxLength) + '\n\n[Content truncated due to length...]'
      : cleanedText;
    
    return truncatedText;
  } catch (error) {
    console.error('Error extracting page content:', error);
    return 'Could not extract content from this page.';
  }
}

// Function to check if element is visible
function isElementVisible(element: Element): boolean {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return !(
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    element.getAttribute('aria-hidden') === 'true'
  );
}
