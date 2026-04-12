import { Capacitor } from '@capacitor/core';

export { Capacitor };

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function sharePrayer(title: string, text: string, url: string): Promise<void> {
  if (!isNative()) {
    // Fall back to Web Share API
    if (navigator.share) {
      await navigator.share({ title, text, url });
    }
    return;
  }
  const { Share } = await import('@capacitor/share');
  await Share.share({ title, text, url, dialogTitle: 'Share this prayer' });
}

export async function registerPushToken(): Promise<string | null> {
  if (!isNative()) return null;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  await PushNotifications.requestPermissions();
  await PushNotifications.register();
  return new Promise((resolve) => {
    PushNotifications.addListener('registration', (token) => {
      resolve(token.value);
    });
    PushNotifications.addListener('registrationError', () => {
      resolve(null);
    });
  });
}
