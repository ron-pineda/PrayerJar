import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { NotificationBell } from '@/components/notification-bell';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from '@/components/mobile-nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prayerjar.app'),
  title: 'Prayer Jar',
  description: 'A global prayer jar — share your heart, intercede for others.',
  openGraph: {
    title: 'Prayer Jar',
    description: 'A global prayer jar — share your heart, intercede for others.',
    siteName: 'Prayer Jar',
  },
  twitter: {
    card: 'summary',
    title: 'Prayer Jar',
    description: 'A global prayer jar — share your heart, intercede for others.',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ThemeProvider>
        <header className="border-b">
          <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">
              🫙 Prayer Jar
            </Link>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" render={<Link href="/pray" />}>Pray</Button>
              <Button variant="ghost" size="sm" render={<Link href="/praise-wall" />}>Lights Released</Button>
              <Button variant="ghost" size="sm" render={<Link href="/know-jesus" />}>Know Jesus</Button>
              <Button variant="ghost" size="sm" render={<Link href="/find-a-church" />}>Find a Church</Button>
              <ThemeToggle />

              {session ? (
                <>
                  <Button variant="ghost" size="sm" render={<Link href="/my-prayers" />}>My Prayers</Button>
                  <NotificationBell />
                  <form action={async () => { 'use server'; await signOut(); }}>
                    <Button variant="ghost" size="sm" type="submit">Sign Out</Button>
                  </form>
                </>
              ) : (
                <Button variant="ghost" size="sm" render={<Link href="/sign-in" />}>Sign In</Button>
              )}
            </div>
          </nav>
        </header>
        <div className="flex-1 pb-16 md:pb-0">
          {children}
        </div>
        <MobileNav />
        <footer className="border-t mt-auto py-6 px-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} The Prayer Jar</span>
            <div className="flex gap-4">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
