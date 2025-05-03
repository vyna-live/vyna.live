const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'browser-extension/popup/enhanced-popup.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the login tab initialization at line ~302-305
const loginTabInit = `        // Initialize the interface
        initializeUserDropdown();
        initializeTabs();
        loadActiveTab();`;

const loginTabInitNew = `        // Initialize the interface after login
        initializeUserDropdown();
        
        // Setup default tabs
        console.log('Login: Setting up interface with activeTab:', activeTab);
        const loginTabElement = document.querySelector('.tabs .tab[data-tab="vynaai"]');
        if (loginTabElement) {
          loginTabElement.classList.add('active');
        } else {
          console.error('Login: Default tab element not found');
        }
        
        const loginContentElement = document.getElementById('vynaai-content');
        if (loginContentElement) {
          loginContentElement.classList.add('active');
        } else {
          console.error('Login: Default content element not found');
        }
        
        // Initialize tab switching
        initializeTabs();
        
        // Load initial content with a small delay to ensure DOM is ready
        setTimeout(() => {
          console.log('Login: Loading initial tab content');
          loadActiveTab();
        }, 100);`;

// Replace only the first occurrence - the one in handleLogin function
const updatedContent = content.replace(loginTabInit, loginTabInitNew);

// Write the file back
fs.writeFileSync(filePath, updatedContent, 'utf8');

console.log('File updated successfully!');
