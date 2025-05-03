/**
 * Script to package the extension for distribution
 * Creates ZIP archives for Chrome/Edge and Firefox
 */
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create a ZIP archive
function createZipArchive(sourcePath, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Listen for all archive data to be written
    output.on('close', () => {
      console.log(`\u2705 ${outputPath} created (${archive.pointer()} bytes)`);
      resolve();
    });

    // Good practice to catch warnings
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Warning:', err);
      } else {
        reject(err);
      }
    });

    // Handle errors
    archive.on('error', (err) => {
      reject(err);
    });

    // Pipe archive data to the output file
    archive.pipe(output);

    // Add the directory contents to the archive
    archive.directory(sourcePath, false);

    // Finalize the archive
    archive.finalize();
  });
}

// Main packaging function
async function packageExtension() {
  // Set up paths
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  const packageDir = path.join(rootDir, 'packages');
  const chromeSourceDir = path.join(distDir, 'chrome');
  const firefoxSourceDir = path.join(distDir, 'firefox');
  const chromeZipPath = path.join(packageDir, 'vyna-assistant-chrome.zip');
  const firefoxZipPath = path.join(packageDir, 'vyna-assistant-firefox.zip');

  // Ensure the packages directory exists
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir, { recursive: true });
  }

  // Check if the dist directories exist
  if (!fs.existsSync(chromeSourceDir)) {
    throw new Error('Chrome build directory not found. Run the build script first.');
  }
  if (!fs.existsSync(firefoxSourceDir)) {
    throw new Error('Firefox build directory not found. Run the build:firefox script first.');
  }

  // Create the ZIP archives
  console.log('Packaging extension...');
  await createZipArchive(chromeSourceDir, chromeZipPath);
  await createZipArchive(firefoxSourceDir, firefoxZipPath);

  console.log('\nPackaging complete! Extension files available in the packages directory:');
  console.log(` - ${path.relative(rootDir, chromeZipPath)} (Chrome/Edge)`);
  console.log(` - ${path.relative(rootDir, firefoxZipPath)} (Firefox)`);
}

// Execute the packaging
packageExtension().catch(err => {
  console.error('\u274c Error packaging extension:', err);
  process.exit(1);
});
