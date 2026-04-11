"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      <p className="mb-5 max-w-xs text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button render={<Link href={action.href} />}>{action.label}</Button>
      )}
    </div>
  );
}
