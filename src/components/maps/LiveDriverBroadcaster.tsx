"use client";
import React, { useState, useEffect, useRef } from "react";
import { Navigation, Play, Square, AlertCircle, CheckCircle2, Radio } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LiveDriverBroadcasterProps {
  deliveryId: string;
  providerLat: number;
  providerLon: number;
  ngoLat: number;
  ngoLon: number;
  onLocationSent?: (coords: { latitude: number; longitude: number }) => void;
}

export const LiveDriverBroadcaster: React.FC<LiveDriverBroadcasterProps> = ({
  deliveryId,
  providerLat,
  providerLon,
  ngoLat,
  ngoLon,
  onLocationSent,
}) => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [gpsMode, setGpsMode] = useState<"BROWSER_GPS" | "SIMULATION">("BROWSER_GPS");
  const [lastCoords, setLastCoords] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Ready to transmit live location");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pingCount, setPingCount] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const simStepRef = useRef<number>(0);
  const intervalRef = useRef<any>(null);

  async function transmitCoords(lat: number, lon: number, accuracy?: number) {
    try {
      const res = await fetch("/api/tracking/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryId,
          latitude: lat,
          longitude: lon,
          accuracy: accuracy || 10,
        }),
      });

      if (res.ok) {
        setLastCoords({ lat, lon, accuracy });
        setPingCount((c) => c + 1);
        setStatusMessage(`Transmitted GPS ping #${pingCount + 1}`);
        setErrorMsg(null);
        if (onLocationSent) onLocationSent({ latitude: lat, longitude: lon });
      } else {
        const data = await res.json();
        setErrorMsg(data.error?.message || "Failed to update tracking");
      }
    } catch (err: any) {
      setErrorMsg("Network error transmitting location");
    }
  }

  function startBroadcasting() {
    setIsBroadcasting(true);
    setErrorMsg(null);

    if (gpsMode === "BROWSER_GPS" && "geolocation" in navigator) {
      setStatusMessage("Requesting device GPS authorization...");
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          transmitCoords(latitude, longitude, accuracy);
        },
        (err) => {
          console.warn("Browser GPS permission error:", err.message);
          setStatusMessage("GPS unavailable, falling back to transit simulation...");
          setGpsMode("SIMULATION");
          startSimulationLoop();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      startSimulationLoop();
    }
  }

  function startSimulationLoop() {
    simStepRef.current = 0;
    const totalSteps = 20;

    intervalRef.current = setInterval(() => {
      simStepRef.current += 1;
      const progress = Math.min(simStepRef.current / totalSteps, 1);
      const currentLat = providerLat + (ngoLat - providerLat) * progress;
      const currentLon = providerLon + (ngoLon - providerLon) * progress;

      transmitCoords(currentLat, currentLon, 5);

      if (progress >= 1) {
        clearInterval(intervalRef.current);
        setStatusMessage("Destination reached in transit simulation.");
      }
    }, 4000);
  }

  function stopBroadcasting() {
    setIsBroadcasting(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatusMessage("Location broadcasting paused.");
  }

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className={`w-5 h-5 ${isBroadcasting ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
            <h3 className="text-base font-semibold">Live GPS Telemetry Broadcaster</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Streams real-time coordinates securely to the NGO recipient & provider map.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isBroadcasting ? (
            <Button onClick={startBroadcasting} variant="success" size="md">
              <Play className="w-4 h-4 fill-current mr-1" />
              Start Live GPS Tracking
            </Button>
          ) : (
            <Button onClick={stopBroadcasting} variant="danger" size="md">
              <Square className="w-4 h-4 fill-current mr-1" />
              Stop Broadcasting
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs">
        <div className="bg-slate-800/70 p-3 rounded-xl">
          <span className="text-slate-400 block mb-1">Status</span>
          <span className="font-semibold text-emerald-300">{statusMessage}</span>
        </div>
        <div className="bg-slate-800/70 p-3 rounded-xl">
          <span className="text-slate-400 block mb-1">Last Coordinates</span>
          <span className="font-mono text-slate-200">
            {lastCoords ? `${lastCoords.lat.toFixed(5)}, ${lastCoords.lon.toFixed(5)}` : "Awaiting transmission"}
          </span>
        </div>
        <div className="bg-slate-800/70 p-3 rounded-xl">
          <span className="text-slate-400 block mb-1">Pings Broadcast</span>
          <span className="font-bold text-white">{pingCount} successful pings</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};