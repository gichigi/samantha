const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const inputSvg = path.join(__dirname, '../public/favicon.svg');
const outputDir = path.join(__dirname, '../public');

const sizes = {
  favicon16: 16,
  favicon32: 32,
  appleTouch: 180,
  android192: 192,
  android512: 512,
};

async function generateFavicons() {
  try {
    console.log('Converting SVG to PNG at multiple sizes...');
    
    // Generate all PNG sizes
    const pngBuffers = {};
    for (const [name, size] of Object.entries(sizes)) {
      const buffer = await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toBuffer();
      pngBuffers[name] = buffer;
      
      let outputPath;
      if (name === 'favicon16') {
        outputPath = path.join(outputDir, 'favicon-16x16.png');
      } else if (name === 'favicon32') {
        outputPath = path.join(outputDir, 'favicon-32x32.png');
      } else if (name === 'appleTouch') {
        outputPath = path.join(outputDir, 'apple-touch-icon.png');
      } else if (name === 'android192') {
        outputPath = path.join(outputDir, 'android-chrome-192x192.png');
      } else if (name === 'android512') {
        outputPath = path.join(outputDir, 'android-chrome-512x512.png');
      }
      
      fs.writeFileSync(outputPath, buffer);
      console.log(`✓ Created ${outputPath} (${size}x${size})`);
    }

    console.log('Generating favicon.ico...');
    // Create ICO from 16x16 and 32x32
    const icoBuffer = await toIco([pngBuffers.favicon16, pngBuffers.favicon32]);
    const icoPath = path.join(outputDir, 'favicon.ico');
    fs.writeFileSync(icoPath, icoBuffer);
    console.log(`✓ Created ${icoPath}`);
    
    console.log('\n✅ All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();

