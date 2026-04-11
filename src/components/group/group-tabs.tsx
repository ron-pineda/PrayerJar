'use client';

import { useState } from 'react';

interface GroupTabsProps {
  prayersTab: React.ReactNode;
  activityTab: React.ReactNode;
}

export function GroupTabs({ prayersTab, activityTab }: GroupTabsProps) {
  const [active, setActive] = useState<'prayers' | 'activity'>('prayers');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b mb-6">
        {(['prayers', 'activity'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              active === tab
                ? 'border-amber-500 text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {active === 'prayers' ? prayersTab : activityTab}
      </div>
    </div>
  );
}
