/**
 * Simplified script to package the extension for distribution
 * Creates ZIP archives for Chrome/Edge and Firefox
 */
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create a ZIP archive
function createZipArchive(sourcePath, outputPath) {
  return new Promise((resolve, reject) => {
    // Make sure the directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Listen for all archive data to be written
    output.on('close', () => {
      console.log(`✅ ${outputPath} created (${archive.pointer()} bytes)`);
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

// Simple function to zip a directory
async function zipDirectory(sourcePath, outputName) {
  try {
    const rootDir = process.cwd();
    const packageDir = path.join(rootDir, 'packages');
    const zipPath = path.join(packageDir, outputName);

    console.log(`Creating ZIP for ${sourcePath}...`);
    await createZipArchive(sourcePath, zipPath);
    console.log(`\nZIP created at: ${zipPath}`);
    return zipPath;
  } catch (error) {
    console.error('Error creating ZIP:', error);
    throw error;
  }
}

// If called directly, zip the current directory
if (require.main === module) {
  const args = process.argv.slice(2);
  const sourcePath = args[0] || '.';
  const outputName = args[1] || 'extension.zip';
  
  zipDirectory(sourcePath, outputName)
    .then(zipPath => console.log('Done!'))
    .catch(err => {
      console.error('\n❌ Error:', err);
      process.exit(1);
    });
}

module.exports = { zipDirectory };
