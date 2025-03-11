
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a24c957ecdc24e9f8e61f206fe28ce33',
  appName: '+Léxico',
  webDir: 'dist',
  server: {
    url: 'https://a24c957e-cdc2-4e9f-8e61-f206fe28ce33.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#9F9EA1",
      showSpinner: false
    }
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
    }
  }
};

export default config;
