import Link from 'next/link';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CATEGORY_ICONS } from '@/lib/category-icons';
import { Star } from 'lucide-react';

export function CategoryPicker({ urgentOnly = false }: { urgentOnly?: boolean }) {
  const AnyIcon = CATEGORY_ICONS.any;
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
        <Link href={`/pray/any${urgentOnly ? '?urgent=1' : ''}`}>
          <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <AnyIcon className="h-6 w-6 text-amber-600 mb-1" aria-hidden="true" />
              <span className="text-sm font-medium">Any</span>
            </CardContent>
          </Card>
        </Link>
        {PRAYER_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.value] ?? Star;
          return (
            <Link key={cat.value} href={`/pray/${cat.value}${urgentOnly ? '?urgent=1' : ''}`}>
              <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
                <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                  <Icon className="h-6 w-6 text-amber-600 mb-1" aria-hidden="true" />
                  <span className="text-sm font-medium">{cat.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
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
