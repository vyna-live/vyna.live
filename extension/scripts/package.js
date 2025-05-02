const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Packaging Vyna extensions...');

// Ensure dist directories exist
try {
  if (!fs.existsSync(path.join(__dirname, '../dist'))) {
    fs.mkdirSync(path.join(__dirname, '../dist'));
  }
  if (!fs.existsSync(path.join(__dirname, '../dist-firefox'))) {
    fs.mkdirSync(path.join(__dirname, '../dist-firefox'));
  }
} catch (error) {
  console.error('Error creating distribution directories:', error);
  process.exit(1);
}

// Function to create a ZIP archive
function createZipArchive(sourceDir, outputZip) {
  try {
    // Check if the source directory exists
    if (!fs.existsSync(sourceDir)) {
      console.error(`Source directory ${sourceDir} does not exist`);
      return false;
    }

    // Create the ZIP file using the zip command or archiver library
    try {
      console.log(`Creating ZIP archive from ${sourceDir} to ${outputZip}...`);
      const command = `cd ${sourceDir} && zip -r ${path.resolve(outputZip)} .`;
      execSync(command, { stdio: 'inherit' });
      console.log(`Successfully created ${outputZip}`);
      return true;
    } catch (error) {
      console.error('Error creating ZIP archive:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in createZipArchive:', error);
    return false;
  }
}

// Create ZIP archives
const chromeSuccess = createZipArchive(
  path.join(__dirname, '../dist'),
  path.join(__dirname, '../vyna-extension-chrome.zip')
);

const firefoxSuccess = createZipArchive(
  path.join(__dirname, '../dist-firefox'),
  path.join(__dirname, '../vyna-extension-firefox.zip')
);

// Summary
console.log('\nPackaging completed:');
console.log(`Chrome extension: ${chromeSuccess ? '✅ Success' : '❌ Failed'}`);
console.log(`Firefox extension: ${firefoxSuccess ? '✅ Success' : '❌ Failed'}`);

if (chromeSuccess && firefoxSuccess) {
  console.log('\nExtension packages are ready for distribution!');
  console.log('- Chrome/Edge: vyna-extension-chrome.zip');
  console.log('- Firefox: vyna-extension-firefox.zip');
} else {
  process.exit(1);
}
