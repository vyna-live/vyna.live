# Vyna AI Assistant Browser Extension

This browser extension brings the power of Vyna AI Assistant directly to your browser, allowing streamers and content creators to access AI-powered assistance while browsing the web.

## Features

- **AI Chat Assistant**: Get instant AI assistance with play-by-play or color commentary modes
- **Notepad**: Save and organize AI responses and notes directly in the extension
- **Page Context Awareness**: The AI assistant can understand the content of the page you're browsing
- **Cross-Browser Compatibility**: Works on Chrome, Firefox, and Microsoft Edge
- **Synchronized Account**: Seamlessly connects to your Vyna.live account

## Development

### Technology Stack

- **Frontend**: React with TypeScript
- **State Management**: React Context API and Chrome Storage API
- **Styling**: Custom CSS with Vyna design system
- **Build System**: Webpack with separate configs for Chrome/Edge and Firefox
- **Packaging**: Custom scripts for building distributable extensions

### Directory Structure

```
/extension
├── background/       # Background script for extension
├── content/          # Content scripts that run on web pages
├── icons/            # Extension icons
├── libs/             # Shared libraries and utilities
│   ├── components/   # React components
│   │   └── ui/       # UI components like Logo
│   └── utils/        # Utility functions for API and storage
├── popup/            # Extension popup UI
├── scripts/          # Build and packaging scripts
└── types/            # TypeScript type definitions
```

### Build Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Build for Chrome and Edge:
   ```
   npm run build
   ```

3. Build for Firefox:
   ```
   npm run build:firefox
   ```

4. Build for all browsers and package:
   ```
   npm run package
   ```

### Development Mode

Run the extension in watch mode for development:
```
npm run watch
```

## Installation

### Chrome/Edge

1. Go to `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/chrome` directory

### Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file in the `dist/firefox` directory

## Integration with Vyna.live

This extension works with your Vyna.live account, synchronizing your AI chat history, notes, and preferences across devices. The extension communicates with the Vyna.live API for AI processing and data storage.

## Privacy

The extension requests minimal permissions:
- `storage`: To save your preferences and authentication details
- `activeTab`: To read the content of the current tab when you use the AI assistant
- `tabs`: To detect when you navigate to new pages

Data is sent only to the Vyna.live servers and is subject to the Vyna.live Privacy Policy.
