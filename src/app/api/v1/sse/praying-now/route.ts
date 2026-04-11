import { NextRequest } from 'next/server';
import { db } from '@/db';
import { prayerInteractions } from '@/db/schema';
import { count, gte } from 'drizzle-orm';

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
            .select({ count: count() })
            .from(prayerInteractions)
            .where(gte(prayerInteractions.createdAt, fiveMinutesAgo));
          const c = Number(rows[0]?.count ?? 0);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count: c })}\n\n`));
        } catch {
          // Skip failed polls; client retains last known count
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
