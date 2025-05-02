// Content script for Vyna.live Extension
// This script runs in the context of web pages and can interact with the page's DOM

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'extractPageContent') {
    // Extract page title and text content
    const pageTitle = document.title;
    const pageContent = document.body.innerText.substring(0, 1000); // First 1000 chars
    
    // Send the extracted content back to the sender
    sendResponse({
      success: true,
      title: pageTitle,
      content: pageContent,
      url: window.location.href
    });
  }
  
  if (message.type === 'highlightText') {
    // Find and highlight the specified text
    if (message.text) {
      highlightText(message.text);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'No text specified for highlighting' });
    }
  }
  
  // Return true to indicate that the response will be sent asynchronously
  return true;
});

// Function to highlight text on the page
function highlightText(text: string): void {
  // Convert the text to lowercase for case-insensitive matching
  const textLowerCase = text.toLowerCase();
  
  // Recursive function to search for text in DOM nodes
  function searchAndHighlight(node: Node): boolean {
    // Skip script, style, and already highlighted nodes
    if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE' || 
        (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList.contains('vyna-highlight'))) {
      return false;
    }
    
    // Check text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      const content = node.textContent || '';
      if (content.toLowerCase().includes(textLowerCase)) {
        // Create a wrapper for highlighted text
        const highlightedNode = document.createElement('span');
        highlightedNode.classList.add('vyna-highlight');
        highlightedNode.style.backgroundColor = 'rgba(64, 196, 208, 0.3)';
        highlightedNode.style.color = 'inherit';
        
        // Replace the text with highlighted version
        const parent = node.parentNode;
        if (parent) {
          const parts = content.split(new RegExp(`(${text})`, 'i'));
          parent.removeChild(node);
          
          parts.forEach(part => {
            if (part.toLowerCase() === textLowerCase) {
              const highlight = document.createElement('span');
              highlight.classList.add('vyna-highlight');
              highlight.style.backgroundColor = 'rgba(64, 196, 208, 0.3)';
              highlight.style.color = 'inherit';
              highlight.textContent = part;
              parent.appendChild(highlight);
            } else if (part) {
              parent.appendChild(document.createTextNode(part));
            }
          });
          
          return true;
        }
      }
      return false;
    }
    
    // Recursively check child nodes
    let found = false;
    for (const childNode of Array.from(node.childNodes)) {
      if (searchAndHighlight(childNode)) {
        found = true;
      }
    }
    
    return found;
  }
  
  searchAndHighlight(document.body);
  
  // Scroll to the first highlighted element
  const firstHighlight = document.querySelector('.vyna-highlight');
  if (firstHighlight) {
    firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Add the extension's stylesheet to the page
function addStylesheet() {
  const style = document.createElement('style');
  style.textContent = `
    .vyna-highlight {
      background-color: rgba(64, 196, 208, 0.3);
      color: inherit;
      border-radius: 2px;
      padding: 0 2px;
    }
  `;
  document.head.appendChild(style);
}

// Initialize the content script
addStylesheet();

// Notify that the content script is loaded
chrome.runtime.sendMessage({ type: 'contentScriptLoaded', url: window.location.href });
