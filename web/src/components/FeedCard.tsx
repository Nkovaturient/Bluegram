"use client";

import { formatCoord, significanceClass, significanceLabel } from "@/lib/labels";
import type { FeedItem } from "@/lib/types";

type FeedCardProps = {
  item: FeedItem;
  selected: boolean;
  onSelect: () => void;
};

export function FeedCard({ item, selected, onSelect }: FeedCardProps) {
  const decimals = item.unit.includes("mm") ? 3 : 2;
  const slopeFormatted =
    item.slopePerDecade >= 0
      ? `+${item.slopePerDecade.toFixed(decimals)}`
      : item.slopePerDecade.toFixed(decimals);

  return (
    <button
      type="button"
      onClick={onSelect}
      data-agent-action={`select-region-${item.region.id}`}
      className={`w-full rounded-xl border px-3.5 py-3 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 ${
        selected
          ? "border-primary/50 bg-primary/12 shadow-glow"
          : "border-white/6 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]"
      }`}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <div className="min-w-0">
            <span
              className={`block truncate font-display text-sm font-semibold leading-snug ${
                selected ? "text-white" : "text-slate-100"
              }`}
            >
              {item.region.name}
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {formatCoord(item.region.latitude, item.region.longitude)}
            </span>
          </div>
          <span
            className={`inline-flex shrink-0 rounded-pill border px-2 py-0.5 font-mono text-[10px] font-medium leading-tight transition-all ${significanceClass(
              item.significance,
            )} ${selected ? "animate-pulse-once" : ""}`}
          >
            {significanceLabel(item.significance)}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span
            className={`font-mono text-[15px] font-semibold tabular-nums ${
              item.slopePerDecade > 0
                ? "text-rose-400"
                : item.slopePerDecade < 0
                  ? "text-sky-400"
                  : "text-slate-400"
            }`}
          >
            {slopeFormatted}
          </span>
          <span className="font-mono text-[11px] text-slate-500">{item.unit}/decade</span>
        </div>
      </div>
    </button>
  );
}
