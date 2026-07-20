import { Card, CardContent } from '@/components/ui/card';
import type { BadgeType } from '@/db/schema';
import type { Badge } from '@/db/schema';
import {
  BookOpen,
  CalendarHeart,
  Flame,
  Gift,
  HandHelping,
  MessageCircle,
  MessageCircleHeart,
  Shield,
  Star,
  Sunrise,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';

const BADGE_META: Record<BadgeType, { name: string; description: string; icon: LucideIcon }> = {
  first_light: { name: 'First Light', description: 'Submitted first prayer request', icon: Flame },
  first_prayer: { name: 'First Prayer', description: 'Prayed for someone for the first time', icon: HandHelping },
  intercessor_bronze: { name: 'Intercessor (Bronze)', description: 'Prayed for 10 requests', icon: Shield },
  intercessor_silver: { name: 'Intercessor (Silver)', description: 'Prayed for 50 requests', icon: Shield },
  intercessor_gold: { name: 'Intercessor (Gold)', description: 'Prayed for 100 requests', icon: Trophy },
  encourager_bronze: { name: 'Encourager (Bronze)', description: 'Left 10 messages', icon: MessageCircle },
  encourager_silver: { name: 'Encourager (Silver)', description: 'Left 50 messages', icon: MessageCircle },
  encourager_gold: { name: 'Encourager (Gold)', description: 'Left 100 messages', icon: MessageCircleHeart },
  faithful: { name: 'Faithful', description: '7-day prayer streak', icon: Sunrise },
  devoted: { name: 'Devoted', description: '30-day prayer streak', icon: CalendarHeart },
  witness: { name: 'Witness', description: 'Had a prayer answered', icon: Star },
  testimony: { name: 'Testimony', description: 'Shared a testimony', icon: BookOpen },
  community_builder: { name: 'Community Builder', description: 'First prayer in a group', icon: Users },
  donor: { name: 'Donor', description: 'Made a donation to PrayerJar', icon: Gift },
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
            title={earned ? `Earned: ${meta.name}` : `Not yet earned: ${meta.name}`}
          >
            <CardContent className="flex flex-col items-center text-center p-4 gap-1">
              <meta.icon className="h-8 w-8 text-amber-600" aria-hidden="true" />
              <p className="text-xs font-medium">{meta.name}</p>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
