'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  partnershipId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface MessageThreadProps {
  partnershipId: string;
  currentUserId: string;
  partnerName: string;
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export function MessageThread({ partnershipId, currentUserId, partnerName }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/partner-messages?partnershipId=${encodeURIComponent(partnershipId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setMessages(data.messages ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load messages.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [partnershipId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    // Optimistic update
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      partnershipId,
      senderId: currentUserId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/v1/partner-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnershipId, content: trimmed }),
      });

      if (!res.ok) {
        throw new Error('Send failed');
      }

      const data = await res.json();
      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? data.message : m))
      );
    } catch {
      // Revert optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const remaining = 500 - input.length;

  return (
    <div className="flex flex-col h-[420px] rounded-xl border bg-background overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <p className="text-sm font-medium">Encouragement Exchange</p>
        <p className="text-xs text-muted-foreground">
          Messages are private between you and {partnerName}.
        </p>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading && (
          <div className="flex justify-center py-8">
            <span className="text-sm text-muted-foreground">Loading messages…</span>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-sm text-muted-foreground">No messages yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Send an encouragement to your prayer partner!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          const initial = isOwn ? 'Y' : getInitial(partnerName);
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isOwn
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                }`}
              >
                {initial}
              </div>

              {/* Bubble */}
              <div className={`max-w-[72%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  } ${msg.id.startsWith('optimistic-') ? 'opacity-60' : ''}`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">
                  {relativeTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}

        {error && (
          <p className="text-xs text-destructive text-center py-1">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t px-3 py-2 bg-background">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= 500) setInput(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Write an encouragement… (Enter to send)"
              className="resize-none min-h-[40px] max-h-[120px] pr-12 text-sm py-2"
              disabled={sending}
            />
            <span
              className={`absolute bottom-2 right-2 text-[10px] ${
                remaining <= 50 ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {remaining}
            </span>
          </div>
          <Button
            size="icon-sm"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="mb-0.5"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
