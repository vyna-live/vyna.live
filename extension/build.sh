#!/bin/bash

# Build script for Vyna.live extension

# Check if npm is installed
if ! [ -x "$(command -v npm)" ]; then
  echo 'Error: npm is not installed.' >&2
  exit 1
fi

# Set variables
EXTENSION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$EXTENSION_DIR/dist"
FIREFOX_DIST_DIR="$EXTENSION_DIR/dist-firefox"
ZIP_DIR="$EXTENSION_DIR/packages"

# Create packages directory if it doesn't exist
mkdir -p "$ZIP_DIR"

# Build Chrome/Edge extension
echo "Building Chrome/Edge extension..."
cd "$EXTENSION_DIR" && npm run build

# Create Chrome/Edge zip package
echo "Creating Chrome/Edge package..."
cd "$DIST_DIR" && zip -r "$ZIP_DIR/vyna-extension-chrome-v1.0.0.zip" *

# Build Firefox extension
echo "Building Firefox extension..."
cd "$EXTENSION_DIR" && npm run build:firefox

# Create Firefox zip package
echo "Creating Firefox package..."
cd "$FIREFOX_DIST_DIR" && zip -r "$ZIP_DIR/vyna-extension-firefox-v1.0.0.zip" *

echo "Build completed."
echo "Chrome/Edge package: $ZIP_DIR/vyna-extension-chrome-v1.0.0.zip"
echo "Firefox package: $ZIP_DIR/vyna-extension-firefox-v1.0.0.zip"
