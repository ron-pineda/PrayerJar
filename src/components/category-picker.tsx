import Link from 'next/link';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const CATEGORY_ICONS: Record<string, string> = {
  health: '🩺', family: '👨‍👩‍👧', financial: '💼', grief: '🕊️',
  gratitude: '🙏', guidance: '🧭', relationships: '❤️',
  work_career: '⚡', spiritual_growth: '✨', other: '📖',
};

export function CategoryPicker({ urgentOnly = false }: { urgentOnly?: boolean }) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
        <Link href={`/pray/any${urgentOnly ? '?urgent=1' : ''}`}>
          <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <span className="text-2xl mb-1">🙏</span>
              <span className="text-sm font-medium">Any</span>
            </CardContent>
          </Card>
        </Link>
        {PRAYER_CATEGORIES.map((cat) => (
          <Link key={cat.value} href={`/pray/${cat.value}${urgentOnly ? '?urgent=1' : ''}`}>
            <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <span className="text-2xl mb-1">{CATEGORY_ICONS[cat.value]}</span>
                <span className="text-sm font-medium">{cat.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Link
          href={urgentOnly ? '/pray' : '/pray?urgent=1'}
          className="text-muted-foreground underline underline-offset-4"
        >
          {urgentOnly ? 'Show all requests' : 'Show urgent requests only'}
        </Link>
      </div>
    </div>
  );
}
