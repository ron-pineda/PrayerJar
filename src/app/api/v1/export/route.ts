import { auth } from '@/lib/auth';
import { exportUserData } from '@/services/export.service';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await exportUserData(session.user.id);

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="prayerjar-export-${Date.now()}.json"`,
    },
  });
}
