/**
 * Script to convert SVG icons to PNG for browser extension compatibility
 * Uses sharp to convert SVG files to PNG format
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ensure the directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Main icon conversion function
async function convertSvgToPng() {
  const iconSizes = [16, 48, 128];
  const iconDir = path.join(__dirname, '../icons');
  
  // Ensure the icons directory exists
  ensureDirectoryExists(iconDir);
  
  // Process each icon size
  for (const size of iconSizes) {
    const svgPath = path.join(iconDir, `icon${size}.svg`);
    const pngPath = path.join(iconDir, `icon${size}.png`);
    
    // Check if SVG exists
    if (!fs.existsSync(svgPath)) {
      console.error(`SVG file not found: ${svgPath}`);
      continue;
    }
    
    try {
      // Convert SVG to PNG
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(pngPath);
      
      console.log(`✅ Converted ${svgPath} to ${pngPath}`);
    } catch (error) {
      console.error(`❌ Error converting ${svgPath} to PNG:`, error);
    }
  }
}

// Execute the conversion
convertSvgToPng().then(() => {
  console.log('Icon conversion complete!');
}).catch(err => {
  console.error('Error during icon conversion:', err);
  process.exit(1);
});
