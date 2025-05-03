# Vyna.live Browser Extension

This browser extension brings the AI chat and notepad functionality from Vyna.live to your browser. It allows you to use these tools while browsing the web, without having to navigate to the Vyna.live website.

## Features

- **AI Chat**: Chat with the Vyna AI assistant with two commentary styles:
  - **Color Commentary**: Detailed, insightful responses
  - **Play-by-Play**: Quick, action-oriented responses
- **File uploads**: Upload documents, images, and record audio messages
- **Notepad**: Create and edit notes with a simple, clean interface
- **Authentication**: Securely log in to your Vyna.live account

## Installation

### Chrome

1. Download and extract the extension
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the `browser-extension` folder

### Firefox

1. Download and extract the extension
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select the `manifest.json` file in the `browser-extension` folder

### Microsoft Edge

1. Download and extract the extension
2. Open Edge and navigate to `edge://extensions/`
3. Enable "Developer mode" (toggle on the left sidebar)
4. Click "Load unpacked"
5. Select the `browser-extension` folder

## Usage

1. Click the Vyna.live extension icon in your browser toolbar
2. Log in with your Vyna.live account credentials
3. Use the AI chat or notepad features

## Development

This extension is built using standard web technologies:

- HTML, CSS, and JavaScript
- Web Extension API (compatible with Chrome, Firefox, and Edge)

### Building

No build step is required for development. Simply load the unpacked extension in your browser.

For production distribution, you can create a zip file of the extension folder:

```bash
zip -r vyna-extension.zip browser-extension/
```

## License

All rights reserved. Copyright © 2025 Vyna.live
