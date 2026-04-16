'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PrayerEditDialogProps {
  prayer: {
    content: string;
    isUrgent: boolean;
    isAnonymous: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { content: string; urgent: boolean; anonymous: boolean }) => Promise<void>;
}

export function PrayerEditDialog({
  prayer,
  open,
  onOpenChange,
  onSave,
}: PrayerEditDialogProps) {
  const [content, setContent] = useState(prayer.content);
  const [urgent, setUrgent] = useState(prayer.isUrgent);
  const [anonymous, setAnonymous] = useState(prayer.isAnonymous);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      // Reset to original values on close
      setContent(prayer.content);
      setUrgent(prayer.isUrgent);
      setAnonymous(prayer.isAnonymous);
      setError('');
    }
    onOpenChange(nextOpen);
  }

  async function handleSave() {
    setPending(true);
    setError('');
    try {
      await onSave({ content, urgent, anonymous });
      setPending(false);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save. Please try again.');
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit prayer request</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Your prayer request..."
          />
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
              />
              Urgent
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              Anonymous
            </label>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
