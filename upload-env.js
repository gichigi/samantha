const fs = require('fs');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Read the .env.local file
const envPath = '.env.local';
const envFile = fs.readFileSync(envPath, 'utf8');

// Parse the environment variables
const envVars = dotenv.parse(envFile);

// Log the environment variables (without values for security)
console.log('Found environment variables:');
Object.keys(envVars).forEach(key => {
  console.log(`- ${key}`);
});

// Ask for confirmation
console.log('\nReady to upload these environment variables to Vercel?');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');

// Wait for 5 seconds before proceeding
setTimeout(() => {
  console.log('\nUploading environment variables...');
  
  // Upload each environment variable
  Object.entries(envVars).forEach(([key, value]) => {
    try {
      console.log(`Adding ${key}...`);
      // Add the environment variable to production
      execSync(`echo "${value}" | vercel env add ${key} production`, { stdio: 'pipe' });
      console.log(`✅ Added ${key} to production`);
      
      // Add the environment variable to preview and development
      execSync(`echo "${value}" | vercel env add ${key} preview`, { stdio: 'pipe' });
      console.log(`✅ Added ${key} to preview`);
      
      execSync(`echo "${value}" | vercel env add ${key} development`, { stdio: 'pipe' });
      console.log(`✅ Added ${key} to development`);
    } catch (error) {
      console.error(`❌ Failed to add ${key}: ${error.message}`);
    }
  });
  
  console.log('\nEnvironment variables uploaded. You may need to redeploy your project.');
  console.log('Run: vercel --prod');
}, 5000); 