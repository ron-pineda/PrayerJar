import { formatDistanceToNow } from 'date-fns';
import type { ActivityItem } from '@/services/group.service';

const TYPE_CONFIG = {
  prayer_posted: {
    icon: '✏️',
    label: (name: string, content?: string) =>
      `${name} posted a prayer${content ? ` — "${content.slice(0, 40)}${content.length > 40 ? '…' : ''}"` : ''}`,
  },
  prayer_answered: {
    icon: '✨',
    label: (name: string, content?: string) =>
      `${name} marked a prayer answered${content ? ` — "${content.slice(0, 40)}${content.length > 40 ? '…' : ''}"` : ''}`,
  },
  member_joined: {
    icon: '👋',
    label: (name: string) => `${name} joined the group`,
  },
} as const;

interface GroupActivityProps {
  activity: ActivityItem[];
}

export function GroupActivity({ activity }: GroupActivityProps) {
  if (activity.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No activity yet.
      </div>
    );
  }

  return (
    <ol className="relative border-l border-border ml-3 space-y-0">
      {activity.map((item, i) => {
        const config = TYPE_CONFIG[item.type];
        const name = item.userName ?? 'Someone';
        const label = config.label(name, item.prayerContent);
        const ago = formatDistanceToNow(item.date, { addSuffix: true });

        return (
          <li key={i} className="mb-6 ml-6">
            {/* Timeline dot */}
            <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full bg-muted border border-border text-sm">
              {config.icon}
            </span>
            <p className="text-sm text-foreground">{label}</p>
            <time className="text-xs text-muted-foreground">{ago}</time>
          </li>
        );
      })}
    </ol>
  );
}
