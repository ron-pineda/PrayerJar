'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check, Copy } from 'lucide-react';

type ShareButtonsProps = {
  url: string;
  text: string;
  variant?: 'inline' | 'bar';
};

export function ShareButtons({ url, text, variant = 'inline' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const [fullUrl, setFullUrl] = useState(url);
  useEffect(() => {
    setFullUrl(`${window.location.origin}${url}`);
  }, [url]);

  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedText = encodeURIComponent(text);

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const buttons = (
    <>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Twitter/X"
      >
        <Button type="button" size="sm" variant="outline" className="h-9 w-9 p-0">
          <span className="text-sm font-bold">𝕏</span>
        </Button>
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
      >
        <Button type="button" size="sm" variant="outline" className="h-9 w-9 p-0">
          <span className="text-sm font-bold">f</span>
        </Button>
      </a>
      <a
        href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
      >
        <Button type="button" size="sm" variant="outline" className="h-9 w-9 p-0">
          <span className="text-sm">💬</span>
        </Button>
      </a>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-9 w-9 p-0"
        onClick={handleCopy}
        aria-label="Copy link"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </>
  );

  if (variant === 'bar') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Share</span>
        {buttons}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Share2 className="h-3.5 w-3.5 text-muted-foreground mr-1" />
      {buttons}
    </div>
  );
}
