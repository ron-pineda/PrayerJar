'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';

type ActionFn = (prev: unknown, formData: FormData) => Promise<{ success: boolean }>;

interface SettingsFormProps {
  action: ActionFn;
  submitLabel: string;
  children: React.ReactNode;
}

export function SettingsForm({ action, submitLabel, children }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {children}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : submitLabel}
        </Button>
        {state?.success && (
          <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
        )}
      </div>
    </form>
  );
}
