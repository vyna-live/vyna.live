# Vyna.live Extension Installation Guide

## For Developers

### Local Development

1. Clone the repository
2. Navigate to the extension directory
   ```bash
   cd extension
   ```
3. Install dependencies
   ```bash
   npm install
   ```
4. Build the extension
   ```bash
   # For Chrome/Edge
   npm run build
   
   # For Firefox
   npm run build:firefox
   ```
5. Load the extension in your browser

### Chrome/Edge

1. Open Chrome/Edge and navigate to `chrome://extensions` or `edge://extensions`
2. Enable "Developer mode" using the toggle switch in the top right
3. Click "Load unpacked" and select the `dist` folder from the extension directory
4. The extension should now be installed and visible in your browser toolbar

### Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Navigate to the extension directory and select the `dist-firefox/manifest.json` file
4. The extension should now be installed and visible in your browser toolbar

## For Users

### Chrome/Edge

1. Download the latest release package for Chrome/Edge (`vyna-extension-chrome-vX.X.X.zip`)
2. Extract the ZIP file to a folder on your computer
3. Open Chrome/Edge and navigate to `chrome://extensions` or `edge://extensions`
4. Enable "Developer mode" using the toggle switch in the top right
5. Click "Load unpacked" and select the folder containing the extracted files
6. The extension should now be installed and visible in your browser toolbar

### Firefox

1. Download the latest release package for Firefox (`vyna-extension-firefox-vX.X.X.zip`)
2. Open Firefox and navigate to `about:addons`
3. Click the gear icon and select "Install Add-on From File..."
4. Select the downloaded ZIP file
5. Follow the prompts to complete installation
6. The extension should now be installed and visible in your browser toolbar

## Usage

1. Click the Vyna.live extension icon in your browser toolbar
2. Log in with your Vyna.live account credentials
3. Use the popup interface to access AI chat or your notes
4. To open the full dashboard, click "Open Dashboard" in the popup

## Troubleshooting

- If the extension is not working correctly, try reloading the page or restarting your browser
- Ensure you have an active internet connection as the extension requires access to the Vyna.live API
- If you encounter login issues, verify your credentials on the Vyna.live website
- For technical support, contact support@vyna.live
