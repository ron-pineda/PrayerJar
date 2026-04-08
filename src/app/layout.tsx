import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { NotificationBell } from '@/components/notification-bell';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Prayer Jar',
  description: 'A global prayer jar — share your heart, intercede for others.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="border-b">
          <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">
              🫙 Prayer Jar
            </Link>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/pray">Pray</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/praise-wall">Praise Wall</Link>
              </Button>

              {session ? (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/my-prayers">My Prayers</Link>
                  </Button>
                  <NotificationBell />
                  <form action={async () => { 'use server'; await signOut(); }}>
                    <Button variant="ghost" size="sm" type="submit">Sign Out</Button>
                  </form>
                </>
              ) : (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              )}
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
