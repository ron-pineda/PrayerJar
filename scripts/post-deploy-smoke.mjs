// scripts/post-deploy-smoke.mjs
const BASE = process.env.SMOKE_BASE_URL ?? 'https://prayerjar.org';

const ROUTES = [
  '/', '/pray', '/browse', '/praise-wall', '/find-a-church', '/know-jesus',
  '/about', '/privacy', '/terms', '/contact', '/sign-in', '/docs', '/for-churches',
  '/give', '/press', '/partners', '/help', '/map',
];

const failures = [];
for (const route of ROUTES) {
  const url = `${BASE}${route}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    if (res.status >= 500 || res.status === 404) {
      failures.push(`${route} -> ${res.status}`);
    }
    console.log(`${res.status.toString().padEnd(4)} ${route}`);
  } catch (err) {
    failures.push(`${route} -> ${err.message}`);
  }
}

if (failures.length) {
  console.error('\nSmoke FAILED:', failures);
  process.exit(1);
}
console.log(`\nOK: all ${ROUTES.length} routes reachable`);
