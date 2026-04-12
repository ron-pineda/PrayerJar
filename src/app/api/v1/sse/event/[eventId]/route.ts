import { NextRequest } from 'next/server';
import { getEvent, getEventPrayers } from '@/services/event.service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;

  const event = await getEvent(eventId);
  if (!event) {
    return new Response('Not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      async function send() {
        if (closed) return;
        try {
          const pending = await getEventPrayers(eventId, { status: 'pending', limit: 20 });
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'pending', prayers: pending })}\n\n`),
          );
        } catch {
          // Skip failed polls; client retains last known state
        }
      }

      await send();
      const interval = setInterval(send, 3000);

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
