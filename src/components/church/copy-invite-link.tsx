"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  inviteUrl: string;
}

export function CopyInviteLink({ inviteUrl }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input text
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        readOnly
        value={inviteUrl}
        className="flex-1 bg-muted text-sm font-mono"
        onFocus={(e) => e.currentTarget.select()}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="shrink-0 min-w-[80px]"
      >
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}
