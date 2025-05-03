/**
 * Extracts relevant content from the webpage
 * Focusing on main content areas while filtering out navigation, ads, etc.
 */

/**
 * Main function to extract page content
 * Uses various strategies to find the main content
 */
export function extractPageContent(): string {
  // If the page has a reader mode version (e.g., articles), try to get that content
  const readerContent = extractReaderContent();
  if (readerContent) {
    return readerContent;
  }
  
  // Try common content selectors
  const mainContent = extractMainContent();
  if (mainContent) {
    return mainContent;
  }
  
  // Fall back to extracting text from the page
  return extractPageText();
}

/**
 * Attempt to extract content from reader mode elements
 * These are often used for article content
 */
function extractReaderContent(): string {
  const readerSelectors = [
    'article',
    '[role="article"]',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.content-article',
    '.story-body'
  ];
  
  for (const selector of readerSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      let content = '';
      elements.forEach(el => {
        content += el.textContent + '\n\n';
      });
      
      if (content.trim().length > 200) { // Minimum viable content length
        return cleanContent(content);
      }
    }
  }
  
  return '';
}

/**
 * Extract content from common main content selectors
 */
function extractMainContent(): string {
  const mainSelectors = [
    'main',
    '#main',
    '#content',
    '.main-content',
    '#main-content',
    '.post',
    '.page',
    '.entry',
    '.document',
    '[role="main"]'
  ];
  
  for (const selector of mainSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      let content = '';
      elements.forEach(el => {
        // Skip navigation elements within main content
        if (isNavigationElement(el)) {
          return;
        }
        content += el.textContent + '\n\n';
      });
      
      if (content.trim().length > 200) {
        return cleanContent(content);
      }
    }
  }
  
  return '';
}

/**
 * Extract text from the page, filtering out navigation and non-content areas
 */
function extractPageText(): string {
  // Elements to exclude
  const excludeSelectors = [
    'header',
    'footer',
    'nav',
    '[role="navigation"]',
    '.navigation',
    '.nav',
    '.menu',
    '.sidebar',
    '.comments',
    '.advertisement',
    '.ad',
    '.ads',
    '.banner',
    '.widget'
  ];
  
  // Create a temporary document clone to work with
  const docClone = document.cloneNode(true) as Document;
  
  // Remove excluded elements
  excludeSelectors.forEach(selector => {
    const elements = docClone.querySelectorAll(selector);
    elements.forEach(el => {
      el.parentNode?.removeChild(el);
    });
  });
  
  // Get paragraphs and headings (most likely to contain real content)
  const contentElements = docClone.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
  let content = '';
  
  contentElements.forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 20) { // Skip very short elements
      content += text + '\n\n';
    }
  });
  
  return cleanContent(content);
}

/**
 * Check if an element appears to be a navigation element
 */
function isNavigationElement(element: Element): boolean {
  // Check element tag
  if (['nav', 'header', 'footer'].includes(element.tagName.toLowerCase())) {
    return true;
  }
  
  // Check classes and IDs
  const navIndicators = ['nav', 'menu', 'navigation', 'header', 'footer'];
  const elClasses = Array.from(element.classList).join(' ').toLowerCase();
  const elId = element.id.toLowerCase();
  
  for (const indicator of navIndicators) {
    if (elClasses.includes(indicator) || elId.includes(indicator)) {
      return true;
    }
  }
  
  // Check ARIA roles
  const role = element.getAttribute('role');
  if (role && ['navigation', 'banner', 'menu'].includes(role)) {
    return true;
  }
  
  return false;
}

/**
 * Clean up extracted content
 */
function cleanContent(content: string): string {
  // Remove extra whitespace
  let cleaned = content.replace(/\s+/g, ' ');
  
  // Remove duplicate line breaks
  cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
  
  // Trim the text
  cleaned = cleaned.trim();
  
  // Truncate to reasonable size for context (max ~5000 chars)
  if (cleaned.length > 5000) {
    cleaned = cleaned.substring(0, 5000) + '...';
  }
  
  return cleaned;
}