// Script to convert SVG files to PNG/JPG
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

async function convertImages() {
  try {
    console.log('Starting image conversion...');
    
    // Ensure output directory exists
    const publicImagesDir = path.join(__dirname, '../public/images');
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }
    
    // Convert favicon
    const faviconSvg = fs.readFileSync(path.join(__dirname, '../public/images/favicon.svg'));
    await sharp(faviconSvg)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, '../public/favicon.png'));
    
    await sharp(faviconSvg)
      .resize(180, 180)
      .png()
      .toFile(path.join(__dirname, '../public/images/apple-touch-icon.png'));
      
    // Convert apple-touch-icon
    const appleTouchIconSvg = fs.readFileSync(path.join(__dirname, '../public/images/apple-touch-icon.svg'));
    await sharp(appleTouchIconSvg)
      .resize(180, 180)
      .png()
      .toFile(path.join(__dirname, '../public/images/apple-touch-icon.png'));
    
    // Convert og-image
    const ogImageSvg = fs.readFileSync(path.join(__dirname, '../public/images/og-image.svg'));
    await sharp(ogImageSvg)
      .resize(1200, 630)
      .jpeg({ quality: 90 })
      .toFile(path.join(__dirname, '../public/images/og-image.jpg'));
    
    console.log('Image conversion completed successfully!');
  } catch (error) {
    console.error('Error converting images:', error);
  }
}

convertImages(); 