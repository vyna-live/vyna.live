// This script runs on web pages

// Check if the current site is vyna.live
const isVynaLive = window.location.hostname.includes('vyna.live') || 
                   window.location.hostname.includes('localhost');

if (isVynaLive) {
  console.log('Vyna Helper Extension active on Vyna site');
  
  // Listen for specific events or enhance the page
  // For example, we could sync notes or chat history
  
  // Example: Listen for changes in the page's AI chat
  document.addEventListener('vynaAIResponse', (event) => {
    // If the site emits custom events, we could listen for them
    if (event.detail && event.detail.message) {
      chrome.runtime.sendMessage({
        action: 'syncAIChat',
        message: event.detail.message,
        sender: 'ai'
      });
    }
  });
}

// Create a helper icon that can be clicked to open notepad
function createHelperIcon() {
  // Only inject on non-Vyna sites (since Vyna already has the functionality)
  if (isVynaLive) return;
  
  const iconContainer = document.createElement('div');
  iconContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: linear-gradient(to right, #5D1C34, #A67D44);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    z-index: 9999;
  `;
  
  const icon = document.createElement('span');
  icon.textContent = 'V';
  icon.style.cssText = `
    color: white;
    font-weight: bold;
    font-family: Arial, sans-serif;
    font-size: 24px;
  `;
  
  iconContainer.appendChild(icon);
  document.body.appendChild(iconContainer);
  
  // When clicked, open the extension popup
  iconContainer.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
}

// Run after page is fully loaded
window.addEventListener('load', () => {
  setTimeout(createHelperIcon, 1000);
});