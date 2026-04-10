"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface SaveChurchButtonProps {
  placeId: string;
  name: string;
  address: string;
  initialSaved: boolean;
}

export function SaveChurchButton({ placeId, name, address, initialSaved }: SaveChurchButtonProps) {
  const [saved, setSaved] = useState(initialSaved);

  async function toggle() {
    const method = saved ? "DELETE" : "POST";
    const res = await fetch(`/api/v1/churches/${placeId}/save`, {
      method,
      headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
      body: method === "POST" ? JSON.stringify({ name, address }) : undefined,
    });
    if (res.ok) {
      setSaved(!saved);
    } else if (res.status === 401) {
      toast.error("Sign in to save churches");
    } else {
      toast.error("Couldn't save this church. Please try again.");
    }
  }

  return (
    <button onClick={toggle} aria-label="Save church" className="text-slate-400 hover:text-rose-400">
      <Heart className={`h-5 w-5 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
    </button>
  );
}
