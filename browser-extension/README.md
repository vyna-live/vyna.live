# Vyna Browser Extension

## Overview

The Vyna Browser Extension provides easy access to Vyna's AI Chat and Notepad functionalities directly from your browser. It allows content creators to quickly access AI-powered assistance and note-taking capabilities without leaving their current workflow.

## Features

### Vyna AI Chat
- Chat with Vyna's AI assistant
- Choose between Play-by-Play and Color Commentary styles
- View history of previous chat sessions
- Upload files and images for AI analysis

### Notepad
- Create, view, and edit notes
- Save notes to your Vyna account
- Seamlessly add content line by line

## Extension Structure

```
browser-extension/
├── assets/               # Extension images and icons
├── background/           # Background scripts
│   └── background.js     # Handles authentication and API requests
├── popup/                # Extension popup UI
│   ├── enhanced-popup.html  # Main popup UI template
│   └── enhanced-popup.js    # Popup functionality
├── styles/               # CSS styles
│   └── enhanced-popup.css   # Popup styling
├── manifest.json         # Extension manifest file
└── README.md            # Documentation
```

## Development

### Setup

1. Clone the repository
2. Navigate to the `browser-extension` directory

### Testing Locally

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable Developer Mode (toggle in the top right)
3. Click "Load unpacked" and select the `browser-extension` directory
4. The extension should now appear in your browser toolbar

### API Connection

The extension connects to the Vyna API. The base URL is configured in:

- `popup/enhanced-popup.js` - For popup functionality
- `background/background.js` - For background processes

For local development, you can change the API_BASE_URL to point to your local development server.

## Build for Production

To package the extension for distribution:

1. Ensure all API URLs are pointing to the production server
2. Zip the contents of the `browser-extension` directory
3. The zip file can be submitted to browser extension stores

## Browser Compatibility

The extension is designed to work with:

- Google Chrome
- Microsoft Edge
- Firefox (may require minor adjustments to manifest.json)

## Authentication

The extension uses cookie-based authentication to maintain login state with the Vyna backend. This ensures a seamless experience between the web application and the browser extension.

## Contributing

When contributing to the browser extension, please:

1. Maintain the existing design language and UI patterns
2. Test thoroughly across multiple browsers
3. Ensure compatibility with the main Vyna application