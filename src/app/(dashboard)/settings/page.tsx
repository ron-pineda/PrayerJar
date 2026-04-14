import type { Metadata } from 'next';
import { auth } from '@/lib/auth';

export const metadata: Metadata = { title: 'Settings | The Prayer Jar' };
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  updateEmailPreferenceAction,
  updateNotificationTypesAction,
  updateQuietHoursAction,
} from '@/app/actions/settings.actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SettingsForm } from '@/components/settings-form';
import { DeleteAccountDialog } from '@/components/delete-account-dialog';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const HOURS_12H = Array.from({ length: 24 }, (_, i) => {
  const period = i < 12 ? 'AM' : 'PM';
  const h = i % 12 === 0 ? 12 : i % 12;
  return { value: i, label: `${h}:00 ${period}` };
});

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) redirect('/sign-in');

  const quietEnabled = user.quietHoursStart !== null && user.quietHoursEnd !== null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose how often you want to receive email updates about your prayers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm action={updateEmailPreferenceAction} submitLabel="Save preferences">
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
          </SettingsForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which events trigger notifications for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm action={updateNotificationTypesAction} submitLabel="Save preferences">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnPrayed">Someone prays for your request</Label>
                <Switch
                  id="notifyOnPrayed"
                  name="notifyOnPrayed"
                  defaultChecked={user.notifyOnPrayed}
                  uncheckedValue="off"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnMessage">Someone leaves you a message</Label>
                <Switch
                  id="notifyOnMessage"
                  name="notifyOnMessage"
                  defaultChecked={user.notifyOnMessage}
                  uncheckedValue="off"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnBadge">You earn a badge</Label>
                <Switch
                  id="notifyOnBadge"
                  name="notifyOnBadge"
                  defaultChecked={user.notifyOnBadge}
                  uncheckedValue="off"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnDigest">Weekly digest</Label>
                <Switch
                  id="notifyOnDigest"
                  name="notifyOnDigest"
                  defaultChecked={user.notifyOnDigest}
                  uncheckedValue="off"
                />
              </div>
            </div>
          </SettingsForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Suppress notifications during a time window so you are not disturbed while sleeping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm action={updateQuietHoursAction} submitLabel="Save quiet hours">
            <div className="flex items-center justify-between">
              <Label htmlFor="quietHoursEnabled">Enable quiet hours</Label>
              <Switch
                id="quietHoursEnabled"
                name="quietHoursEnabled"
                defaultChecked={quietEnabled}
                uncheckedValue="off"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quietHoursStart">From</Label>
                <Select
                  name="quietHoursStart"
                  defaultValue={user.quietHoursStart !== null ? String(user.quietHoursStart) : '22'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS_12H.map((h) => (
                      <SelectItem key={h.value} value={String(h.value)}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quietHoursEnd">To</Label>
                <Select
                  name="quietHoursEnd"
                  defaultValue={user.quietHoursEnd !== null ? String(user.quietHoursEnd) : '7'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS_12H.map((h) => (
                      <SelectItem key={h.value} value={String(h.value)}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quietHoursTimezone">Timezone</Label>
                <Select
                  name="quietHoursTimezone"
                  defaultValue={user.quietHoursTimezone ?? 'America/New_York'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingsForm>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog />
        </CardContent>
      </Card>
    </main>
  );
}
