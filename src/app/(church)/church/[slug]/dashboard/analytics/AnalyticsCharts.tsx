'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PRIMARY = '#d4a843';

interface TrendPoint {
  date: string;
  count: number;
}

interface CategoryPoint {
  category: string;
  count: number;
}

interface AnalyticsChartsProps {
  prayerTrend: TrendPoint[];
  interactionTrend: TrendPoint[];
  categoryBreakdown: CategoryPoint[];
  memberGrowth: TrendPoint[];
  answeredRate: { total: number; answered: number; rate: number };
}

export default function AnalyticsCharts({
  prayerTrend,
  interactionTrend,
  categoryBreakdown,
  memberGrowth,
  answeredRate,
}: AnalyticsChartsProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Row 1: Prayer trend + Interaction trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Prayer Activity (30 days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={prayerTrend} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => v.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} width={28} allowDecimals={false} />
              <Tooltip
                labelFormatter={(v: string) => `Date: ${v}`}
                formatter={(v: number) => [v, 'Prayers']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={PRIMARY}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Interactions (30 days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={interactionTrend} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => v.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} width={28} allowDecimals={false} />
              <Tooltip
                labelFormatter={(v: string) => `Date: ${v}`}
                formatter={(v: number) => [v, 'Interactions']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={PRIMARY}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Category breakdown + Member growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Prayer Categories (active)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={categoryBreakdown}
              margin={{ top: 4, right: 8, bottom: 40, left: 0 }}
            >
              <XAxis
                dataKey="category"
                tick={{ fontSize: 9 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 10 }} width={28} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [v, 'Prayers']} />
              <Bar dataKey="count" fill={PRIMARY} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Member Growth (30 days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={memberGrowth} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => v.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} width={28} allowDecimals={false} />
              <Tooltip
                labelFormatter={(v: string) => `Date: ${v}`}
                formatter={(v: number) => [v, 'New members']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={PRIMARY}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Answered rate stat card */}
      <div className="rounded-lg border bg-card p-6 flex flex-col items-center gap-2 max-w-xs">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          Answered Rate
        </span>
        <span className="text-5xl font-bold" style={{ color: PRIMARY }}>
          {answeredRate.rate}%
        </span>
        <span className="text-sm text-muted-foreground">
          {answeredRate.answered} of {answeredRate.total} prayers answered
        </span>
      </div>
    </div>
  );
}
