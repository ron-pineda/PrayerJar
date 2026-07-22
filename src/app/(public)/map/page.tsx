import { PrayerMap } from '@/components/map/prayer-map';

export const metadata = { title: 'Prayer Map | The Prayer Jar' };

export default function MapPage() {
  return (
    <main className="relative w-full h-[calc(100vh-4rem)]">
      {/* Visually hidden: the map is full-bleed, but the page still needs a
          top-level heading for screen readers and document outline. */}
      <h1 className="sr-only">Prayer Map</h1>
      <PrayerMap className="w-full h-full" />
    </main>
  );
}
