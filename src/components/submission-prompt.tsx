'use client';

import { useState, useEffect, useCallback } from 'react';

const PROMPTS = [
  "I'm going through something hard and don't know where to turn...",
  'My family is struggling and I need strength...',
  "I'm anxious about something I can't control...",
  'Someone I love is sick and I need hope...',
  "I'm facing a decision that feels impossible...",
  "I've been feeling alone and unseen...",
  "I'm grateful but also scared about what comes next...",
  'There is someone in my life who is hurting and I feel helpless...',
  "I've been carrying this weight for so long and I'm tired...",
  'I need wisdom for something I keep getting wrong...',
  'My heart is broken and I need to know it can heal...',
  "I don't have the words — I just know I need prayer right now...",
];

type SubmissionPromptProps = {
  onSelect: (prompt: string) => void;
};

export function SubmissionPrompt({ onSelect }: SubmissionPromptProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const advance = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setIndex((i) => (i + 1) % PROMPTS.length);
      setVisible(true);
    }, 300);
  }, []);

  useEffect(() => {
    const id = setInterval(advance, 4500);
    return () => clearInterval(id);
  }, [advance]);

  function handleClick() {
    onSelect(PROMPTS[index]);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-left group"
      aria-label="Use this prompt"
    >
      <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3 transition-colors hover:border-muted-foreground/60 hover:bg-muted/50">
        <p
          className="text-sm text-muted-foreground italic leading-relaxed transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {PROMPTS[index]}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground/60 group-hover:text-muted-foreground/80 transition-colors">
          tap to use this
        </p>
      </div>
    </button>
  );
}
