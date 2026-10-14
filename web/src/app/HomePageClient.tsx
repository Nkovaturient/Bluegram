"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TrendFeed } from "@/components/TrendFeed";
import { SearchBar } from "@/components/SearchBar";
import { FilterPanel } from "@/components/FilterPanel";
import { TrendPost } from "@/components/TrendPost";
import { VariableTabs, variableHeadline } from "@/components/VariableTabs";
import { fetchFeedSummary, fetchSlopes, fetchTrend } from "@/lib/stats";
import { useTrendFilter } from "@/lib/useTrendFilter";
import { useCaptionCache } from "@/contexts/CaptionContext";
import { useContradictionStore } from "@/lib/contradictionStore";
import { CURATED_CONTRADICTION_PAIRS } from "@/lib/contradictionPairs";
import {
  loadBookmarks,
  saveBookmarks,
  isBookmarked,
  toggleBookmark,
  type Bookmark,
} from "@/lib/bookmarks";
import type { Direction, FeedItem, RegionType, Significance, TrendState, VariableId } from "@/lib/types";

const Globe = dynamic(
  () => import("@/components/Globe").then((mod) => mod.Globe),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#04090f] text-xs text-slate-500">
        Loading globe…
      </div>
    ),
  },
);

const SplitGlobe = dynamic(
  () => import("@/components/SplitGlobe").then((mod) => mod.SplitGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#04090f] text-xs text-slate-500">
        Loading split view…
      </div>
    ),
  },
);

const DuelingPosts = dynamic(
  () => import("@/components/DuelingPosts").then((mod) => mod.DuelingPosts),
  { ssr: false },
);

export function HomePageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [variable, setVariable] = useState<VariableId>("temperature");
  const [slopes, setSlopes] = useState<Record<string, number>>({});
  const [trendState, setTrendState] = useState<TrendState>({ status: "idle" });
  const [trendStateA, setTrendStateA] = useState<TrendState>({ status: "idle" });
  const [trendStateB, setTrendStateB] = useState<TrendState>({ status: "idle" });
  const [hydrated, setHydrated] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const { getCaption, isLoading: isCaptionLoading, getError: getCaptionError, fetchCaptionForTrend } = useCaptionCache();
  const { enabled, pairs, selectedPairId, enable, disable, selectPair, setPairs, loadPairs } = useContradictionStore();

  const {
    filtered,
    filterState,
    hasActiveFilters,
    clearAllFilters,
    setSearchText,
    setSignificanceTiers,
    setDirections,
    setRegionTypes,
  } = useTrendFilter(feedItems);

  const globeRegions = useMemo(
    () => feedItems.map((item) => item.region),
    [feedItems],
  );

  const globeMarkerMeta = useMemo(
    () =>
      feedItems.map((item) => ({
        regionId: item.region.id,
        regionName: item.region.name,
        regionType: item.regionType,
        slopePerDecade: item.slopePerDecade,
        unit: item.unit,
        significance: item.significance,
      })),
    [feedItems],
  );

  useEffect(() => {
    setBookmarks(loadBookmarks());
    setPairs(CURATED_CONTRADICTION_PAIRS);
    
    const fetchDynamicPairs = async () => {
      try {
        const response = await fetch(`/api/contradiction-pairs?variable=${variable}`);
        if (response.ok) {
          const dynamicPairs = await response.json();
          loadPairs(dynamicPairs);
        }
      } catch (error: unknown) {
        console.error("Failed to load dynamic pairs:", error);
      }
    };
    void fetchDynamicPairs();

    const regionParam = searchParams.get("region");
    const variableParam = searchParams.get("variable");
    if (regionParam) {
      setSelectedId(regionParam);
    }
    if (variableParam === "temperature" || variableParam === "precipitation") {
      setVariable(variableParam);
    }
    setHydrated(true);
  }, [searchParams, variable, setPairs, loadPairs]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const params = new URLSearchParams();
    if (selectedId) {
      params.set("region", selectedId);
    }
    params.set("variable", variable);
    const search = params.toString();
    router.replace(search ? `?${search}` : "/", { scroll: false });
  }, [selectedId, variable, router, hydrated]);

  useEffect(() => {
    const controller = new AbortController();
    setFeedLoading(true);
    fetchFeedSummary(variable, controller.signal)
      .then((items) => {
        setFeedItems(items);
        setFeedError(null);
        setFeedLoading(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setFeedError(error instanceof Error ? error.message : "Could not load feed");
        setFeedLoading(false);
      });
    return () => controller.abort();
  }, [variable]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const controller = new AbortController();
    setTrendState({ status: "loading" });
    fetchTrend(selectedId, variable, controller.signal)
      .then((trend) => {
        setTrendState({ status: "ready", trend });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        setTrendState({
          status: "error",
          message: error instanceof Error ? error.message : "Trend request failed",
        });
      });
    return () => controller.abort();
  }, [selectedId, variable]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSlopes(variable, controller.signal)
      .then((points) => {
        const next: Record<string, number> = {};
        for (const point of points) {
          next[point.regionId] = point.slopePerDecade;
        }
        setSlopes(next);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        setSlopes({});
      });
    return () => controller.abort();
  }, [variable]);

  useEffect(() => {
    if (trendState.status !== "ready") {
      return;
    }
    const { trend } = trendState;
    void fetchCaptionForTrend(trend, variable);
  }, [trendState, variable, fetchCaptionForTrend]);

  useEffect(() => {
    if (!enabled || !selectedPairId) {
      return;
    }
    const pair = pairs.find((p) => p.id === selectedPairId);
    if (!pair) {
      return;
    }

    const controllerA = new AbortController();
    const controllerB = new AbortController();

    setTrendStateA({ status: "loading" });
    setTrendStateB({ status: "loading" });

    void fetchTrend(pair.regionA.id, variable, controllerA.signal)
      .then((trend) => setTrendStateA({ status: "ready", trend }))
      .catch((error: unknown) => {
        if (!controllerA.signal.aborted) {
          setTrendStateA({
            status: "error",
            message: error instanceof Error ? error.message : "Failed to load trend A",
          });
        }
      });

    void fetchTrend(pair.regionB.id, variable, controllerB.signal)
      .then((trend) => setTrendStateB({ status: "ready", trend }))
      .catch((error: unknown) => {
        if (!controllerB.signal.aborted) {
          setTrendStateB({
            status: "error",
            message: error instanceof Error ? error.message : "Failed to load trend B",
          });
        }
      });

    return () => {
      controllerA.abort();
      controllerB.abort();
    };
  }, [enabled, selectedPairId, pairs, variable]);

  useEffect(() => {
    if (trendStateA.status === "ready") {
      void fetchCaptionForTrend(trendStateA.trend, variable);
    }
  }, [trendStateA, variable, fetchCaptionForTrend]);

  useEffect(() => {
    if (trendStateB.status === "ready") {
      void fetchCaptionForTrend(trendStateB.trend, variable);
    }
  }, [trendStateB, variable, fetchCaptionForTrend]);

  const handleSignificanceToggle = useCallback((tier: Significance) => {
    const next = new Set(filterState.significanceTiers);
    if (next.has(tier)) {
      next.delete(tier);
    } else {
      next.add(tier);
    }
    setSignificanceTiers(next);
  }, [filterState.significanceTiers, setSignificanceTiers]);

  const handleDirectionToggle = useCallback((direction: Direction) => {
    const next = new Set(filterState.directions);
    if (next.has(direction)) {
      next.delete(direction);
    } else {
      next.add(direction);
    }
    setDirections(next);
  }, [filterState.directions, setDirections]);

  const handleRegionTypeToggle = useCallback((type: RegionType) => {
    const next = new Set(filterState.regionTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    setRegionTypes(next);
  }, [filterState.regionTypes, setRegionTypes]);

  const handleBookmarkToggle = useCallback(() => {
    if (!selectedId) {
      return;
    }
    const next = toggleBookmark(selectedId, variable, bookmarks);
    setBookmarks(next);
    saveBookmarks(next);
  }, [selectedId, variable, bookmarks]);

  const handleCopyLink = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") {
      return false;
    }
    const url = new URL(window.location.href);
    try {
      await navigator.clipboard.writeText(url.toString());
      return true;
    } catch (error: unknown) {
      console.error("Failed to copy link:", error);
      return false;
    }
  }, []);

  const handleContradictionToggle = useCallback(() => {
    if (enabled) {
      disable();
    } else {
      enable();
      if (pairs.length > 0 && !selectedPairId) {
        selectPair(pairs[0].id);
      }
    }
  }, [enabled, pairs, selectedPairId, enable, disable, selectPair]);

  const selectedPair = enabled && selectedPairId ? pairs.find((p) => p.id === selectedPairId) : null;

  return (
    <main className="flex h-dvh flex-col bg-ink text-slate-100 animate-fade-in noise-texture">
      <header className="shrink-0 border-b border-white/10 bg-gradient-to-b from-ink to-ink/95 px-4 py-4 sm:px-5 sm:py-5" role="banner">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-heading-sm sm:text-heading-md text-white">Bluegram</h1>
            <p className="mt-1 text-caption-sm uppercase sm:text-caption-lg sm:uppercase text-slate-400">
              {enabled ? "Contradiction Detector" : variableHeadline(variable)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleContradictionToggle}
            className={`rounded-lg border px-4 py-2 text-xs font-medium transition-all duration-200 min-h-[44px] sm:min-h-0 ${
              enabled
                ? "border-warning/50 bg-warning/15 text-amber-300 hover:scale-105 hover:bg-warning/25"
                : "border-white/10 bg-white/5 text-slate-300 hover:scale-105 hover:border-white/20 hover:bg-white/10"
            }`}
            aria-label={enabled ? "Exit comparison mode" : "Enter comparison mode"}
            aria-pressed={enabled}
          >
            {enabled ? "Exit Comparison" : "Compare Regions"}
          </button>
        </div>
        {enabled && pairs.length > 0 && (
          <div className="mt-3 animate-slide-in">
            <label htmlFor="contradiction-pair-select" className="sr-only">
              Select contradiction pair
            </label>
            <select
              id="contradiction-pair-select"
              value={selectedPairId || ""}
              onChange={(e) => selectPair(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 transition-colors hover:border-white/20 focus:border-primary/60"
              aria-label="Choose region pair to compare"
            >
              {pairs.map((pair) => (
                <option key={pair.id} value={pair.id} className="bg-elevated">
                  {pair.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>
      <div
        className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto_minmax(14rem,42vh)] lg:grid-cols-[minmax(19rem,24rem)_minmax(0,1fr)_minmax(17rem,26rem)] lg:grid-rows-1"
        role="application"
        aria-label="Earth trends visualization"
      >
        <section 
          className="relative min-h-0 border-b border-white/10 lg:order-2 lg:col-start-2 lg:border-b-0" 
          aria-label={enabled ? "Split globe comparison view" : "Interactive globe"}
        >
          {enabled && selectedPair ? (
            <SplitGlobe
              regionA={selectedPair.regionA}
              regionB={selectedPair.regionB}
              slopes={slopes}
              variable={variable}
            />
          ) : (
            <Globe
              regions={globeRegions}
              slopes={slopes}
              markerMeta={globeMarkerMeta}
              variable={variable}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </section>
        <aside
          className="flex min-h-0 flex-col overflow-hidden border-b border-white/10 lg:order-1 lg:col-start-1 lg:border-b-0 lg:border-r"
          aria-label={enabled ? "Comparison mode panel" : "Region feed and filters"}
        >
          {!enabled && (
            <>
              <div className="shrink-0 border-b border-white/5">
                <VariableTabs value={variable} onChange={setVariable} />
                <SearchBar value={filterState.searchText} onChange={setSearchText} />
                <FilterPanel
                  significanceTiers={filterState.significanceTiers}
                  directions={filterState.directions}
                  regionTypes={filterState.regionTypes}
                  showClearAll={hasActiveFilters}
                  onClearAll={clearAllFilters}
                  onSignificanceToggle={handleSignificanceToggle}
                  onDirectionToggle={handleDirectionToggle}
                  onRegionTypeToggle={handleRegionTypeToggle}
                />
              </div>
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto scrollbar-none">
                <TrendFeed
                  items={filtered}
                  loading={feedLoading}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  error={feedError}
                />
              </div>
            </>
          )}
          {enabled && (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div className="animate-fade-in">
                <p className="text-sm font-medium text-slate-300">Comparison Mode Active</p>
                <p className="mt-2 max-w-xs text-body-md text-slate-500">
                  Select a region pair from the dropdown above to compare trends.
                </p>
              </div>
            </div>
          )}
        </aside>
        <aside 
          className="min-h-0 overflow-hidden lg:order-3 lg:col-start-3 lg:border-l lg:border-white/10" 
          aria-label={enabled ? "Dueling trends comparison" : "Selected trend details"}
        >
          {enabled ? (
            <DuelingPosts
              trendA={trendStateA.status === "ready" ? trendStateA.trend : null}
              trendB={trendStateB.status === "ready" ? trendStateB.trend : null}
              captionA={
                trendStateA.status === "ready"
                  ? getCaption(trendStateA.trend, variable)
                  : null
              }
              captionB={
                trendStateB.status === "ready"
                  ? getCaption(trendStateB.trend, variable)
                  : null
              }
              loadingA={
                trendStateA.status === "ready"
                  ? isCaptionLoading(trendStateA.trend, variable)
                  : false
              }
              loadingB={
                trendStateB.status === "ready"
                  ? isCaptionLoading(trendStateB.trend, variable)
                  : false
              }
              comparisonReason={selectedPair?.reason}
            />
          ) : (
            <TrendPost
              state={trendState}
              caption={
                trendState.status === "ready"
                  ? getCaption(trendState.trend, variable)
                  : null
              }
              captionLoading={
                trendState.status === "ready"
                  ? isCaptionLoading(trendState.trend, variable)
                  : false
              }
              captionError={
                trendState.status === "ready"
                  ? getCaptionError(trendState.trend, variable)
                  : null
              }
              isBookmarked={selectedId ? isBookmarked(selectedId, variable, bookmarks) : false}
              onBookmarkToggle={handleBookmarkToggle}
              onCopyLink={handleCopyLink}
            />
          )}
        </aside>
      </div>
    </main>
  );
}
