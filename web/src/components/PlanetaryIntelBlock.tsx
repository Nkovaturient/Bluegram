"use client";

import { useEffect, useState } from "react";
import { fetchPlanetaryIntel } from "@/lib/stats";
import type { PlanetaryIntelResponse } from "@/lib/types";

type PlanetaryIntelBlockProps = {
  regionId: string;
  compact?: boolean;
};

export function PlanetaryIntelBlock({
  regionId,
  compact = false,
}: PlanetaryIntelBlockProps) {
  const [intel, setIntel] = useState<PlanetaryIntelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"synoptic" | "stac" | "isro">(
    "synoptic",
  );
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setImgError(false);
    fetchPlanetaryIntel(regionId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setIntel(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [regionId]);

  if (loading) {
    return (
      <section
        className="rounded-2xl border border-white/10 bg-[#070f1a]/80 p-3.5"
        aria-label="Loading live planetary intelligence"
      >
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-44 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <div className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
          <div className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
          <div className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
          <div className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
        </div>
      </section>
    );
  }

  if (!intel) {
    return null;
  }

  const { synoptic, stacScene, isroTelemetry } = intel;

  return (
    <section
      className="rounded-2xl border border-sky-400/20 bg-gradient-to-b from-[#081322]/95 to-[#050c16]/95 p-3.5 shadow-inner"
      aria-label="Planetary Computer, Meteomatics, and ISRO Ground Telemetry"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-pill border border-white/10 bg-[#040911] p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("synoptic")}
            className={`rounded-pill px-2.5 py-1 font-mono text-[10px] font-medium transition-colors ${
              activeTab === "synoptic"
                ? "bg-sky-500/20 text-sky-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Synoptic Nowcast
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stac")}
            className={`rounded-pill px-2.5 py-1 font-mono text-[10px] font-medium transition-colors ${
              activeTab === "stac"
                ? "bg-emerald-500/20 text-emerald-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Planetary STAC
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("isro")}
            className={`rounded-pill px-2.5 py-1 font-mono text-[10px] font-medium transition-colors ${
              activeTab === "isro"
                ? "bg-amber-500/20 text-amber-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ISRO ISTRAC · ISSDC
          </button>
        </div>

        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
          Live Multi-Service Telemetry
        </span>
      </div>

      {/* Tab 1: Meteomatics / Synoptic Nowcast */}
      {activeTab === "synoptic" && (
        <div className="mt-3 animate-fade-in">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-medium text-sky-300">
              {synoptic.providerLabel}
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {synoptic.observedAt}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-white/8 bg-white/[0.02] px-2.5 py-2">
              <p className="font-mono text-[9px] uppercase text-slate-400">
                2m Temp
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-white">
                {synoptic.temperatureC !== null
                  ? `${synoptic.temperatureC > 0 ? "+" : ""}${synoptic.temperatureC.toFixed(1)} °C`
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] px-2.5 py-2">
              <p className="font-mono text-[9px] uppercase text-slate-400">
                10m Wind
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-white">
                {synoptic.windSpeedMs !== null
                  ? `${synoptic.windSpeedMs.toFixed(1)} m/s`
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] px-2.5 py-2">
              <p className="font-mono text-[9px] uppercase text-slate-400">
                Pressure
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-white">
                {synoptic.pressureHpa !== null
                  ? `${synoptic.pressureHpa.toFixed(0)} hPa`
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] px-2.5 py-2">
              <p className="font-mono text-[9px] uppercase text-slate-400">
                Humidity / Precip
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-white">
                {synoptic.humidityPct !== null ? `${synoptic.humidityPct}%` : "—"}
                {synoptic.precip24hMm !== null
                  ? ` · ${synoptic.precip24hMm}mm`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Microsoft Planetary Computer STAC Granule + Preview */}
      {activeTab === "stac" && (
        <div className="mt-3 flex flex-col gap-3 animate-fade-in sm:flex-row sm:items-center">
          {stacScene.previewUrl && !imgError && !compact ? (
            <a
              href={stacScene.catalogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-[#04090f]"
              title="Open scene in Microsoft Planetary Computer Explorer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stacScene.previewUrl}
                alt={`Satellite granule ${stacScene.id}`}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            </a>
          ) : null}

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase text-emerald-300">
                Microsoft Planetary Computer · {stacScene.platform}
              </span>
              <span className="rounded-pill border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] text-emerald-200">
                {stacScene.collection}
              </span>
            </div>
            <p className="truncate font-mono text-[11px] text-slate-200">
              Granule: {stacScene.id}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 font-mono text-[10px] text-slate-400">
              <span>
                Pass: <strong className="text-slate-200">{stacScene.datetime}</strong>
                {stacScene.cloudCover !== null
                  ? ` · Cloud: ${stacScene.cloudCover}%`
                  : ""}
              </span>
              <div className="flex gap-2.5">
                <a
                  href={stacScene.catalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 hover:text-emerald-200"
                >
                  MPC Explorer ↗
                </a>
                <a
                  href={stacScene.stacApiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 underline decoration-white/25 underline-offset-2 hover:text-white"
                >
                  STAC JSON ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: ISRO ISTRAC Ground Station & ISSDC Science Archive */}
      {activeTab === "isro" && (
        <div className="mt-3 space-y-1.5 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold text-amber-300">
              {isroTelemetry.groundStation}
            </span>
            <span className="rounded-pill border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] text-amber-200">
              {isroTelemetry.datasetId}
            </span>
          </div>
          <p className="text-xs text-slate-200">
            Archive: <strong className="font-medium">{isroTelemetry.scienceArchive}</strong>{" "}
            <span className="font-mono text-[10px] text-slate-400">
              ({isroTelemetry.downlinkBand})
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 font-mono text-[10px]">
            <a
              href={isroTelemetry.archiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 underline decoration-amber-400/40 underline-offset-2 hover:text-amber-200"
            >
              ISRO Science Data ↗
            </a>
            <a
              href={isroTelemetry.issdcUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-300 underline decoration-sky-400/40 underline-offset-2 hover:text-sky-200"
            >
              ISSDC Portal ↗
            </a>
            <a
              href={isroTelemetry.istracUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 underline decoration-white/30 underline-offset-2 hover:text-white"
            >
              ISTRAC Network ↗
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
