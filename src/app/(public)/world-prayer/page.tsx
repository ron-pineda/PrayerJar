import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Pray for the World | The Prayer Jar' };

const WORLD_REGIONS = [
  {
    region: 'Middle East',
    emoji: '🕊️',
    prompt: 'Pray for peace and reconciliation',
  },
  {
    region: 'Africa',
    emoji: '🌍',
    prompt: 'Pray for revival and healing',
  },
  {
    region: 'Asia',
    emoji: '🌏',
    prompt: 'Pray for open doors and persecuted believers',
  },
  {
    region: 'Europe',
    emoji: '⛪',
    prompt: 'Pray for spiritual awakening',
  },
  {
    region: 'Americas',
    emoji: '🌎',
    prompt: 'Pray for unity and justice',
  },
  {
    region: 'Oceania',
    emoji: '🏝️',
    prompt: 'Pray for indigenous communities',
  },
  {
    region: 'Global Leaders',
    emoji: '🏛️',
    prompt: 'Pray for wisdom and righteousness',
  },
  {
    region: 'Persecuted Church',
    emoji: '✝️',
    prompt: 'Pray for strength and protection',
  },
];

export default function WorldPrayerPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="text-5xl mb-4">🌐</div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Pray for the World</h1>
        <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Intercession crosses every border. Join believers around the globe in lifting up
          nations, communities, and the suffering church — one region at a time.
        </p>
      </div>

      {/* Region cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {WORLD_REGIONS.map(({ region, emoji, prompt }) => (
          <Card key={region} className="group hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 pb-5">
              <div className="flex items-start gap-4">
                <span className="text-3xl leading-none mt-0.5">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold mb-1">{region}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{prompt}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    render={
                      <Link
                        href="/pray"
                        aria-label={`Pray for ${region}`}
                      />
                    }
                  >
                    Pray Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="border-t pt-10 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Want to pray for a specific request in your community?
        </p>
        <Button size="lg" render={<Link href="/pray" />}>
          Go to the Prayer Feed
        </Button>
      </div>
    </main>
  );
}
