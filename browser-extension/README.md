# Vyna.live Browser Extension

## Overview
The Vyna.live browser extension provides quick access to AI chat and notepad functionality from your browser without needing to open the full Vyna.live application. This extension is designed to match the look and feel of the main Vyna.live application while providing a streamlined, focused experience.

## Features
- **VynaAI Chat**: Access the AI assistant directly from your browser
- **Notepad**: Create and manage notes directly from your browser
- **Seamless Authentication**: Uses the same account as your Vyna.live web application
- **Consistent Design**: Matches the look and feel of the main application

## Installation

### Chrome
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `browser-extension` folder
5. The extension should now appear in your extensions list

### Firefox
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select the `manifest.json` file within the `browser-extension` folder
5. The extension should now appear in your extensions list

### Microsoft Edge
1. Download or clone this repository
2. Open Edge and navigate to `edge://extensions/`
3. Enable "Developer mode" using the toggle at the bottom left
4. Click "Load unpacked" and select the `browser-extension` folder
5. The extension should now appear in your extensions list

## Usage

### Authentication
Before using the extension, you need to be logged in to your Vyna.live account. If you're not logged in, the extension will prompt you to do so.

### VynaAI Chat
1. Click on the Vyna.live extension icon in your browser toolbar
2. The default tab is VynaAI chat
3. Type your message in the input field and press Enter or click the send button
4. Choose between Color Commentary (CC) or Play-by-Play (PP) styles using the toggle at the top of the input field

### Notepad
1. Click on the Vyna.live extension icon in your browser toolbar
2. Click on the "Notepad" tab
3. Click on "New Note" to create a new note
4. Add lines to your note using the input field
5. Click "Save" to save your note

## Development

### Extension Structure
- `manifest.json`: Extension configuration
- `popup/enhanced-popup.html`: Main HTML for the extension popup
- `popup/enhanced-popup.js`: JavaScript for the extension popup
- `styles/enhanced-popup.css`: CSS for the extension popup
- `assets/`: Icons and other assets
- `background/background.js`: Background service worker script

### Design Principles
1. **Consistency**: The extension UI should match the main application
2. **Simplicity**: Focus on core functionality
3. **Performance**: Minimize API calls and optimize resource usage

### API Integration
The extension communicates with the Vyna.live backend API using the same endpoints as the main application. Authentication is handled through cookies, allowing for a seamless experience between the web application and the extension.

## Known Issues
- Performance may be slower compared to the main application
- Limited offline functionality

## Contributing
We welcome contributions to improve the Vyna.live browser extension. Please feel free to submit pull requests or open issues for bugs and feature requests.
