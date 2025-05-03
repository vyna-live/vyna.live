const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ensure the icons directory exists
const iconDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

async function convertSvgToPng(size) {
  try {
    const svgPath = path.join(iconDir, `icon${size}.svg`);
    const pngPath = path.join(iconDir, `icon${size}.png`);
    
    // Check if SVG exists
    if (!fs.existsSync(svgPath)) {
      console.error(`SVG file not found: ${svgPath}`);
      return;
    }
    
    // Convert SVG to PNG
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(pngPath);
    
    console.log(`Converted ${svgPath} to ${pngPath}`);
  } catch (error) {
    console.error(`Error converting icon${size}.svg to PNG:`, error);
  }
}

// Convert icons
async function main() {
  const sizes = [16, 48, 128];
  for (const size of sizes) {
    await convertSvgToPng(size);
  }
}

main().catch(err => console.error('Error:', err));
