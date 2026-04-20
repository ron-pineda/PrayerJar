import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { NotificationBell } from '@/components/notification-bell';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from '@/components/mobile-nav';
import { UserMenu } from '@/components/user-menu';
import { SignOutButton } from '@/components/sign-out-button';
import { SessionProvider } from '@/components/session-provider';
import { getChurchForUser } from '@/services/church-platform.service';
import { Analytics } from '@vercel/analytics/next';
import { FeedbackWidget } from '@/components/feedback-widget';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { PrayerJarMark } from '@/components/prayer-jar-mark';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prayerjar.org'),
  title: 'Prayer Jar',
  description: 'A global prayer jar — share your heart, intercede for others.',
  icons: {
    icon: '/icon.svg',
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: 'Prayer Jar',
    description: 'A global prayer jar — share your heart, intercede for others.',
    siteName: 'Prayer Jar',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prayer Jar',
    description: 'A global prayer jar — share your heart, intercede for others.',
    images: ['/opengraph-image'],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  const userChurch = session?.user?.id
    ? await getChurchForUser(session.user.id).catch(() => null)
    : null;

  const myChurch = userChurch
    ? { slug: userChurch.church.slug, name: userChurch.church.name, role: userChurch.role }
    : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));}` }} />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <SessionProvider>
        <ThemeProvider>
        <header className="border-b relative z-10">
          <nav aria-label="Main navigation" className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg inline-flex items-center gap-2">
              <PrayerJarMark size={20} />
              <span>Prayer Jar</span>
            </Link>

            {/* Desktop nav — hidden on mobile */}
            <div className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" render={<Link href="/" />}>Prayer Jar</Button>
              <Button variant="ghost" size="sm" render={<Link href="/pray" />}>Pray</Button>
              <Button variant="ghost" size="sm" render={<Link href="/praise-wall" />}>Answered Prayers</Button>
              <Button variant="ghost" size="sm" render={<Link href="/know-jesus" />}>Know Jesus</Button>
              <Button variant="ghost" size="sm" render={<Link href="/find-a-church" />}>Find a Church</Button>
              <ThemeToggle />

              {session ? (
                <>
                  <NotificationBell />
                  <UserMenu
                    userName={session.user?.name}
                    signOutSlot={<SignOutButton />}
                    myChurch={myChurch}
                  />
                </>
              ) : (
                <Button variant="ghost" size="sm" render={<Link href="/sign-in" />}>Sign In</Button>
              )}
            </div>

            {/* Mobile header actions */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              {session ? (
                <>
                  <NotificationBell />
                  <UserMenu
                    userName={session.user?.name}
                    signOutSlot={<SignOutButton />}
                    myChurch={myChurch}
                  />
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
        <PwaInstallPrompt />
        <MobileNav />
        <footer className="border-t mt-auto py-6 px-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} The Prayer Jar</span>
            <nav aria-label="Footer navigation">
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
                <Link href="/for-churches" className="hover:text-foreground transition-colors">For Churches</Link>
                <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
                <Link href="/help" className="hover:text-foreground transition-colors">Help</Link>
                <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                <Link href="/legal/subprocessors" className="hover:text-foreground transition-colors">Sub-processors</Link>
                <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
                <Link href="/give" className="hover:text-foreground transition-colors">Give</Link>
              </div>
            </nav>
          </div>
        </footer>
        </ThemeProvider>
        </SessionProvider>
        <FeedbackWidget />
        <Analytics />
      </body>
    </html>
  );
}
