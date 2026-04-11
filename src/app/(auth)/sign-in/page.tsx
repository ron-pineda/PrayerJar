import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export const metadata = { title: "Sign In | The Prayer Jar" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ verify?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;

  if (params.verify) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="text-4xl mb-2">📬</div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a sign-in link to your email. Click the link to sign in — it expires in 10 minutes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Branding */}
        <div className="text-center">
          <Link href="/" className="text-4xl">🫙</Link>
          <h1 className="text-2xl font-bold tracking-tight mt-3">The Prayer Jar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A global place to share your heart and intercede for others.
          </p>
        </div>

        {/* Sign-in card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a sign-in link — no password needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData: FormData) => {
                'use server';
                await signIn('nodemailer', formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">Send sign-in link</Button>
            </form>
          </CardContent>
        </Card>

        {/* Trust signals */}
        <p className="text-xs text-center text-muted-foreground leading-relaxed">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>.
          We&apos;ll never share your email.
        </p>
      </div>
    </div>
  );
}
