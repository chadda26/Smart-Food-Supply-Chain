"use client";
import React, { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Truck, AlertCircle, RefreshCw } from "lucide-react";
import { formatTimeRemaining } from "@/lib/utils";

interface TrackingMapProps {
  providerLocation: { latitude: number; longitude: number; name: string; address?: string };
  ngoLocation: { latitude: number; longitude: number; name: string; address?: string };
  driverLocation?: { latitude: number; longitude: number; timestamp?: string | Date } | null;
  driverName?: string;
  vehicleType?: string;
  status: string;
  recentTrail?: { latitude: number; longitude: number }[];
}

export const TrackingMap: React.FC<TrackingMapProps> = ({
  providerLocation,
  ngoLocation,
  driverLocation,
  driverName,
  vehicleType,
  status,
  recentTrail = [],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initLeafletMap() {
      try {
        if (!mapContainerRef.current) return;
        // Dynamically import Leaflet on client side
        const L = (await import("leaflet")).default;
        // Import leaflet CSS dynamically if not present
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        const centerLat = (providerLocation.latitude + ngoLocation.latitude) / 2;
        const centerLon = (providerLocation.longitude + ngoLocation.longitude) / 2;

        const map = L.map(mapContainerRef.current).setView([centerLat, centerLon], 13);
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Custom Icon helper
        const createCustomIcon = (bgColor: string, text: string) => {
          return L.divIcon({
            className: "custom-leaflet-marker",
            html: `<div style="background-color: ${bgColor}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px;">${text}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
        };

        // 1. Provider Marker (Pickup)
        const providerMarker = L.marker([providerLocation.latitude, providerLocation.longitude], {
          icon: createCustomIcon("#16a34a", "P"),
        })
          .addTo(map)
          .bindPopup(`<b>Pickup Location:</b><br/>${providerLocation.name}<br/>${providerLocation.address || ""}`);

        // 2. NGO Marker (Dropoff)
        const ngoMarker = L.marker([ngoLocation.latitude, ngoLocation.longitude], {
          icon: createCustomIcon("#2563eb", "N"),
        })
          .addTo(map)
          .bindPopup(`<b>Destination (NGO):</b><br/>${ngoLocation.name}<br/>${ngoLocation.address || ""}`);

        // 3. Driver Marker (if live)
        if (driverLocation) {
          const driverIcon = L.divIcon({
            className: "driver-leaflet-marker",
            html: `<div style="background-color: #f97316; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 6px rgba(249, 115, 22, 0.3), 0 4px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">🚚</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          driverMarkerRef.current = L.marker([driverLocation.latitude, driverLocation.longitude], {
            icon: driverIcon,
          })
            .addTo(map)
            .bindPopup(`<b>Driver: ${driverName || "Assigned Driver"}</b><br/>Status: ${status}<br/>Vehicle: ${vehicleType || "Van"}`);
        }

        // Draw transit route polyline
        const routePoints: [number, number][] = [
          [providerLocation.latitude, providerLocation.longitude],
          ...(driverLocation ? [[driverLocation.latitude, driverLocation.longitude] as [number, number]] : []),
          [ngoLocation.latitude, ngoLocation.longitude],
        ];

        polylineRef.current = L.polyline(routePoints, {
          color: "#059669",
          weight: 4,
          dashArray: "6, 8",
          opacity: 0.8,
        }).addTo(map);

        // Fit map bounds
        const group = L.featureGroup([providerMarker, ngoMarker, ...(driverMarkerRef.current ? [driverMarkerRef.current] : [])]);
        map.fitBounds(group.getBounds().pad(0.2));

        if (isMounted) setMapLoaded(true);
      } catch (err: any) {
        if (isMounted) setMapError(err?.message || "Failed to initialize map");
      }
    }

    initLeafletMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [providerLocation, ngoLocation]);

  // Update driver position reactively when location updates arrive
  useEffect(() => {
    if (mapInstanceRef.current && driverMarkerRef.current && driverLocation) {
      driverMarkerRef.current.setLatLng([driverLocation.latitude, driverLocation.longitude]);
    }
  }, [driverLocation]);

  return (
    <div className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner bg-slate-100">
      {mapError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
          <h4 className="text-sm font-semibold text-slate-800">Map Rendering Fallback</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            GPS Coordinates verified: Pickup ({providerLocation.latitude.toFixed(4)}, {providerLocation.longitude.toFixed(4)}) &rarr; Destination ({ngoLocation.latitude.toFixed(4)}, {ngoLocation.longitude.toFixed(4)})
          </p>
          {driverLocation && (
            <p className="text-xs font-mono bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200 mt-3">
              Driver Live GPS: {driverLocation.latitude.toFixed(5)}, {driverLocation.longitude.toFixed(5)}
            </p>
          )}
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Status Card Overlay */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md rounded-xl p-3.5 shadow-lg border border-slate-200/80 max-w-xs text-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
            Live Traceability Feed
          </span>
        </div>
        <div className="space-y-1.5 text-slate-600">
          <div className="flex items-start gap-1.5">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">P</span>
            <span className="truncate"><b>Pickup:</b> {providerLocation.name}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">N</span>
            <span className="truncate"><b>Destination:</b> {ngoLocation.name}</span>
          </div>
          {driverLocation ? (
            <div className="pt-2 border-t border-slate-100 text-slate-700">
              <p className="font-semibold text-emerald-800 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                Driver: {driverName || "On Road"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Last GPS ping: {driverLocation.timestamp ? new Date(driverLocation.timestamp).toLocaleTimeString() : "Just now"}
              </p>
            </div>
          ) : (
            <p className="pt-2 border-t border-slate-100 text-slate-400 italic">
              Driver location will appear when transit begins.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};