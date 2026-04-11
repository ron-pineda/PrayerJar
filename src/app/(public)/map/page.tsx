import { PrayerMap } from '@/components/map/prayer-map';

export const metadata = { title: 'Prayer Map | The Prayer Jar' };

export default function MapPage() {
  return (
    <main className="relative w-full h-[calc(100vh-4rem)]">
      <PrayerMap className="w-full h-full" />
    </main>
  );
}
