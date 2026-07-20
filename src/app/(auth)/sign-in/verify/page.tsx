import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export const metadata = { title: 'Check your email | The Prayer Jar' };

// NextAuth's verifyRequest page. Lives at a clean path (no query) because
// NextAuth appends ?provider=...&type=... with a bare `?`, which corrupts a
// pages entry that already carries a query string.
export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
            <Mail className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a sign-in link to your email. Click the link to sign in — it expires in 10 minutes.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
