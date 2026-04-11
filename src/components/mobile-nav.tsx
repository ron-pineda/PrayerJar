'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HandHeart, Star, User, Church } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs ${
            pathname === '/' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        <Link
          href="/pray"
          className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs ${
            pathname.startsWith('/pray') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <HandHeart className="h-5 w-5" />
          <span>Pray</span>
        </Link>

        {/* Elevated Add button — links to homepage where PrayerDialog lives */}
        <Link
          href="/"
          className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg -mt-6"
          aria-label="Add a prayer request"
        >
          <span className="text-lg">🕯</span>
        </Link>

        <Link
          href="/praise-wall"
          className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs ${
            pathname === '/praise-wall' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Star className="h-5 w-5" />
          <span>Lights</span>
        </Link>

        <Link
          href="/find-a-church"
          className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs ${
            pathname.startsWith('/find-a-church') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Church className="h-5 w-5" />
          <span>Church</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs ${
            pathname === '/profile' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <User className="h-5 w-5" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
