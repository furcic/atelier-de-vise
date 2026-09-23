import { Capacitor } from '@capacitor/core';

/** Bundled native assets work offline; never register the browser service worker here. */
export async function initializeNative() {
  if (!Capacitor.isNativePlatform()) return;
  const [{ App }, { SplashScreen }, { StatusBar, Style }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/splash-screen'),
    import('@capacitor/status-bar'),
  ]);
  await App.addListener('backButton', () => {
    const event = new Event('atelier:back', { cancelable: true });
    if (window.dispatchEvent(event)) void App.minimizeApp();
  });
  // Match the light canvas; failures must not keep the splash over the app.
  try {
    await StatusBar.setStyle({ style: Style.Light });
  } finally {
    await SplashScreen.hide();
  }
}

/** Share from app-private cache: no photo-library or storage permission required. */
export async function shareCalendar(data: string) {
  const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);
  const file = await Filesystem.writeFile({
    path: 'atelier-de-vise.ics',
    data,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  try {
    await Share.share({
      title: 'Atelier de vise',
      files: [file.uri],
      dialogTitle: 'Salvează data atelierului',
    });
  } catch (error) {
    // Dismissing the system sheet is not a failed export.
    if (!/cancel/i.test(String((error as Error).message))) throw error;
  }
}

export const isNativePlatform = () => Capacitor.isNativePlatform();
