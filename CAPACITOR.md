
# Using Capacitor for Native Mobile Apps

This project is set up with Capacitor to enable native mobile functionality. Follow these steps to build and run the app on mobile devices:

## Prerequisites
- Node.js and npm installed
- For Android: Android Studio installed
- For iOS: Xcode installed (Mac only)

## Setup Instructions

1. Clone your repository and install dependencies:
   ```bash
   npm install
   ```

2. Add the native platforms:
   ```bash
   npx cap add android
   npx cap add ios  # Mac only
   ```

3. Build the web app:
   ```bash
   npm run build
   ```

4. Sync the build with the native projects:
   ```bash
   npx cap sync
   ```

5. Open the native projects:
   ```bash
   npx cap open android  # Opens in Android Studio
   npx cap open ios      # Opens in Xcode (Mac only)
   ```

## Splash Screen

The splash screen is configured to match the web app's splash screen. The configuration is in the `capacitor.config.ts` file.

For Android, you need to:
1. Copy the splash image from `public/lovable-uploads/3a5a8e4f-456c-40df-b921-169d2ff52762.png` to `android/app/src/main/res/drawable/splash.png` after adding the Android platform.
2. Ensure the image is properly sized (recommended 768x768px or higher for best display on multiple devices).

## Updating the App

After making changes to the web app:

1. Rebuild the web app:
   ```bash
   npm run build
   ```

2. Sync changes with native projects:
   ```bash
   npx cap sync
   ```

3. Open and run in the native IDE as needed.

## Live Reload for Development

For development with live reload:

```bash
npm run dev
npx cap run android -l --external  # For Android
npx cap run ios -l --external      # For iOS
```
