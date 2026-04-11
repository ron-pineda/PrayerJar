import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Export Your Data | The Prayer Jar' };

export default async function ExportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold">Export Your Data</h1>

      <Card>
        <CardHeader>
          <CardTitle>Download My Data</CardTitle>
          <CardDescription>
            Download all your PrayerJar data as a JSON file in compliance with GDPR/CCPA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your export includes prayers, interactions, badges, and account details.
          </p>
          <Button asChild>
            <a href="/api/v1/export">Download My Data</a>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
