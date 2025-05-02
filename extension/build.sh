#!/bin/bash

set -e

# Ensure directories exist
mkdir -p dist/icons
mkdir -p dist-firefox/icons

# Build for Chrome/Edge (Manifest V3)
echo "Building extension for Chrome/Edge..."
npx webpack --config webpack.config.js

# Build for Firefox (Manifest V2)
echo "Building extension for Firefox..."
npx webpack --config webpack.firefox.config.js

# Create ZIP archives
echo "Creating ZIP archives..."

# Chrome/Edge
cd dist
zip -r ../vyna-extension-chrome.zip .
cd ..

# Firefox
cd dist-firefox
zip -r ../vyna-extension-firefox.zip .
cd ..

echo "Build complete!"
echo "Chrome/Edge extension: vyna-extension-chrome.zip"
echo "Firefox extension: vyna-extension-firefox.zip"
