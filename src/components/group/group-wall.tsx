'use client';

import { useState, useEffect, useCallback } from 'react';
import { PrayerCard } from '@/components/prayer-card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/empty-state';
import { MessageSquare } from 'lucide-react';
import type { Prayer } from '@/db/schema';

const CATEGORIES = [
  { value: 'health', label: 'Health' },
  { value: 'family', label: 'Family' },
  { value: 'financial', label: 'Financial' },
  { value: 'grief', label: 'Grief' },
  { value: 'gratitude', label: 'Gratitude' },
  { value: 'guidance', label: 'Guidance' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'work_career', label: 'Work / Career' },
  { value: 'spiritual_growth', label: 'Spiritual Growth' },
  { value: 'other', label: 'Other' },
] as const;

interface GroupWallProps {
  groupId: string;
  currentUserId: string;
}

export function GroupWall({ groupId, currentUserId }: GroupWallProps) {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Form state
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const fetchPrayers = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/prayers`);
      if (!res.ok) throw new Error('Failed to load prayers');
      const data = await res.json();
      setPrayers(data.prayers ?? []);
    } catch {
      setFetchError('Could not load group prayers.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setPosting(true);
    setPostError('');

    // Optimistic add — we need the server response for the full prayer object
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/prayers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), category }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPostError(data.error ?? 'Failed to post prayer.');
        return;
      }

      // Prepend new prayer (optimistic-confirmed)
      setPrayers((prev) => [data.prayer, ...prev]);
      setContent('');
      setCategory('other');
    } catch {
      setPostError('Something went wrong. Please try again.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Prayer form */}
      <form onSubmit={handlePost} className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Share a prayer
        </h3>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What would you like the group to pray for?"
          rows={3}
          maxLength={2000}
          disabled={posting}
          required
        />
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={category} onValueChange={(v) => setCategory(v ?? '')} disabled={posting}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={posting || !content.trim()}>
            {posting ? 'Posting…' : 'Post prayer'}
          </Button>
        </div>
        {postError && <p className="text-xs text-destructive">{postError}</p>}
      </form>

      {/* Prayer list */}
      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Loading prayers…</div>
      ) : fetchError ? (
        <div className="py-10 text-center text-sm text-destructive">{fetchError}</div>
      ) : prayers.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={24} />}
          title="No prayers yet"
          description="Be the first to share one."
        />
      ) : (
        <div className="grid gap-4">
          {prayers.map((prayer) => (
            <PrayerCard key={prayer.id} prayer={prayer} isOwnPrayer={prayer.authorId === currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}
