const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create the packages directory if it doesn't exist
const packagesDir = path.join(__dirname, '../packages');
if (!fs.existsSync(packagesDir)) {
  fs.mkdirSync(packagesDir, { recursive: true });
}

// Package Chrome extension
function packageChromeExtension() {
  const output = fs.createWriteStream(path.join(packagesDir, 'vyna-chrome-extension.zip'));
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    console.log(`Chrome extension packaged: ${archive.pointer()} total bytes`);
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  archive.directory(path.join(__dirname, '../dist/chrome'), false);
  archive.finalize();
}

// Package Firefox extension
function packageFirefoxExtension() {
  const output = fs.createWriteStream(path.join(packagesDir, 'vyna-firefox-extension.zip'));
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    console.log(`Firefox extension packaged: ${archive.pointer()} total bytes`);
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  archive.directory(path.join(__dirname, '../dist/firefox'), false);
  archive.finalize();
}

// Package Edge extension (same as Chrome)
function packageEdgeExtension() {
  const output = fs.createWriteStream(path.join(packagesDir, 'vyna-edge-extension.zip'));
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    console.log(`Edge extension packaged: ${archive.pointer()} total bytes`);
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  archive.directory(path.join(__dirname, '../dist/chrome'), false);
  archive.finalize();
}

console.log('Packaging extensions...');
packageChromeExtension();
packageFirefoxExtension();
packageEdgeExtension();
