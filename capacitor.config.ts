import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.evchamp.app',
  appName: 'EVChamp',
  webDir: 'build',
  server: {
    url: 'https://evchamp.vercel.app',
    cleartext: false,
    allowNavigation: [
      'evchamp.in',
      'evchamp.vercel.app',
      'zeflash.app',
      '*.zeflash.app',
      '*.vercel.app',
      '*.clerk.accounts.dev',
      'clerk.accounts.dev',
      'accounts.clerk.dev',
      '*.clerk.dev',
      'clerk.dev',
      '*.clerk.com',
      'clerk.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#22c55e",
      showSpinner: false,
    },
  },
};

export default config;
