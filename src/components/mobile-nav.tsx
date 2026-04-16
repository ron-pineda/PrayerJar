'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HandHeart, Star, User, Cross } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-3 min-h-[44px] justify-center text-xs ${
            pathname === '/' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        <Link
          href="/pray"
          className={`flex flex-col items-center gap-0.5 px-3 min-h-[44px] justify-center text-xs ${
            pathname.startsWith('/pray') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <HandHeart className="h-5 w-5" />
          <span>Pray</span>
        </Link>

        {/* Elevated Know Jesus button */}
        <Link
          href="/know-jesus"
          className={`flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full shadow-lg -mt-6 ${
            pathname === '/know-jesus'
              ? 'bg-amber-500 text-white'
              : 'bg-primary text-primary-foreground'
          }`}
          aria-label="Know Jesus"
        >
          <Cross className="h-5 w-5" />
        </Link>

        <Link
          href="/praise-wall"
          className={`flex flex-col items-center gap-0.5 px-3 min-h-[44px] justify-center text-xs ${
            pathname === '/praise-wall' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Star className="h-5 w-5" />
          <span>Answered</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center gap-0.5 px-3 min-h-[44px] justify-center text-xs ${
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
