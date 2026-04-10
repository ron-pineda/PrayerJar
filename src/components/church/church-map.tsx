"use client";

import { useEffect, useRef } from "react";
import type { ChurchResult } from "@/services/church.service";

interface ChurchMapProps {
  churches: ChurchResult[];
  userLat: number;
  userLng: number;
  highlightedPlaceId: string | null;
  onPinHover: (placeId: string | null) => void;
}

export function ChurchMap({
  churches,
  userLat,
  userLng,
  highlightedPlaceId,
  onPinHover,
}: ChurchMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  // Store callback in ref so marker listeners always call the latest version
  // without requiring map re-initialization (advanced-use-latest pattern).
  const onPinHoverRef = useRef(onPinHover);
  useEffect(() => { onPinHoverRef.current = onPinHover; });

  useEffect(() => {
    if (!mapRef.current) return;

    // Tear down existing map before re-initializing
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      markersRef.current.clear();
    }

    async function initMap() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      await import("leaflet.markercluster");
      await import("leaflet.markercluster/dist/MarkerCluster.css");
      await import("leaflet.markercluster/dist/MarkerCluster.Default.css");

      const map = L.map(mapRef.current!).setView([userLat, userLng], 12);
      leafletMapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      L.circleMarker([userLat, userLng], {
        radius: 7,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        color: "#93c5fd",
        weight: 3,
      }).addTo(map).bindTooltip("You");

      const cluster = (L as any).markerClusterGroup();

      churches.forEach((church, i) => {
        const isVerified = church.claim?.verified === true;
        const isEnriched = church.claim !== null || church.recommendations.length > 0;
        const color = isVerified ? "#10b981" : isEnriched ? "#0d9488" : "#64748b";

        const icon = L.divIcon({
          html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg)">${i + 1}</span></div>`,
          className: "",
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        const marker = L.marker([church.lat, church.lng], { icon })
          .bindTooltip(`${church.name} · ${church.distanceMiles.toFixed(1)} mi`)
          .on("mouseover", () => onPinHoverRef.current(church.placeId))
          .on("mouseout", () => onPinHoverRef.current(null));

        markersRef.current.set(church.placeId, marker);
        cluster.addLayer(marker);
      });

      map.addLayer(cluster);
    }

    initMap();

    return () => {
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
      markersRef.current.clear();
    };
  }, [userLat, userLng, churches]);

  useEffect(() => {
    markersRef.current.forEach((marker, placeId) => {
      const el = marker.getElement();
      if (!el) return;
      el.style.opacity = highlightedPlaceId === null || highlightedPlaceId === placeId ? "1" : "0.4";
    });
  }, [highlightedPlaceId]);

  return <div ref={mapRef} className="w-full h-full" />;
}
