import Link from 'next/link';
import { NavItem } from './NavItem';
import { SidebarDrawer } from './SidebarDrawer';
import { PLANS, TIER_RANK } from '@/lib/plans';
import type { PlanTier } from '@/lib/plans';

interface Props {
  slug: string;
  churchName: string;
  tier: PlanTier;
  userName: string | null;
}

// null entries render as dividers
const NAV_ITEMS: Array<{
  label: string;
  hrefFn: (slug: string) => string;
  minTier: PlanTier;
  exact?: boolean;
} | null> = [
  { label: 'Prayer Wall',      hrefFn: (s) => `/church/${s}/wall`,                  minTier: 'free'     },
  { label: 'Prayer Team',      hrefFn: (s) => `/church/${s}/dashboard/team`,         minTier: 'free'     },
  { label: 'Events',           hrefFn: (s) => `/church/${s}/events`,                 minTier: 'free'     },
  null,
  { label: 'Dashboard',        hrefFn: (s) => `/church/${s}/dashboard`,              minTier: 'starter', exact: true },
  { label: 'Care Inbox',       hrefFn: (s) => `/church/${s}/dashboard/care`,         minTier: 'starter'  },
  { label: 'Flagged Prayers',  hrefFn: (s) => `/church/${s}/dashboard/flagged`,      minTier: 'starter'  },
  null,
  { label: 'Analytics',        hrefFn: (s) => `/church/${s}/dashboard/analytics`,   minTier: 'pro'      },
  { label: 'Branding',         hrefFn: (s) => `/church/${s}/dashboard/branding`,    minTier: 'pro'      },
  { label: 'Testimony Queue',  hrefFn: (s) => `/church/${s}/dashboard/testimony`,   minTier: 'pro'      },
  null,
  { label: 'Settings',         hrefFn: (s) => `/church/${s}/settings`,              minTier: 'free'     },
];

function churchInitialColor(name: string): string {
  const palette = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-teal-100 text-teal-700',
  ];
  return palette[name.charCodeAt(0) % palette.length];
}

function SidebarContent({ slug, churchName, tier, userName }: Props) {
  return (
    <div className="flex h-full w-60 flex-col bg-card border-r">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b px-4 py-4 min-w-0">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${churchInitialColor(churchName)}`}
          aria-hidden="true"
        >
          {churchName[0].toUpperCase()}
        </div>
        <span className="truncate text-sm font-semibold">{churchName}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Church admin navigation">
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item, i) =>
            item === null ? (
              <div key={i} className="my-1 border-t" role="separator" />
            ) : (
              <NavItem
                key={item.hrefFn(slug)}
                href={item.hrefFn(slug)}
                label={item.label}
                locked={TIER_RANK[tier] < TIER_RANK[item.minTier]}
                tierName={PLANS[item.minTier].name}
                exact={item.exact}
              />
            )
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-4 text-xs text-muted-foreground flex flex-col gap-1">
        {userName && (
          <p className="truncate text-sm font-medium text-foreground">{userName}</p>
        )}
        <Link href="/" className="hover:text-foreground transition-colors">
          ← Back to PrayerJar
        </Link>
      </div>
    </div>
  );
}

export function ChurchSidebar({ slug, churchName, tier, userName }: Props) {
  const content = <SidebarContent slug={slug} churchName={churchName} tier={tier} userName={userName} />;

  return (
    <>
      {/* Desktop: sticky left rail below global header */}
      <aside
        className="hidden lg:flex shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] self-start"
        aria-label="Church admin sidebar"
      >
        {content}
      </aside>

      {/* Mobile: drawer trigger + overlay */}
      <SidebarDrawer churchName={churchName}>
        {content}
      </SidebarDrawer>
    </>
  );
}
