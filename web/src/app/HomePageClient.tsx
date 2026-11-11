"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TrendFeed } from "@/components/TrendFeed";
import { SearchBar } from "@/components/SearchBar";
import { FilterPanel } from "@/components/FilterPanel";
import { TrendPost } from "@/components/TrendPost";
import { VariableTabs, variableHeadline } from "@/components/VariableTabs";
import { PairSelectorModal } from "@/components/PairSelectorModal";
import { MobileBottomSheet } from "@/components/MobileBottomSheet";
import { ToastViewport, useToastQueue } from "@/components/Toast";
import { fetchFeedSummary, fetchSlopes, fetchTrend } from "@/lib/stats";
import { useTrendFilter } from "@/lib/useTrendFilter";
import { useCaptionCache } from "@/contexts/CaptionContext";
import { useContradictionStore } from "@/lib/contradictionStore";
import {
  DEFAULT_FEATURED_PAIR_ID,
  type ContradictionPair,
} from "@/lib/contradictionPairs";
import { isValidVariableId } from "@/lib/variableMeta";
import {
  getSubscribedRegionIds,
  loadBookmarks,
  saveBookmarks,
  isBookmarked,
  toggleBookmark,
  type Bookmark,
} from "@/lib/bookmarks";
import type {
  Direction,
  FeedItem,
  RegionType,
  Significance,
  TrendState,
  VariableId,
} from "@/lib/types";

const Globe = dynamic(
  () => import("@/components/Globe").then((mod) => mod.Globe),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#04090f] font-mono text-xs text-slate-500">
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
      <div className="flex h-full w-full items-center justify-center bg-[#04090f] font-mono text-xs text-slate-500">
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

  const { toasts, pushToast, dismissToast } = useToastQueue();

  const {
    getCaption,
    isLoading: isCaptionLoading,
    getError: getCaptionError,
    fetchCaptionForTrend,
  } = useCaptionCache();
  const {
    enabled,
    curatedPairs,
    livePairs,
    pairs,
    selectedPairId,
    enable,
    disable,
    selectPair,
    setPairsFromApi,
  } = useContradictionStore();

  const subscribedRegionIds = useMemo(
    () => getSubscribedRegionIds(bookmarks),
    [bookmarks],
  );

  const {
    filtered,
    filterState,
    hasActiveFilters,
    clearAllFilters,
    setSearchText,
    setSignificanceTiers,
    setDirections,
    setRegionTypes,
    setShowBookmarkedOnly,
  } = useTrendFilter(feedItems, subscribedRegionIds);

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
    const regionParam = searchParams.get("region");
    const variableParam = searchParams.get("variable");
    if (regionParam) {
      setSelectedId(regionParam);
    }
    if (isValidVariableId(variableParam)) {
      setVariable(variableParam);
    }
    setHydrated(true);
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/contradiction-pairs?variable=${encodeURIComponent(variable)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as
          | { curated?: ContradictionPair[]; live?: ContradictionPair[] }
          | ContradictionPair[];
        if (Array.isArray(data)) {
          const curated = data.filter((p) => p.source !== "live");
          const live = data.filter((p) => p.source === "live");
          setPairsFromApi(curated, live);
        } else {
          setPairsFromApi(
            Array.isArray(data.curated) ? data.curated : [],
            Array.isArray(data.live) ? data.live : [],
          );
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Failed to load contradiction pairs:", error);
      });
    return () => controller.abort();
  }, [variable, setPairsFromApi]);

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
        if (
          controller.signal.aborted ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
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
        if (
          controller.signal.aborted ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
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
        if (
          !controllerA.signal.aborted &&
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          setTrendStateA({
            status: "error",
            message: error instanceof Error ? error.message : "Failed to load trend A",
          });
        }
      });

    void fetchTrend(pair.regionB.id, variable, controllerB.signal)
      .then((trend) => setTrendStateB({ status: "ready", trend }))
      .catch((error: unknown) => {
        if (
          !controllerB.signal.aborted &&
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
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

  const handleSignificanceToggle = useCallback(
    (tier: Significance) => {
      const next = new Set(filterState.significanceTiers);
      if (next.has(tier)) {
        next.delete(tier);
      } else {
        next.add(tier);
      }
      setSignificanceTiers(next);
    },
    [filterState.significanceTiers, setSignificanceTiers],
  );

  const handleDirectionToggle = useCallback(
    (direction: Direction) => {
      const next = new Set(filterState.directions);
      if (next.has(direction)) {
        next.delete(direction);
      } else {
        next.add(direction);
      }
      setDirections(next);
    },
    [filterState.directions, setDirections],
  );

  const handleRegionTypeToggle = useCallback(
    (type: RegionType) => {
      const next = new Set(filterState.regionTypes);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      setRegionTypes(next);
    },
    [filterState.regionTypes, setRegionTypes],
  );

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
      if (!selectedPairId || !pairs.some((p) => p.id === selectedPairId)) {
        const defaultPair =
          pairs.find((p) => p.id === DEFAULT_FEATURED_PAIR_ID) ?? pairs[0];
        if (defaultPair) {
          selectPair(defaultPair.id);
        }
      }
    }
  }, [enabled, pairs, selectedPairId, enable, disable, selectPair]);

  const selectedPair =
    enabled && selectedPairId ? pairs.find((p) => p.id === selectedPairId) ?? null : null;

  const feedSidebarContent = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-white/8">
        <VariableTabs value={variable} onChange={setVariable} />
        <SearchBar value={filterState.searchText} onChange={setSearchText} />
        <FilterPanel
          significanceTiers={filterState.significanceTiers}
          directions={filterState.directions}
          regionTypes={filterState.regionTypes}
          showBookmarkedOnly={filterState.showBookmarkedOnly}
          subscribedCount={subscribedRegionIds.size}
          showClearAll={hasActiveFilters}
          onClearAll={clearAllFilters}
          onSignificanceToggle={handleSignificanceToggle}
          onDirectionToggle={handleDirectionToggle}
          onRegionTypeToggle={handleRegionTypeToggle}
          onBookmarkedOnlyToggle={() =>
            setShowBookmarkedOnly(!filterState.showBookmarkedOnly)
          }
        />
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto scrollbar-thin">
        <TrendFeed
          items={filtered}
          loading={feedLoading}
          selectedId={selectedId}
          onSelect={setSelectedId}
          error={feedError}
        />
      </div>
    </div>
  );

  const rightDetailsContent = enabled ? (
    <DuelingPosts
      stateA={trendStateA}
      stateB={trendStateB}
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
      pairTitle={selectedPair?.name}
      pairSubtitle={selectedPair?.description}
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
      onNotify={pushToast}
    />
  );

  return (
    <main className="flex h-dvh flex-col bg-ink text-slate-100 animate-fade-in noise-texture">
      {/* Unified Space Telemetry Header */}
      <header
        className="relative z-40 shrink-0 border-b border-white/10 bg-[#050b13]/95 px-4 py-3 backdrop-blur-md sm:px-5 sm:py-3.5"
        role="banner"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-sky-400/30 bg-[#02050a] shadow-[0_0_22px_rgba(56,189,248,0.22)] ring-1 ring-white/10 sm:h-12 sm:w-12">
              <Image
                src="/logo.png"
                alt="Bluegram logo"
                fill
                sizes="48px"
                priority
                className="object-cover object-[50%_20%] scale-[1.35] transition-transform duration-300 hover:scale-[1.42]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Bluegram
                </h1>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400 sm:text-[11px]">
                {enabled ? "Contradiction Detector · Dual-Region Telemetry" : variableHeadline(variable)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!enabled && (
              <nav
                aria-label="View mode"
                className="inline-flex items-center rounded-xl border border-white/12 bg-[#08101b] p-1"
              >
                <span
                  aria-current="page"
                  className="rounded-lg bg-primary/20 px-3 py-1.5 font-mono text-xs font-semibold text-white shadow-sm"
                >
                  Globe Explorer
                </span>
                <Link
                  href={
                    selectedId
                      ? `/feed?region=${encodeURIComponent(selectedId)}&variable=${encodeURIComponent(variable)}`
                      : `/feed?variable=${encodeURIComponent(variable)}`
                  }
                  data-agent-action="switch-to-pulse-feed"
                  className="rounded-lg px-3 py-1.5 font-mono text-xs font-medium text-slate-400 transition-colors hover:text-white"
                >
                  Pulse Feed
                </Link>
              </nav>
            )}

            {enabled && (
              <>
                <VariableTabs value={variable} onChange={setVariable} compact />
                {pairs.length > 0 && (
                  <PairSelectorModal
                    curatedPairs={curatedPairs}
                    livePairs={livePairs}
                    selectedPair={selectedPair}
                    slopes={slopes}
                    variable={variable}
                    onSelectPair={selectPair}
                  />
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleContradictionToggle}
              data-agent-action="toggle-compare-regions"
              className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition-all duration-200 ${
                enabled
                  ? "border-amber-400/50 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25"
                  : "border-white/12 bg-white/[0.06] text-slate-200 hover:border-white/25 hover:bg-white/10"
              }`}
              aria-label={enabled ? "Exit comparison mode" : "Compare regions"}
              aria-pressed={enabled}
            >
              {enabled ? "Exit Comparison" : "Compare Regions"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace: Canvas-First 2-col in Compare Mode (~62% / ~38%), 3-col in Explore Mode */}
      <div
        className={`relative flex min-h-0 flex-1 flex-col lg:grid lg:grid-rows-1 ${
          enabled
            ? "lg:grid-cols-[minmax(0,1.62fr)_minmax(24rem,1fr)]"
            : "lg:grid-cols-[minmax(19rem,22.5rem)_minmax(0,1fr)_minmax(21rem,26rem)]"
        }`}
        role="application"
        aria-label="Earth trends visualization"
      >
        {/* Left Feed Sidebar (Desktop only, hidden in Canvas-First Compare Mode) */}
        {!enabled && (
          <aside
            className="hidden min-h-0 flex-col overflow-hidden border-r border-white/10 bg-[#060c15]/80 lg:order-1 lg:col-start-1 lg:flex"
            aria-label="Region feed and filters"
          >
            {feedSidebarContent}
          </aside>
        )}

        {/* Center 3D Globe / SplitGlobe Canvas */}
        <section
          className={`relative min-h-0 flex-1 ${
            enabled ? "lg:order-1 lg:col-start-1" : "lg:order-2 lg:col-start-2"
          }`}
          aria-label={enabled ? "Split globe comparison view" : "Interactive globe"}
        >
          <div
            className={
              enabled
                ? "pointer-events-none invisible h-full w-full opacity-0"
                : "h-full w-full opacity-100 transition-opacity duration-300"
            }
          >
            <Globe
              regions={globeRegions}
              slopes={slopes}
              markerMeta={globeMarkerMeta}
              variable={variable}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
          {enabled && selectedPair && (
            <div className="absolute inset-0 z-10 animate-fade-in bg-ink">
              <SplitGlobe
                regionA={selectedPair.regionA}
                regionB={selectedPair.regionB}
                slopes={slopes}
                variable={variable}
              />
            </div>
          )}
        </section>

        {/* Right Telemetry Drawer (Desktop) */}
        <aside
          className={`hidden min-h-0 overflow-hidden border-l border-white/10 bg-[#060c15]/85 lg:block ${
            enabled ? "lg:order-2 lg:col-start-2" : "lg:order-3 lg:col-start-3"
          }`}
          aria-label={enabled ? "Dueling trends comparison" : "Selected trend details"}
        >
          {rightDetailsContent}
        </aside>

        {/* Mobile Bottom Sheet (< lg viewports) */}
        <MobileBottomSheet
          compareEnabled={enabled}
          hasSelectedRegion={Boolean(selectedId)}
          feedContent={feedSidebarContent}
          detailsContent={rightDetailsContent}
        />
      </div>

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
