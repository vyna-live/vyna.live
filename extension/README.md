# Vyna.live Browser Extension

This is the browser extension for Vyna.live, providing AI chat, note-taking, and website content extraction capabilities directly in your browser.

## Features

- AI chat with Vyna assistant
- Note-taking with markdown support
- Web page content extraction
- Synchronized with Vyna.live account

## Building the Extension

### Prerequisites

- Node.js and npm

### Installation

```bash
cd extension
npm install
```

### Development

```bash
# For Chrome/Edge
npm run dev

# For Firefox
npm run dev:firefox
```

### Building for Production

```bash
# For Chrome/Edge
npm run build

# For Firefox
npm run build:firefox
```

### Packaging

To create distributable zip files for both Chrome/Edge and Firefox:

```bash
./build.sh
```

This will create zip files in the `packages` directory.

## Browser Support

- Google Chrome
- Microsoft Edge
- Mozilla Firefox

## Structure

- `manifest.json` - Chrome/Edge manifest file
- `manifest.firefox.json` - Firefox manifest file
- `popup/` - Popup UI code
- `dashboard/` - Dashboard UI code
- `background/` - Background scripts
- `content/` - Content scripts
- `libs/components/` - Shared React components
- `assets/` - Icons and other assets

## Development Guidelines

1. All components should follow the Vyna.live design system
2. Use TypeScript for all code
3. Maintain consistent error handling and user feedback
4. Always check authentication status before making API requests
