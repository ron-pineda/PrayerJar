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
import { PhotoUpload } from '@/components/photo-upload';
import { VideoRecorder } from '@/components/video-recorder';

interface PrayerTestimonyDialogProps {
  prayerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    testimony: string;
    imageUrl: string | null;
    videoUrl: string | null;
    videoDurationSeconds: number | null;
  }) => Promise<void>;
}

export function PrayerTestimonyDialog({
  prayerId: _prayerId,
  open,
  onOpenChange,
  onConfirm,
}: PrayerTestimonyDialogProps) {
  const [testimony, setTestimony] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setTestimony('');
      setImageUrl(null);
      setVideoUrl(null);
      setVideoDurationSeconds(null);
      setError('');
    }
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    setPending(true);
    setError('');
    try {
      await onConfirm({ testimony, imageUrl, videoUrl, videoDurationSeconds });
      setPending(false);
      onOpenChange(false);
    } catch {
      setError('Failed to save testimony. Please try again.');
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share your testimony</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            name="testimony"
            value={testimony}
            onChange={(e) => setTestimony(e.target.value)}
            placeholder="Share how God answered this prayer... (optional)"
            rows={3}
            maxLength={2000}
          />
          <PhotoUpload
            url={imageUrl}
            onUpload={setImageUrl}
            onRemove={() => setImageUrl(null)}
            variant="warm"
          />
          <VideoRecorder
            url={videoUrl}
            onUpload={(url, secs) => {
              setVideoUrl(url);
              setVideoDurationSeconds(secs);
            }}
            onRemove={() => {
              setVideoUrl(null);
              setVideoDurationSeconds(null);
            }}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={pending}>
            {pending ? 'Saving...' : 'Share This Testimony'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
