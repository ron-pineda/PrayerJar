'use client';

import { useEffect, useState } from 'react';

export function InAppBrowserWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isInApp = /FBAN|FBAV|Instagram|Twitter|LinkedInApp|Line\//.test(ua);
    setShow(isInApp);
  }, []);

  if (!show) return null;

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
      <p className="font-medium">Google sign-in may not work here</p>
      <p className="mt-1 text-xs opacity-80">
        You&apos;re in an app browser. For Google sign-in, open{' '}
        <strong>prayerjar.org</strong> in Safari or Chrome instead.
        Or use your email address below — that always works.
      </p>
    </div>
  );
}
