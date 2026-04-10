"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChurchResult } from "@/services/church.service";

interface ChurchCardProps {
  church: ChurchResult;
  isHighlighted: boolean;
  onHover: (placeId: string | null) => void;
  onCardClick: (placeId: string) => void;
  isLoggedIn: boolean;
}

export function ChurchCard({
  church,
  isHighlighted,
  onHover,
  onCardClick,
  isLoggedIn,
}: ChurchCardProps) {
  const [saved, setSaved] = useState(church.savedByUser);
  const [savePending, setSavePending] = useState(false);

  const isEnriched = church.claim !== null || church.recommendations.length > 0;
  const isVerified = church.claim?.verified === true;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(church.address)}&destination_place_id=${church.placeId}`;

  async function toggleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn || savePending) return;
    setSavePending(true);
    const method = saved ? "DELETE" : "POST";
    const res = await fetch(`/api/v1/churches/${church.placeId}/save`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST"
        ? JSON.stringify({ name: church.name, address: church.address })
        : undefined,
    });
    if (res.ok) setSaved(!saved);
    setSavePending(false);
  }

  return (
    <div
      onClick={() => onCardClick(church.placeId)}
      onMouseEnter={() => onHover(church.placeId)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "bg-slate-800 rounded-xl p-4 cursor-pointer border transition-colors",
        isHighlighted ? "border-blue-500" : "border-slate-700",
        isEnriched && "border-l-[3px] border-l-emerald-500"
      )}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-100 font-semibold text-[15px] truncate">{church.name}</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            {church.distanceMiles.toFixed(1)} mi · {church.address}
          </p>
        </div>
        {isLoggedIn && (
          <button onClick={toggleSave} disabled={savePending} className="ml-2 text-slate-400 hover:text-rose-400 transition-colors">
            <Heart className={cn("h-4 w-4", saved && "fill-rose-500 text-rose-500")} />
          </button>
        )}
      </div>

      {/* Tags — enriched only */}
      {isEnriched && (
        <div className="flex gap-1.5 flex-wrap mt-2 mb-2">
          {isVerified && (
            <span className="bg-emerald-950 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-900">
              ✓ Community Verified
            </span>
          )}
          {church.claim?.denomination && (
            <span className="bg-blue-950 text-blue-300 text-[10px] px-2 py-0.5 rounded">{church.claim.denomination}</span>
          )}
          {church.claim?.worshipStyle && (
            <span className="bg-blue-950 text-blue-300 text-[10px] px-2 py-0.5 rounded">{church.claim.worshipStyle}</span>
          )}
          {church.newcomerFriendly && (
            <span className="bg-amber-950 text-amber-400 text-[10px] px-2 py-0.5 rounded">👋 Newcomer Friendly</span>
          )}
        </div>
      )}

      {/* Recommendation snippet */}
      {church.recommendations.length > 0 && (
        <p className="text-slate-400 text-xs mt-1 mb-2">
          <span className="text-emerald-400">👥 {church.recommendations.length} recommend</span>
          {" · "}
          <span className="italic">
            &ldquo;{church.recommendations[0].note.slice(0, 60)}{church.recommendations[0].note.length > 60 ? "..." : ""}&rdquo;
          </span>
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex-none">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
            <MapPin className="h-3 w-3 mr-1" /> Directions
          </Button>
        </a>
        {church.website && (
          <a href={church.website} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 text-xs">
              Website <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
