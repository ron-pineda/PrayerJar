/**
 * Production startup assertions.
 * This module is imported as a side-effect from src/lib/auth.ts so it is
 * always evaluated at boot and never tree-shaken.
 */

if (process.env.NODE_ENV === 'production') {
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  if (admins.length === 0) {
    throw new Error('ADMIN_EMAILS must be set in production');
  }
}
