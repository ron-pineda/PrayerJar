"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface RecommendFormProps {
  placeId: string;
  existingDenomination?: string | null;
  onSuccess: () => void;
}

export function RecommendForm({ placeId, existingDenomination, onSuccess }: RecommendFormProps) {
  const [worshipStyle, setWorshipStyle] = useState("");
  const [denomination, setDenomination] = useState(existingDenomination ?? "");
  const [note, setNote] = useState("");
  const [newcomerFriendly, setNewcomerFriendly] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitted" | "under_review">("idle");

  async function handleSubmit() {
    if (!note.trim() || newcomerFriendly === null) return;
    setSubmitting(true);
    const res = await fetch(`/api/v1/churches/${placeId}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ denomination, worshipStyle, note, newcomerFriendly }),
    });
    const data = await res.json();
    setStatus(data.status === "under_review" ? "under_review" : "submitted");
    setSubmitting(false);
    if (data.submitted) onSuccess();
  }

  if (status === "submitted") {
    return <p className="text-emerald-400 text-sm">Thanks! Your recommendation has been added.</p>;
  }

  if (status === "under_review") {
    return <p className="text-amber-400 text-sm">Your recommendation is being reviewed.</p>;
  }

  return (
    <div className="space-y-3">
      <Select value={worshipStyle} onValueChange={(v) => setWorshipStyle(v ?? "")}>
        <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-300">
          <SelectValue placeholder="What's the worship style like?" />
        </SelectTrigger>
        <SelectContent>
          {["Contemporary", "Traditional", "Blended", "Other"].map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 200))}
        placeholder="What do you love about this church?"
        className="bg-slate-900 border-slate-700 text-slate-100 text-sm resize-none"
        rows={3}
      />
      <p className="text-slate-500 text-xs text-right">{note.length}/200</p>

      <div>
        <p className="text-slate-400 text-sm mb-2">Would you recommend it to newcomers?</p>
        <div className="flex gap-2">
          {([true, false] as const).map((v) => (
            <button
              key={String(v)}
              onClick={() => setNewcomerFriendly(v)}
              className={`px-4 py-1.5 rounded text-sm ${
                newcomerFriendly === v
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 border border-slate-700 text-slate-400"
              }`}
            >
              {v ? "Yes" : "No"}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting || !note.trim() || newcomerFriendly === null}
        className="w-full"
      >
        {submitting ? "Submitting..." : "Share Recommendation"}
      </Button>
    </div>
  );
}
