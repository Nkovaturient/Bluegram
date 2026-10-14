"use client";

import { significanceClass, significanceLabel } from "@/lib/labels";
import type { FeedItem } from "@/lib/types";

type FeedCardProps = {
  item: FeedItem;
  selected: boolean;
  onSelect: () => void;
};

export function FeedCard({ item, selected, onSelect }: FeedCardProps) {
  const slopeFormatted = item.slopePerDecade >= 0
    ? `+${item.slopePerDecade.toFixed(2)}`
    : item.slopePerDecade.toFixed(2);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border px-3.5 py-3 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b4a]/60 ${
        selected
          ? "border-[#ff6b4a]/50 bg-[#ff6b4a]/12"
          : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5"
      }`}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span
            className={`min-w-0 text-sm font-medium leading-snug ${selected ? "text-[#ffc4b3]" : "text-slate-100"}`}
          >
            {item.region.name}
          </span>
          <span
            className={`inline-flex shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium leading-tight transition-all ${
              significanceClass(item.significance)
            } ${selected ? "animate-pulse-once" : ""}`}
          >
            {significanceLabel(item.significance)}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span
            className={`font-mono text-[15px] font-semibold tabular-nums ${
              item.slopePerDecade > 0 ? "text-rose-400" : item.slopePerDecade < 0 ? "text-blue-400" : "text-slate-400"
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
