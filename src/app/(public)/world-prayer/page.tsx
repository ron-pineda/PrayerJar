import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Feather,
  Leaf,
  Users,
  Church,
  Scale,
  Landmark,
  Gavel,
  Cross,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal } from '@/components/scroll-reveal';

export const metadata: Metadata = { title: 'Pray for the World | The Prayer Jar' };

const WORLD_REGIONS: { region: string; icon: LucideIcon; prompt: string }[] = [
  {
    region: 'Middle East',
    icon: Feather,
    prompt: 'Pray for peace, reconciliation, and protected churches.',
  },
  {
    region: 'Africa',
    icon: Leaf,
    prompt: 'Pray for revival, clean water, and healing from conflict.',
  },
  {
    region: 'Asia',
    icon: Users,
    prompt: 'Pray for open doors and for believers under pressure.',
  },
  {
    region: 'Europe',
    icon: Church,
    prompt: 'Pray for spiritual awakening and returning families.',
  },
  {
    region: 'Americas',
    icon: Scale,
    prompt: 'Pray for unity, justice, and the forgotten.',
  },
  {
    region: 'Oceania',
    icon: Landmark,
    prompt: 'Pray for indigenous communities and coastal families.',
  },
  {
    region: 'Global leaders',
    icon: Gavel,
    prompt: 'Pray for wisdom, humility, and righteous decisions.',
  },
  {
    region: 'Persecuted church',
    icon: Cross,
    prompt: 'Pray for strength, protection, and unwavering faith.',
  },
];

export default function WorldPrayerPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-14">
        <Globe className="h-12 w-12 text-amber-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold tracking-tight mb-4">Pray for the world</h1>
        <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Intercession crosses every border. Stand with the people carrying these burdens tonight.
        </p>
      </div>

      {/* Verse strip — 1 Timothy 2:1–2 */}
      <ScrollReveal>
        <div className="border-t border-b py-4 mb-12 max-w-xl mx-auto px-4">
          <p className="text-sm italic text-muted-foreground leading-relaxed text-center">
            &ldquo;I urge, then, first of all, that petitions, prayers, intercession and
            thanksgiving be made for all people &mdash; for kings and all those in authority,
            that we may live peaceful and quiet lives in all godliness and holiness.&rdquo;
          </p>
          <p className="text-xs text-primary mt-2 text-center">1 Timothy 2:1&ndash;2</p>
        </div>
      </ScrollReveal>

      {/* Region cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {WORLD_REGIONS.map(({ region, icon: Icon, prompt }, i) => (
          <ScrollReveal key={region} delay={i * 80}>
            <Card className="group hover:border-primary/50 transition-colors h-full">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-start gap-4">
                  <Icon className="h-8 w-8 text-amber-600 shrink-0 mt-0.5" />
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
                      Pray now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      {/* Bottom CTA */}
      <ScrollReveal delay={80}>
        <div className="border-t pt-10 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Have a specific request in your own community?
          </p>
          <Button size="lg" render={<Link href="/pray" />}>
            Go to the prayer feed
          </Button>
        </div>
      </ScrollReveal>
    </main>
  );
}
