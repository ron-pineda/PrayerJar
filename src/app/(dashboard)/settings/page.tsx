import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateEmailPreferenceAction } from '@/app/actions/settings.actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) redirect('/sign-in');

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose how often you want to receive email updates about your prayers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateEmailPreferenceAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailPreference">Email frequency</Label>
              <Select name="emailPreference" defaultValue={user.emailPreference}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off — no emails</SelectItem>
                  <SelectItem value="realtime">Real-time (max 1 per 15 min)</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="weekly">Weekly digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Save preferences</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
