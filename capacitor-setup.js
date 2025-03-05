
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up Capacitor...');

// Run Capacitor initialization
try {
  // Make sure the dist directory exists
  if (!fs.existsSync('dist')) {
    console.log('Creating dist directory...');
    fs.mkdirSync('dist');
  }

  console.log('Adding Android platform...');
  execSync('npx cap add android', { stdio: 'inherit' });
  
  console.log('Building web app...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Syncing with native projects...');
  execSync('npx cap sync', { stdio: 'inherit' });
  
  // Create android resources directory if it doesn't exist
  if (!fs.existsSync('android-resources')) {
    fs.mkdirSync('android-resources');
  }
  
  console.log('Setup complete! Please follow these next steps:');
  console.log('1. Copy your splash screen image from public/lovable-uploads/3a5a8e4f-456c-40df-b921-169d2ff52762.png to android/app/src/main/res/drawable/splash.png');
  console.log('2. Open the Android project: npx cap open android');
  console.log('3. Run the app from Android Studio');
  
} catch (error) {
  console.error('Error during setup:', error);
  process.exit(1);
}
