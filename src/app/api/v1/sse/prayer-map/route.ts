import { NextRequest } from 'next/server';
import { db } from '@/db';
import { prayerInteractions, prayers } from '@/db/schema';
import { isNotNull, gte, eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      async function send() {
        if (closed) return;
        try {
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          const rows = await db
            .select({
              id: prayerInteractions.id,
              latitude: prayerInteractions.latitude,
              longitude: prayerInteractions.longitude,
              country: prayerInteractions.country,
              createdAt: prayerInteractions.createdAt,
              category: prayers.category,
            })
            .from(prayerInteractions)
            .innerJoin(prayers, eq(prayerInteractions.prayerId, prayers.id))
            .where(
              and(
                gte(prayerInteractions.createdAt, fiveMinutesAgo),
                isNotNull(prayerInteractions.latitude),
                isNotNull(prayerInteractions.longitude)
              )
            );
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ points: rows })}\n\n`));
        } catch {
          // Skip failed polls; client retains last known state
        }
      }

      await send();
      const interval = setInterval(send, 3000);

      // Clean up on client disconnect — prevents interval leak
      req.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(interval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
