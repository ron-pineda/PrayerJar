"use client";

import React, { useEffect, useRef, useState } from "react";

interface PrayerPoint {
  id: string;
  latitude: number;
  longitude: number;
  country: string | null;
  category: string | null;
  createdAt: string;
}

interface PrayerMapProps {
  className?: string;
}

// Category colours — warm accent palette
const CATEGORY_COLORS: Record<string, string> = {
  health:      "#ef4444", // red
  family:      "#f97316", // orange
  finance:     "#eab308", // yellow
  guidance:    "#3b82f6", // blue
  relationships: "#ec4899", // pink
  work:        "#8b5cf6", // purple
  grief:       "#6b7280", // gray
  praise:      "#10b981", // green
  other:       "#f97316", // default warm accent
};

function categoryColor(category: string | null): string {
  if (!category) return "#f97316";
  return CATEGORY_COLORS[category] ?? "#f97316";
}

function processSSEEvent(
  event: MessageEvent,
  L: any,
  map: any,
  dotMapRef: React.MutableRefObject<Map<string, { marker: any; timer: ReturnType<typeof setTimeout> }>>,
) {
  let data: { points: PrayerPoint[] };
  try {
    data = JSON.parse(event.data);
  } catch {
    return;
  }

  const now = Date.now();
  const FIVE_MIN = 5 * 60 * 1000;

  // Build set of current ids from this batch
  const incomingIds = new Set(data.points.map((p) => p.id));

  // Collect IDs to delete first, delete after (Fix 3: avoid mutating Map during forEach)
  const toDelete: string[] = [];
  dotMapRef.current.forEach(({ marker, timer }, id) => {
    if (!incomingIds.has(id)) {
      clearTimeout(timer);
      marker.remove();
      toDelete.push(id);
    }
  });
  toDelete.forEach((id) => dotMapRef.current.delete(id));

  for (const point of data.points) {
    if (dotMapRef.current.has(point.id)) continue; // already shown

    const color = categoryColor(point.category);
    const label = [point.country, point.category].filter(Boolean).join(" · ") || "Prayer";

    const marker = L.circleMarker([point.latitude, point.longitude], {
      radius: 6,
      fillColor: color,
      fillOpacity: 0,   // start transparent for fade-in
      color: color,
      weight: 2,
      opacity: 0,
    }).addTo(map).bindTooltip(label, { direction: "top" });

    // Fade-in: Leaflet circleMarker exposes the SVG path element
    // We animate via a short rAF sequence rather than CSS transition
    // (circleMarker is SVG, not a DOM element with style)
    const el = (marker as any).getElement?.() as SVGElement | undefined;
    if (el) {
      el.style.transition = "opacity 0.6s ease";
      el.style.opacity = "0";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = "1";
        });
      });
    }
    marker.setStyle({ fillOpacity: 0.75, opacity: 1 });

    // Auto-expire: remove after remaining TTL (createdAt + 5 min)
    const createdAt = new Date(point.createdAt).getTime();
    const expiresIn = Math.max(0, createdAt + FIVE_MIN - now);

    const timer = setTimeout(() => {
      marker.remove();
      dotMapRef.current.delete(point.id);
    }, expiresIn);

    dotMapRef.current.set(point.id, { marker, timer });
  }
}

export function PrayerMap({ className }: PrayerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  // id → { marker, timer }
  const dotMapRef = useRef<Map<string, { marker: any; timer: ReturnType<typeof setTimeout> }>>(new Map());
  const [locationDot, setLocationDot] = useState<{ lat: number; lng: number } | null>(null);
  const locationMarkerRef = useRef<any>(null);
  const mapReadyRef = useRef(false);
  const pendingRef = useRef<MessageEvent[]>([]);

  // Initialise Leaflet map once
  useEffect(() => {
    if (!mapRef.current) return;

    // Teardown existing instance before re-init
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      dotMapRef.current.forEach(({ timer }) => clearTimeout(timer));
      dotMapRef.current.clear();
      mapReadyRef.current = false;
    }

    async function initMap() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!mapRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: true }).setView([20, 0], 2);
      leafletMapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      mapReadyRef.current = true;

      // Replay any SSE events that arrived before the map was ready
      for (const e of pendingRef.current) {
        processSSEEvent(e, L, map, dotMapRef);
      }
      pendingRef.current = [];
    }

    initMap();

    return () => {
      mapReadyRef.current = false;
      dotMapRef.current.forEach(({ timer }) => clearTimeout(timer));
      dotMapRef.current.clear();
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // SSE connection for live prayer dots
  useEffect(() => {
    const es = new EventSource("/api/v1/sse/prayer-map");

    es.onmessage = async (event) => {
      // Fix 1: buffer events that arrive before the map is ready
      if (!mapReadyRef.current || !leafletMapRef.current) {
        pendingRef.current.push(event);
        return;
      }

      const L = (await import("leaflet")).default;
      const map = leafletMapRef.current;
      processSSEEvent(event, L, map, dotMapRef);
    };

    es.onerror = () => {
      // EventSource will auto-reconnect; no action needed
    };

    return () => {
      es.close();
    };
  }, []);

  // Render user's own location dot when set
  useEffect(() => {
    if (!locationDot || !mapReadyRef.current || !leafletMapRef.current) return;

    async function addLocationDot() {
      const L = (await import("leaflet")).default;
      // Fix 2: re-check after async import — component may have unmounted
      const map = leafletMapRef.current;
      if (!map) return;

      // Remove previous user dot
      if (locationMarkerRef.current) {
        locationMarkerRef.current.remove();
        locationMarkerRef.current = null;
      }

      const marker = L.circleMarker([locationDot!.lat, locationDot!.lng], {
        radius: 8,
        fillColor: "#3b82f6",
        fillOpacity: 0.9,
        color: "#93c5fd",
        weight: 3,
      }).addTo(map).bindTooltip("You (approximate location)", { direction: "top" });

      locationMarkerRef.current = marker;
    }

    addLocationDot();
  }, [locationDot]);

  function handleShareLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Fuzz to ±0.5° for region-level privacy
        const fuzzed = {
          lat: pos.coords.latitude + (Math.random() - 0.5),
          lng: pos.coords.longitude + (Math.random() - 0.5),
        };
        setLocationDot(fuzzed);
      },
      () => {
        // Permission denied or error — silently ignore
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Geolocation opt-in button */}
      {!locationDot && (
        <button
          onClick={handleShareLocation}
          className="absolute bottom-4 right-4 z-[1000] rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
          aria-label="Share my approximate location on the map"
        >
          Share my location
        </button>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-md bg-white/90 px-3 py-2 shadow-md text-xs text-gray-700 space-y-1">
        <p className="font-semibold mb-1">Live Prayers</p>
        {Object.entries(CATEGORY_COLORS).slice(0, 6).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="capitalize">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
