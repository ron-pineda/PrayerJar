import { getChurchBySlug } from '@/services/church-platform.service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ churchSlug: string }> },
) {
  const { churchSlug } = await params;

  const church = await getChurchBySlug(churchSlug);
  if (!church) {
    return new Response('Church not found', { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prayerjar.org';

  // Sanitise values interpolated into the JS snippet
  const safeName = church.name.replace(/'/g, "\\'").replace(/\\/g, '\\\\');
  const safeSlug = encodeURIComponent(churchSlug);

  const snippet = `(function() {
  var iframe = document.createElement('iframe');
  iframe.src = '${siteUrl}/embed/${safeSlug}/widget';
  iframe.style.cssText = 'width:100%;height:400px;border:none;border-radius:8px;';
  iframe.title = 'Prayer Jar \u2014 ${safeName}';
  document.currentScript.parentNode.insertBefore(iframe, document.currentScript);
})();`;

  return new Response(snippet, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
