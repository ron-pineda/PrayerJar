'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PrayerDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function PrayerDeleteDialog({ open, onOpenChange, onConfirm }: PrayerDeleteDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setPending(true);
    setError('');
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      setError('Could not delete. Please try again.');
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete prayer request</DialogTitle>
          <DialogDescription>Are you sure? This can&apos;t be undone.</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
