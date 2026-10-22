"use client";

import { useEffect, useRef, useState } from "react";
import type { ContradictionPair } from "@/lib/contradictionPairs";
import { formatCoord } from "@/lib/labels";
import type { VariableId } from "@/lib/types";

type PairSelectorModalProps = {
  curatedPairs: ContradictionPair[];
  livePairs: ContradictionPair[];
  selectedPair: ContradictionPair | null;
  slopes: Record<string, number>;
  variable: VariableId;
  onSelectPair: (pairId: string) => void;
};

export function PairSelectorModal({
  curatedPairs,
  livePairs,
  selectedPair,
  slopes,
  variable,
  onSelectPair,
}: PairSelectorModalProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  const unit = variable === "temperature" ? "°C/dec" : "mm/d/dec";
  const isLiveSelected = selectedPair?.source === "live";

  const formatSlopeBadge = (regionId: string) => {
    const val = slopes[regionId];
    if (typeof val !== "number") {
      return null;
    }
    const sign = val >= 0 ? "+" : "";
    return `${sign}${val.toFixed(3)} ${unit}`;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select region pair to compare"
        data-agent-action="select-contradiction-pair"
        className="group flex items-center gap-2.5 rounded-xl border border-white/12 bg-[#0b1420]/90 px-3.5 py-2 text-left shadow-glass transition-all duration-200 hover:border-white/25 hover:bg-[#101c2c]"
      >
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-pill border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
            isLiveSelected
              ? "border-emerald-400/40 bg-emerald-400/12 text-emerald-300"
              : "border-amber-400/40 bg-amber-400/12 text-amber-300"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isLiveSelected ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          {isLiveSelected ? "Live" : "Featured"}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 truncate font-display text-xs font-semibold text-white sm:text-sm">
            <span className="truncate">{selectedPair?.regionA.name ?? "Region A"}</span>
            <span className="font-mono text-[11px] text-slate-500">↔</span>
            <span className="truncate">{selectedPair?.regionB.name ?? "Region B"}</span>
          </div>
        </div>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:text-white ${
            open ? "rotate-180 text-white" : ""
          }`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Contradiction region pairs"
          className="glass-panel absolute left-0 top-full z-50 mt-2 max-h-[72vh] w-[min(92vw,34rem)] overflow-y-auto rounded-2xl p-3 scrollbar-thin animate-fade-in sm:left-auto sm:right-0"
        >
          <div className="mb-2 flex items-center justify-between px-2 pt-1">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300/90">
              Featured Scientific Contrasts ({curatedPairs.length})
            </span>
            <span className="font-mono text-[10px] text-slate-500">NASA POWER · 1981–2025</span>
          </div>

          <div className="space-y-1.5">
            {curatedPairs.map((pair) => {
              const active = pair.id === selectedPair?.id;
              const slopeA = formatSlopeBadge(pair.regionA.id);
              const slopeB = formatSlopeBadge(pair.regionB.id);
              return (
                <button
                  key={pair.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onSelectPair(pair.id);
                    setOpen(false);
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                    active
                      ? "border-amber-400/50 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.12)]"
                      : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-semibold text-white">
                      {pair.regionA.name}{" "}
                      <span className="font-mono text-xs font-normal text-slate-400">vs</span>{" "}
                      {pair.regionB.name}
                    </span>
                    <span className="rounded-pill border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                      {pair.category}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-400">{pair.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] tabular-nums text-slate-400">
                    <span>
                      {pair.regionA.name}:{" "}
                      <strong className="text-slate-200">
                        {slopeA ?? formatCoord(pair.regionA.latitude, pair.regionA.longitude)}
                      </strong>
                    </span>
                    <span className="text-slate-600">·</span>
                    <span>
                      {pair.regionB.name}:{" "}
                      <strong className="text-slate-200">
                        {slopeB ?? formatCoord(pair.regionB.latitude, pair.regionB.longitude)}
                      </strong>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mb-2 mt-4 flex items-center justify-between border-t border-white/10 px-2 pt-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300/90">
              Detected from NASA POWER ({livePairs.length})
            </span>
            <span className="font-mono text-[10px] text-slate-500">Opposing p &lt; 0.05</span>
          </div>

          {livePairs.length > 0 ? (
            <div className="space-y-1.5">
              {livePairs.map((pair) => {
                const active = pair.id === selectedPair?.id;
                const slopeA = formatSlopeBadge(pair.regionA.id);
                const slopeB = formatSlopeBadge(pair.regionB.id);
                return (
                  <button
                    key={pair.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onSelectPair(pair.id);
                      setOpen(false);
                    }}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                      active
                        ? "border-emerald-400/50 bg-emerald-400/10"
                        : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-semibold text-white">
                        {pair.regionA.name}{" "}
                        <span className="font-mono text-xs font-normal text-slate-400">vs</span>{" "}
                        {pair.regionB.name}
                      </span>
                      <span className="rounded-pill border border-emerald-400/35 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                        LIVE
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-400">{pair.reason}</p>
                    {(slopeA || slopeB) && (
                      <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] tabular-nums text-slate-400">
                        {slopeA && <span className="text-rose-300">{slopeA}</span>}
                        <span className="text-slate-600">↔</span>
                        {slopeB && <span className="text-sky-300">{slopeB}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3 text-xs text-slate-400">
              No opposite statistically significant {variable} trends detected across the 10-region catalog right now.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
