# Vyna.live Browser Extension

This browser extension brings Vyna.live's AI assistant and notepad capabilities directly to your browser for an enhanced streaming experience.

## Features

- AI Chat with play-by-play and color commentary styles
- Notepad with automatic saving
- Cross-browser compatibility (Chrome, Firefox, and Edge)
- Syncs with your Vyna.live account

## Building the Extension

### Prerequisites

- Node.js and npm installed

### Installation

1. Clone the repository or navigate to the extension directory
2. Install dependencies:
   ```
   npm install
   ```

### Building for Chrome/Edge

```
npm run build
```

The extension will be built in the `dist` directory.

### Building for Firefox

```
npm run build:firefox
```

The Firefox extension will be built in the `dist-firefox` directory.

## Loading the Extension

### Chrome/Edge

1. Open Chrome or Edge and navigate to the extensions page (`chrome://extensions` or `edge://extensions`)
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` directory

### Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Navigate to the `dist-firefox` directory and select the `manifest.json` file

## Usage

1. Click the Vyna icon in your browser toolbar to open the extension
2. Log in with your Vyna.live account credentials
3. Use the AI Chat to get suggestions and assistance for your streams
4. Save notes for your streams in the Notepad section

## Development

For development mode with automatic rebuilding:

```
npm run dev
```

## License

MIT
