"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type LinkAction = { label: string; href: string };

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Either a link-button descriptor or an arbitrary node (e.g. a dialog trigger). */
  action?: LinkAction | React.ReactNode;
}

function isLinkAction(action: unknown): action is LinkAction {
  return (
    typeof action === "object" &&
    action !== null &&
    "href" in action &&
    "label" in action
  );
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      <p className="mb-5 max-w-xs text-sm text-muted-foreground">{description}</p>
      {action != null &&
        (isLinkAction(action) ? (
          <Button render={<Link href={action.href} />}>{action.label}</Button>
        ) : (
          action
        ))}
    </div>
  );
}
