"use client";

import type { Direction, RegionType, Significance } from "@/lib/types";

type FilterPanelProps = {
  significanceTiers: Set<Significance>;
  directions: Set<Direction>;
  regionTypes: Set<RegionType>;
  showBookmarkedOnly?: boolean;
  subscribedCount?: number;
  showClearAll: boolean;
  onClearAll: () => void;
  onSignificanceToggle: (tier: Significance) => void;
  onDirectionToggle: (direction: Direction) => void;
  onRegionTypeToggle: (type: RegionType) => void;
  onBookmarkedOnlyToggle?: () => void;
};

const SIGNIFICANCE_OPTIONS: { value: Significance; label: string }[] = [
  { value: "significant", label: "Significant" },
  { value: "borderline", label: "Borderline" },
  { value: "not_significant", label: "Not significant" },
];

const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: "increasing", label: "Increasing" },
  { value: "decreasing", label: "Decreasing" },
  { value: "no trend", label: "No trend" },
];

const REGION_TYPE_OPTIONS: { value: RegionType; label: string }[] = [
  { value: "polar", label: "Polar" },
  { value: "tropical", label: "Tropical" },
  { value: "arid", label: "Arid" },
  { value: "temperate", label: "Temperate" },
];

export function FilterPanel({
  significanceTiers,
  directions,
  regionTypes,
  showBookmarkedOnly = false,
  subscribedCount = 0,
  showClearAll,
  onClearAll,
  onSignificanceToggle,
  onDirectionToggle,
  onRegionTypeToggle,
  onBookmarkedOnlyToggle,
}: FilterPanelProps) {
  const activeCount =
    significanceTiers.size +
    directions.size +
    regionTypes.size +
    (showBookmarkedOnly ? 1 : 0);

  return (
    <nav className="border-b border-white/10 px-4 pb-3 lg:px-5" aria-label="Trend filters">
      <div className="mb-2 flex min-h-[1.25rem] items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-caption-sm uppercase text-slate-500">
            Filters {activeCount > 0 && `(${activeCount})`}
          </p>
          {onBookmarkedOnlyToggle && (
            <button
              type="button"
              onClick={onBookmarkedOnlyToggle}
              aria-pressed={showBookmarkedOnly}
              data-agent-action="toggle-following-filter"
              className={`inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 font-mono text-[10px] font-medium transition-all ${
                showBookmarkedOnly
                  ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
              }`}
            >
              <span>★ Following</span>
              {subscribedCount > 0 && (
                <span className="opacity-75">({subscribedCount})</span>
              )}
            </button>
          )}
        </div>
        {showClearAll ? (
          <button
            type="button"
            onClick={onClearAll}
            className="shrink-0 text-[11px] font-medium text-slate-400 underline-offset-2 transition-colors hover:text-primary focus-visible:text-primary"
          >
            Remove filters
          </button>
        ) : null}
      </div>
      <div className="space-y-2">
        <FilterGroup label="Significance">
          {SIGNIFICANCE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={significanceTiers.has(option.value)}
              onClick={() => onSignificanceToggle(option.value)}
            />
          ))}
        </FilterGroup>
        <FilterGroup label="Direction">
          {DIRECTION_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={directions.has(option.value)}
              onClick={() => onDirectionToggle(option.value)}
            />
          ))}
        </FilterGroup>
        <FilterGroup label="Region Type">
          {REGION_TYPE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={regionTypes.has(option.value)}
              onClick={() => onRegionTypeToggle(option.value)}
            />
          ))}
        </FilterGroup>
      </div>
    </nav>
  );
}

type FilterGroupProps = {
  label: string;
  children: React.ReactNode;
};

function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-pill border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
        active
          ? "scale-105 border-primary/50 bg-primary/15 text-[#ffd4c8] shadow-sm"
          : "border-white/10 bg-white/5 text-slate-300 hover:scale-105 hover:border-white/20 hover:bg-white/10"
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
