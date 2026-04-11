import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Prayer } from '@/db/schema';
import { formatDistanceToNow } from 'date-fns';
import { ShareButtons } from '@/components/share-buttons';
import Link from 'next/link';

const CATEGORY_ICONS: Record<string, string> = {
  health: '🩺', family: '👨‍👩‍👧', financial: '💼', grief: '🕊️',
  gratitude: '🙏', guidance: '🧭', relationships: '❤️',
  work_career: '⚡', spiritual_growth: '✨', other: '📖',
};

export function PraiseCard({ prayer }: { prayer: Prayer }) {
  const icon = CATEGORY_ICONS[prayer.category] ?? '📖';
  const ago = formatDistanceToNow(new Date(prayer.answeredAt ?? prayer.createdAt), { addSuffix: true });
  const story = prayer.testimonyStory ?? prayer.testimony;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <Badge variant="secondary" className="capitalize">
            {prayer.category.replace(/_/g, ' ')}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">Answered {ago}</span>
      </CardHeader>
      <CardContent className="space-y-3">
        {story ? (
          <>
            <p className="text-sm text-muted-foreground line-clamp-2">{prayer.content}</p>
            <div className="border-l-4 border-amber-400 pl-3">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                ✨ Testimony
              </p>
              <p className="text-sm line-clamp-3">{story}</p>
            </div>
          </>
        ) : (
          <p className="text-sm line-clamp-4">{prayer.content}</p>
        )}

        {prayer.imageUrl && (
          <img
            src={prayer.imageUrl}
            alt="Testimony photo"
            className="w-full h-40 object-cover rounded-lg"
            loading="lazy"
          />
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Prayed for {prayer.prayerCount} {prayer.prayerCount === 1 ? 'time' : 'times'}
          </p>
          {prayer.testimonyStory && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 text-amber-700 dark:text-amber-400"
              render={<Link href={`/testimony/${prayer.id}`} />}
            >
              Read story →
            </Button>
          )}
        </div>

        <ShareButtons
          url={`/p/${prayer.id}`}
          text={story ? `Answered prayer: ${story.slice(0, 80)}` : 'An answered prayer!'}
        />
      </CardContent>
    </Card>
  );
}
