'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
}

export function ExpandableText({ text, maxLines = 4, className }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const check = () => setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, expanded]);

  return (
    <div className={cn('space-y-1', className)}>
      <p
        ref={textRef}
        className={cn('text-sm leading-relaxed', !expanded && 'overflow-hidden')}
        style={
          !expanded
            ? {
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
            : undefined
        }
      >
        {text}
      </p>
      {(isTruncated || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
