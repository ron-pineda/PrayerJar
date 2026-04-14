"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type SearchParams = {
  lat: number;
  lng: number;
  radiusMiles: number;
  formattedAddress: string;
};

interface ChurchSearchBarProps {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
  compact?: boolean;
  currentAddress?: string;
}

export function ChurchSearchBar({
  onSearch,
  loading,
  compact = false,
  currentAddress = "",
}: ChurchSearchBarProps) {
  const [address, setAddress] = useState(currentAddress);
  const [radius, setRadius] = useState("25");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsBlocked, setGpsBlocked] = useState(false);

  async function handleSearch() {
    if (!address.trim()) return;
    const res = await fetch(`/api/v1/churches/geocode?address=${encodeURIComponent(address)}`);
    if (!res.ok) {
      toast.error("Couldn't find that location. Please try a different address.");
      return;
    }
    const { lat, lng, formattedAddress } = await res.json();
    onSearch({ lat, lng, radiusMiles: parseInt(radius), formattedAddress });
  }

  function handleGps() {
    if (!navigator.geolocation) {
      setGpsBlocked(true);
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const res = await fetch(`/api/v1/churches/geocode?address=${lat},${lng}`);
        const { formattedAddress } = res.ok ? await res.json() : { formattedAddress: "Your location" };
        setAddress(formattedAddress);
        onSearch({ lat, lng, radiusMiles: parseInt(radius), formattedAddress });
        setGpsLoading(false);
      },
      () => {
        setGpsBlocked(true);
        setGpsLoading(false);
      }
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-slate-800 border-b border-slate-700 px-4 py-3">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 bg-slate-900 border-slate-600 text-slate-100 text-sm"
        />
        <Select value={radius} onValueChange={(v) => v !== null && setRadius(v)}>
          <SelectTrigger className="w-20 bg-slate-900 border-slate-600 text-slate-300 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["5", "10", "25", "30"].map((r) => (
              <SelectItem key={r} value={r}>{r} mi</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700 px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Find a Church Near You</h1>
        <p className="text-slate-400 text-sm mb-6">Discover a community to grow in faith</p>
        <div className="flex gap-2">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter city, zip code, or address..."
            className="flex-1 bg-slate-900 border-slate-600 text-slate-100"
          />
          <Select value={radius} onValueChange={(v) => v !== null && setRadius(v)}>
            <SelectTrigger className="w-24 bg-slate-900 border-slate-600 text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["5", "10", "25", "30"].map((r) => (
                <SelectItem key={r} value={r}>{r} mi</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>
        <button
          onClick={handleGps}
          disabled={gpsBlocked || gpsLoading}
          className="mt-3 text-sm text-blue-400 hover:text-blue-300 disabled:text-slate-500 disabled:cursor-not-allowed"
          title={gpsBlocked ? "Location access was denied. Search by city or zip code instead." : undefined}
        >
          {gpsLoading ? (
            <span className="flex items-center gap-1 justify-center"><Loader2 className="h-3 w-3 animate-spin" /> Getting location...</span>
          ) : (
            <span className="flex items-center gap-1 justify-center"><MapPin className="h-3 w-3" /> Use my location</span>
          )}
        </button>
        {gpsBlocked && (
          <p className="text-xs text-slate-500 mt-1">Location access was denied. Search by city or zip code instead.</p>
        )}
      </div>
    </div>
  );
}
