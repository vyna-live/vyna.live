/**
 * Content script that runs in the context of web pages
 * Responsible for extracting page content and sending it to the background script
 */

// Function to extract main content from the page
function extractPageContent(): string {
  let content = '';

  // Try main content areas first
  const mainSelectors = [
    'article',
    'main',
    '[role="main"]',
    '#content',
    '.content',
    '.article',
    '.post',
    '.entry'
  ];

  // Find potential main content elements
  for (const selector of mainSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      elements.forEach(el => {
        if (!isNavigationElement(el)) {
          content += extractTextFromElement(el);
        }
      });

      // If we found substantial content, use it
      if (content.length > 200) {
        return cleanContent(content);
      }
    }
  }

  // Fallback: extract from paragraphs and headings
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
  textElements.forEach(el => {
    if (!isPartOfNavigation(el)) {
      const text = el.textContent?.trim();
      if (text && text.length > 20) { // Skip very short elements
        content += text + '\n\n';
      }
    }
  });

  return cleanContent(content);
}

// Check if element is likely part of navigation
function isNavigationElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  if (['nav', 'header', 'footer', 'menu'].includes(tagName)) {
    return true;
  }

  // Check roles
  const role = element.getAttribute('role');
  if (role && ['navigation', 'banner', 'menubar'].includes(role)) {
    return true;
  }

  // Check classes and IDs
  const classAndId = (element.className + ' ' + element.id).toLowerCase();
  const navigationTerms = ['nav', 'menu', 'header', 'footer', 'sidebar'];
  for (const term of navigationTerms) {
    if (classAndId.includes(term)) {
      return true;
    }
  }

  return false;
}

// Check if element is within navigation
function isPartOfNavigation(element: Element): boolean {
  let parent = element.parentElement;
  while (parent) {
    if (isNavigationElement(parent)) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

// Extract text from an element and its children
function extractTextFromElement(element: Element): string {
  // Skip invisible elements
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return '';
  }

  let text = '';
  element.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const content = node.textContent?.trim();
      if (content) {
        text += content + ' ';
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      // Skip navigation elements
      if (!isNavigationElement(el)) {
        text += extractTextFromElement(el) + ' ';
      }
    }
  });

  return text + '\n';
}

// Clean up the extracted content
function cleanContent(content: string): string {
  // Remove extra whitespace
  let cleaned = content.replace(/\s+/g, ' ');
  
  // Remove duplicate line breaks
  cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
  
  // Trim the content
  cleaned = cleaned.trim();
  
  // Limit to a reasonable size
  const maxLength = 5000;
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength) + '...';
  }
  
  return cleaned;
}

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