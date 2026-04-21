import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function ChurchLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // No redirect here — each page redirects to /sign-in?callbackUrl=<page> so OAuth
  // returns the user to where they came from. A top-level redirect here would strip
  // the callbackUrl before the page ever runs.

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <nav
          className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between"
          aria-label="Church navigation"
        >
          <Link href="/" className="font-semibold text-lg">
            <span aria-hidden="true">⛪</span> Church Platform
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{session?.user?.name ?? session?.user?.email}</span>
            <Link href="/" className="hover:text-foreground transition-colors">
              ← Back to PrayerJar
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
