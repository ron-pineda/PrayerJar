import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Prayer } from '@/db/schema';
import { formatDistanceToNow } from 'date-fns';
import { ShareButtons } from '@/components/share-buttons';

const CATEGORY_ICONS: Record<string, string> = {
  health: '🩺', family: '👨‍👩‍👧', financial: '💼', grief: '🕊️',
  gratitude: '🙏', guidance: '🧭', relationships: '❤️',
  work_career: '⚡', spiritual_growth: '✨', other: '📖',
};

export function PraiseCard({ prayer }: { prayer: Prayer }) {
  const icon = CATEGORY_ICONS[prayer.category] ?? '📖';
  const ago = formatDistanceToNow(new Date(prayer.createdAt), { addSuffix: true });

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <Badge variant="secondary" className="capitalize">
            {prayer.category.replace('_', ' ')}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{ago}</span>
      </CardHeader>
      <CardContent className="space-y-3">
        {prayer.testimony ? (
          <>
            <p className="text-sm text-muted-foreground line-clamp-3">{prayer.content}</p>
            <div className="border-l-4 border-amber-400 pl-3">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                ✨ Testimony
              </p>
              <p className="text-sm">{prayer.testimony}</p>
            </div>
          </>
        ) : (
          <p className="text-sm">{prayer.content}</p>
        )}

        {prayer.imageUrl && (
          <img
            src={prayer.imageUrl}
            alt="Testimony photo"
            className="w-full h-48 object-cover rounded-lg"
            loading="lazy"
          />
        )}

        <p className="text-xs text-muted-foreground">
          Prayed for {prayer.prayerCount} {prayer.prayerCount === 1 ? 'time' : 'times'}
        </p>
        <ShareButtons
          url={`/p/${prayer.id}`}
          text={prayer.testimony ? `Answered prayer: ${prayer.testimony.slice(0, 80)}` : 'An answered prayer!'}
        />
      </CardContent>
    </Card>
  );
}
