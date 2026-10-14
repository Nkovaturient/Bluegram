"use client";

import { formatCoord } from "@/lib/labels";
import type { Region } from "@/lib/types";

type RegionListProps = {
  regions: Region[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (regionId: string) => void;
  error: string | null;
};

const SKELETON_COUNT = 10;

export function RegionList({ regions, loading, selectedId, onSelect, error }: RegionListProps) {
  if (error) {
    return (
      <div className="p-4 lg:p-5">
        <p className="text-sm leading-relaxed text-red-200">{error}</p>
        <p className="mt-2 text-xs text-slate-500">Start the stats service on port 8000 and refresh.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <div className="hidden lg:block py-3" aria-hidden>
          <p className="px-5 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Regions
          </p>
          <ul className="space-y-1 px-2">
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <li key={i} className="animate-pulse rounded-lg px-3 py-3">
                <div className="h-4 w-24 rounded bg-white/10" />
                <div className="mt-2 h-3 w-32 rounded bg-white/5" />
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 py-3 lg:hidden" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hidden lg:block">
        <p className="px-5 pb-2 pt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Regions
        </p>
        <ul className="space-y-0.5 px-2 pb-4">
          {regions.map((region) => (
            <RegionRow
              key={region.id}
              region={region}
              selected={region.id === selectedId}
              onSelect={() => onSelect(region.id)}
              layout="vertical"
            />
          ))}
        </ul>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 py-3 lg:hidden snap-x snap-mandatory scrollbar-thin">
        {regions.map((region) => (
          <RegionRow
            key={region.id}
            region={region}
            selected={region.id === selectedId}
            onSelect={() => onSelect(region.id)}
            layout="chip"
          />
        ))}
      </div>
    </>
  );
}

type RegionRowProps = {
  region: Region;
  selected: boolean;
  onSelect: () => void;
  layout: "vertical" | "chip";
};

function RegionRow({ region, selected, onSelect, layout }: RegionRowProps) {
  if (layout === "chip") {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`shrink-0 snap-start rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b4a]/60 ${
          selected
            ? "border-[#ff6b4a]/50 bg-[#ff6b4a]/15 text-[#ffd4c8]"
            : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"
        }`}
      >
        {region.name}
      </button>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b4a]/60 ${
          selected ? "bg-[#ff6b4a]/12" : "hover:bg-white/5"
        }`}
      >
        <span className={`block text-sm font-medium ${selected ? "text-[#ffc4b3]" : "text-slate-100"}`}>
          {region.name}
        </span>
        <span className="mt-0.5 block font-mono text-[11px] text-slate-500">
          {formatCoord(region.latitude, region.longitude)}
        </span>
      </button>
    </li>
  );
}
