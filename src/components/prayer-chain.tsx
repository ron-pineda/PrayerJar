'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2 } from 'lucide-react';

type Participant = {
  slotHour: number;
  nameInitial: string | null;
  isMine?: boolean;
};

type Props = {
  prayerId: string;
  chainId?: string;
};

function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

export function PrayerChain({ prayerId, chainId: initialChainId }: Props) {
  const [chainId, setChainId] = useState<string | undefined>(initialChainId);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [startingChain, setStartingChain] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!initialChainId);

  const fetchParticipants = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/v1/chains/${id}/participants`);
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants ?? []);
      }
    } catch {
      // silently fail — show existing state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (chainId) {
      fetchParticipants(chainId);
    } else {
      setLoading(false);
    }
  }, [chainId, fetchParticipants]);

  async function handleStartChain() {
    setStartingChain(true);
    setError('');
    try {
      const res = await fetch('/api/v1/chains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prayerId, startsAt: new Date().toISOString() }),
      });
      if (res.ok) {
        const data = await res.json();
        setChainId(data.chain.id);
      } else if (res.status === 401) {
        setError('Sign in to start a prayer chain');
      } else {
        setError('Could not start chain. Please try again.');
      }
    } catch {
      setError('Could not start chain. Please try again.');
    } finally {
      setStartingChain(false);
    }
  }

  async function handleLeaveSlot(slotHour: number) {
    if (!chainId || pendingSlot !== null) return;
    setError('');
    setPendingSlot(slotHour);
    const snapshot = participants;
    setParticipants((prev) => prev.filter((p) => p.slotHour !== slotHour));

    try {
      const res = await fetch(`/api/v1/chains/${chainId}/join`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotHour }),
      });
      if (!res.ok) {
        setParticipants(snapshot);
        setError('Could not release slot. Please try again.');
      } else {
        await fetchParticipants(chainId);
      }
    } catch {
      setParticipants(snapshot);
      setError('Could not release slot. Please try again.');
    } finally {
      setPendingSlot(null);
    }
  }

  async function handleJoinSlot(slotHour: number) {
    if (!chainId || pendingSlot !== null) return;
    setError('');
    setPendingSlot(slotHour);

    // Optimistic fill with a placeholder initial
    const optimisticParticipant: Participant = { slotHour, nameInitial: 'You', isMine: true };
    setParticipants((prev) => [...prev, optimisticParticipant]);

    try {
      const res = await fetch(`/api/v1/chains/${chainId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotHour }),
      });

      if (res.ok) {
        // Slot joined — leave optimistic state in place
      } else if (res.status === 409) {
        // Slot was taken by someone else — revert optimistic, then refetch
        setParticipants((prev) => prev.filter((p) => p !== optimisticParticipant));
        await fetchParticipants(chainId);
      } else if (res.status === 401) {
        setParticipants((prev) => prev.filter((p) => p !== optimisticParticipant));
        setError('Sign in to join a prayer chain slot');
      } else {
        setParticipants((prev) => prev.filter((p) => p !== optimisticParticipant));
        setError('Could not join slot. Please try again.');
      }
    } catch {
      setParticipants((prev) => prev.filter((p) => p !== optimisticParticipant));
      setError('Could not join slot. Please try again.');
    } finally {
      setPendingSlot(null);
    }
  }

  const filledSlots = new Set(participants.map((p) => p.slotHour));
  const coveredCount = filledSlots.size;
  const allFilled = coveredCount === 24;

  // No chain yet
  if (!chainId) {
    return (
      <Card className="border-dashed border-amber-300/60 dark:border-amber-700/40 bg-amber-50/30 dark:bg-amber-950/10">
        <CardContent className="pt-6 pb-6 space-y-4 text-center">
          <div className="flex justify-center">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Cover this prayer 24/7</p>
            <p className="text-sm text-muted-foreground">
              Start a prayer chain — a group of people each commit to a 1-hour slot so
              this prayer is covered around the clock.
            </p>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            onClick={handleStartChain}
            disabled={startingChain}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {startingChain ? 'Starting...' : 'Start a Prayer Chain'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6 text-center">
          <p className="text-sm text-muted-foreground">Loading prayer chain...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={allFilled ? 'border-amber-400 shadow-amber-200/40 shadow-md' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          Prayer Chain
          {allFilled && (
            <span className="ml-auto flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="h-4 w-4" />
              24/7 Covered!
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{coveredCount}/24 hours covered</span>
            <span>{Math.round((coveredCount / 24) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${(coveredCount / 24) * 100}%` }}
            />
          </div>
        </div>

        {allFilled && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-center">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              This prayer is fully covered around the clock.
            </p>
            <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-0.5">
              24 people are each praying one hour of the day. What a gift. 🙏
            </p>
          </div>
        )}

        {/* 24-slot grid */}
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 24 }, (_, hour) => {
            const participant = participants.find((p) => p.slotHour === hour);
            const isFilled = !!participant;
            const isPending = pendingSlot === hour;
            const initial = participant?.nameInitial?.charAt(0).toUpperCase() ?? '';

            if (isFilled) {
              if (participant?.isMine) {
                return (
                  <button
                    key={hour}
                    onClick={() => handleLeaveSlot(hour)}
                    disabled={isPending || pendingSlot !== null}
                    title={`Release your ${formatHour(hour)} slot`}
                    className="flex flex-col items-center gap-0.5 group disabled:opacity-40"
                    aria-label={`Release ${formatHour(hour)} slot`}
                  >
                    <div className="h-9 w-9 rounded-full bg-amber-500 flex items-center justify-center text-xs font-semibold text-white shadow-sm ring-2 ring-amber-300 group-hover:bg-rose-500 group-hover:ring-rose-300 transition-colors">
                      {isPending ? '…' : initial || 'Y'}
                    </div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-none">
                      {formatHour(hour)}
                    </span>
                  </button>
                );
              }
              return (
                <div
                  key={hour}
                  title="Slot taken"
                  className="flex flex-col items-center gap-0.5"
                >
                  <div className="h-9 w-9 rounded-full bg-amber-500 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
                    {initial || '?'}
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-none">
                    {formatHour(hour)}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={hour}
                onClick={() => handleJoinSlot(hour)}
                disabled={isPending || pendingSlot !== null || allFilled}
                title={`Take the ${formatHour(hour)} slot`}
                className={[
                  'flex flex-col items-center gap-0.5 group',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                ].join(' ')}
                aria-label={`Claim ${formatHour(hour)} slot`}
              >
                <div
                  className={[
                    'h-9 w-9 rounded-full border-2 flex items-center justify-center',
                    'text-xs text-muted-foreground',
                    'border-muted transition-colors duration-150',
                    isPending
                      ? 'border-amber-400 bg-amber-100 dark:bg-amber-900/30'
                      : 'group-hover:border-amber-400 group-hover:bg-amber-50 dark:group-hover:bg-amber-950/20',
                  ].join(' ')}
                >
                  +
                </div>
                <span className="text-[10px] text-muted-foreground leading-none">
                  {formatHour(hour)}
                </span>
              </button>
            );
          })}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <p className="text-xs text-muted-foreground text-center">
          Tap an empty slot to commit, or tap your own slot to release it.
        </p>
      </CardContent>
    </Card>
  );
}
