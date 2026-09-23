import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ro.atelierdevise.app',
  appName: 'Atelier de vise',
  webDir: 'dist-mobile',
  backgroundColor: '#f8f2eb',
  ios: { contentInset: 'never' },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: '#f8f2eb',
      showSpinner: false,
    },
    SystemBars: { insetsHandling: 'css', style: 'LIGHT' },
  },
};

export default config;
