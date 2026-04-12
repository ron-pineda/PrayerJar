import { Card, CardContent } from '@/components/ui/card';
import type { BadgeType } from '@/db/schema';
import type { Badge } from '@/db/schema';

const BADGE_META: Record<BadgeType, { name: string; description: string; icon: string }> = {
  first_light: { name: 'First Light', description: 'Submitted first prayer request', icon: '🕯️' },
  first_prayer: { name: 'First Prayer', description: 'Prayed for someone for the first time', icon: '🙏' },
  intercessor_bronze: { name: 'Intercessor (Bronze)', description: 'Prayed for 10 requests', icon: '🛡️' },
  intercessor_silver: { name: 'Intercessor (Silver)', description: 'Prayed for 50 requests', icon: '🛡️' },
  intercessor_gold: { name: 'Intercessor (Gold)', description: 'Prayed for 100 requests', icon: '🏆' },
  encourager_bronze: { name: 'Encourager (Bronze)', description: 'Left 10 messages', icon: '💛' },
  encourager_silver: { name: 'Encourager (Silver)', description: 'Left 50 messages', icon: '🧡' },
  encourager_gold: { name: 'Encourager (Gold)', description: 'Left 100 messages', icon: '❤️' },
  faithful: { name: 'Faithful', description: '7-day prayer streak', icon: '🔥' },
  devoted: { name: 'Devoted', description: '30-day prayer streak', icon: '⚡' },
  witness: { name: 'Witness', description: 'Had a prayer answered', icon: '⭐' },
  testimony: { name: 'Testimony', description: 'Shared a testimony', icon: '📖' },
  community_builder: { name: 'Community Builder', description: 'First prayer in a group', icon: '🤝' },
  donor: { name: 'Donor', description: 'Made a donation to PrayerJar', icon: '💝' },
};

const ALL_BADGE_TYPES = Object.keys(BADGE_META) as BadgeType[];

export function BadgeDisplay({ earnedBadges }: { earnedBadges: Badge[] }) {
  const earnedSet = new Set(earnedBadges.map((b) => b.type));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {ALL_BADGE_TYPES.map((type) => {
        const meta = BADGE_META[type];
        const earned = earnedSet.has(type);

        return (
          <Card
            key={type}
            className={earned ? '' : 'opacity-30 grayscale'}
            title={earned ? `Earned: ${meta.name}` : `Locked: ${meta.name}`}
          >
            <CardContent className="flex flex-col items-center text-center p-4 gap-1">
              <span className="text-3xl">{meta.icon}</span>
              <p className="text-xs font-medium">{meta.name}</p>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
