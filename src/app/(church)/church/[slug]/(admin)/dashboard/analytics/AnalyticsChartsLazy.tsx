'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type AnalyticsChartsComponent from './AnalyticsCharts';

// recharts is ~370KB and only ever renders on this admin route. Deferring it
// with ssr:false lets the analytics page shell (header, description) paint
// immediately while the charts stream in behind a skeleton. ssr:false requires
// a client boundary, which is why this thin wrapper exists.
const AnalyticsCharts = dynamic(() => import('./AnalyticsCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid gap-6 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-64 rounded-xl border bg-muted/40 animate-pulse" />
      ))}
    </div>
  ),
});

export default function AnalyticsChartsLazy(
  props: ComponentProps<typeof AnalyticsChartsComponent>,
) {
  return <AnalyticsCharts {...props} />;
}
