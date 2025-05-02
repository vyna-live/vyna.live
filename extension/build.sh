#!/bin/bash

# Build script for the Vyna.live browser extension

echo "Building Vyna.live browser extension..."

# Build for Chrome/Edge
echo "Building for Chrome/Edge..."
npm run build

# Create a zip file for Chrome/Edge
echo "Creating Chrome/Edge extension package..."
cd dist
zip -r ../vyna-extension-chrome.zip *
cd ..

# Build for Firefox
echo "Building for Firefox..."
npm run build:firefox

# Create a zip file for Firefox
echo "Creating Firefox extension package..."
cd dist-firefox
zip -r ../vyna-extension-firefox.xpi *
cd ..

echo "Build complete!"
echo "Chrome/Edge extension: vyna-extension-chrome.zip"
echo "Firefox extension: vyna-extension-firefox.xpi"
