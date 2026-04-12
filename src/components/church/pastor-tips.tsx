interface PastorTipsProps {
  variant?: 'general' | 'event';
}

const GENERAL_TIPS = [
  'Pray for the prayers — your team reading and praying over each request is the core of this ministry.',
  'Celebrate answered prayers — when someone marks a prayer answered, acknowledge it in your next service.',
  'Protect your team — use the flagged prayers dashboard to catch anything that needs pastoral care before it reaches the congregation.',
  'Consistency beats intensity — a daily 10-minute prayer review is more sustainable than a marathon session once a week.',
];

const EVENT_TIPS = [
  'Preview before you project — test the display page and all three modes before the event starts.',
  'Have a backup moderator — assign a second admin to help approve prayers during high-volume moments.',
  'Spotlight intentionally — use the spotlight mode for a powerful moment of unified prayer, not just the most recent submission.',
  'Follow up after — the post-event report CSV is great for your pastoral care team\'s follow-up calls.',
];

export function PastorTips({ variant = 'general' }: PastorTipsProps) {
  const tips = variant === 'event' ? EVENT_TIPS : GENERAL_TIPS;

  return (
    <div className="rounded-lg border bg-amber-950/10 border-amber-900/20 p-6">
      <h2 className="text-base font-semibold mb-4">Pastor's Corner</h2>
      <ul className="flex flex-col gap-3">
        {tips.map((tip, i) => (
          <li key={i} className="flex gap-3 text-sm text-muted-foreground">
            <span className="mt-0.5 shrink-0 text-amber-600">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
