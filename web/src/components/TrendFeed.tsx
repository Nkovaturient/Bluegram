"use client";

import { FeedCard } from "@/components/FeedCard";
import type { FeedItem } from "@/lib/types";

type TrendFeedProps = {
  items: FeedItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (regionId: string) => void;
  error: string | null;
};

const SKELETON_COUNT = 10;

export function TrendFeed({ items, loading, selectedId, onSelect, error }: TrendFeedProps) {
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
      <div className="space-y-2.5 px-4 py-3 pb-5 lg:px-5">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="h-4 w-24 rounded bg-white/10" />
              <div className="h-5 w-16 rounded bg-white/10" />
            </div>
            <div className="mt-2 h-5 w-20 rounded bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-4 lg:p-5">
        <p className="text-sm text-slate-400">No regions match your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 px-4 py-3 pb-5 lg:px-5">
      {items.map((item) => (
        <FeedCard
          key={item.region.id}
          item={item}
          selected={item.region.id === selectedId}
          onSelect={() => onSelect(item.region.id)}
        />
      ))}
    </div>
  );
}
