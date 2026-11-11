"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PulseFeedCard } from "@/components/PulseFeedCard";
import { ToastViewport, useToastQueue } from "@/components/Toast";
import { VariableTabs } from "@/components/VariableTabs";
import { useCaptionCache } from "@/contexts/CaptionContext";
import {
  getSubscribedRegionIds,
  isRegionSubscribed,
  loadBookmarks,
  saveBookmarks,
  toggleRegionSubscription,
  type Bookmark,
} from "@/lib/bookmarks";
import { formatCoord } from "@/lib/labels";
import {
  SPACE_AGENCIES,
  SPACE_AGENCY_LIST,
  getRegionDossier,
  regionHasAgency,
  type SpaceAgencyId,
} from "@/lib/regionDossiers";
import { fetchFeedSummary, fetchSlopes, type TimeWindow } from "@/lib/stats";
import { isValidVariableId } from "@/lib/variableMeta";
import type { FeedItem, RegionType, TrendResponse, VariableId } from "@/lib/types";

const Globe = dynamic(
  () => import("@/components/Globe").then((mod) => mod.Globe),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#04090f] font-mono text-xs text-slate-500">
        Calibrating synced 3D side-globe…
      </div>
    ),
  },
);

type EraPresetId = "full-45y" | "modern-21c" | "recent-15y" | "early-baseline";

const ERA_PRESETS: {
  id: EraPresetId;
  label: string;
  shortLabel: string;
  window: TimeWindow;
}[] = [
  {
    id: "full-45y",
    label: "1981–2025 (45y Full Satellite Record)",
    shortLabel: "1981–2025 (45y)",
    window: { startYear: 1981, endYear: 2025 },
  },
  {
    id: "modern-21c",
    label: "2000–2025 (21st Century Window)",
    shortLabel: "2000–2025",
    window: { startYear: 2000, endYear: 2025 },
  },
  {
    id: "recent-15y",
    label: "2010–2025 (Recent Acceleration)",
    shortLabel: "2010–2025",
    window: { startYear: 2010, endYear: 2025 },
  },
  {
    id: "early-baseline",
    label: "1981–2005 (Early Baseline)",
    shortLabel: "1981–2005",
    window: { startYear: 1981, endYear: 2005 },
  },
];

type SortMode = "significance" | "slope" | "agencies";

export function PulseFeedClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [variable, setVariable] = useState<VariableId>("temperature");
  const [eraId, setEraId] = useState<EraPresetId>("full-45y");
  const [feedScope, setFeedScope] = useState<"all" | "following">("all");
  const [agencyFilter, setAgencyFilter] = useState<SpaceAgencyId | "ALL">("ALL");
  const [biomeFilter, setBiomeFilter] = useState<RegionType | "ALL">("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("significance");
  const [searchQuery, setSearchQuery] = useState("");

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [slopes, setSlopes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRegionId, setActiveRegionId] = useState<string | null>("arctic");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const { toasts, pushToast, dismissToast } = useToastQueue();
  const { getCaption, isLoading: isCaptionLoading, fetchCaptionForTrend } =
    useCaptionCache();

  const activeTimeWindow = useMemo(
    () =>
      ERA_PRESETS.find((preset) => preset.id === eraId)?.window ??
      ERA_PRESETS[0].window,
    [eraId],
  );

  useEffect(() => {
    setBookmarks(loadBookmarks());
    const regionParam = searchParams.get("region");
    const variableParam = searchParams.get("variable");
    if (regionParam) {
      setActiveRegionId(regionParam);
    }
    if (isValidVariableId(variableParam)) {
      setVariable(variableParam);
    }
    setHydrated(true);
  }, [searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (activeRegionId) {
      params.set("region", activeRegionId);
    }
    params.set("variable", variable);
    router.replace(`/feed?${params.toString()}`, { scroll: false });
  }, [activeRegionId, variable, router, hydrated]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    Promise.all([
      fetchFeedSummary(variable, controller.signal, activeTimeWindow),
      fetchSlopes(variable, controller.signal, activeTimeWindow),
    ])
      .then(([items, slopePoints]) => {
        setFeedItems(items);
        const nextSlopes: Record<string, number> = {};
        for (const pt of slopePoints) {
          nextSlopes[pt.regionId] = pt.slopePerDecade;
        }
        setSlopes(nextSlopes);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load Pulse feed");
        setLoading(false);
      });

    return () => controller.abort();
  }, [variable, activeTimeWindow]);

  const subscribedIds = useMemo(
    () => getSubscribedRegionIds(bookmarks),
    [bookmarks],
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = feedItems.filter((item) => {
      if (feedScope === "following" && !subscribedIds.has(item.region.id)) {
        return false;
      }
      if (biomeFilter !== "ALL" && item.regionType !== biomeFilter) {
        return false;
      }
      if (
        agencyFilter !== "ALL" &&
        !regionHasAgency(item.region.id, agencyFilter)
      ) {
        return false;
      }
      if (q.length > 0) {
        const dossier = getRegionDossier(item.region.id);
        const haystack = [
          item.region.name,
          item.region.id,
          item.regionType ?? "",
          dossier?.headline ?? "",
          dossier?.whatIsHappeningNow ?? "",
          ...(dossier?.agencyRecords.map((r) => `${r.agency} ${r.mission}`) ?? []),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortMode === "slope") {
        return Math.abs(b.slopePerDecade) - Math.abs(a.slopePerDecade);
      }
      if (sortMode === "agencies") {
        const countA = getRegionDossier(a.region.id)?.agencyRecords.length ?? 0;
        const countB = getRegionDossier(b.region.id)?.agencyRecords.length ?? 0;
        if (countB !== countA) return countB - countA;
      }
      if (a.pValue !== b.pValue) {
        return a.pValue - b.pValue;
      }
      return Math.abs(b.slopePerDecade) - Math.abs(a.slopePerDecade);
    });

    return list;
  }, [
    feedItems,
    feedScope,
    subscribedIds,
    biomeFilter,
    agencyFilter,
    searchQuery,
    sortMode,
  ]);

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

  const handleToggleSubscribe = useCallback(
    (regionId: string) => {
      const wasSubscribed = isRegionSubscribed(regionId, bookmarks);
      const next = toggleRegionSubscription(regionId, variable, bookmarks);
      setBookmarks(next);
      saveBookmarks(next);
      const regionName =
        feedItems.find((i) => i.region.id === regionId)?.region.name ?? regionId;
      pushToast(
        wasSubscribed
          ? `Unfollowed ${regionName} from your Pulse stream`
          : `Following ${regionName} in your Pulse stream`,
        wasSubscribed ? "info" : "success",
      );
    },
    [bookmarks, variable, feedItems, pushToast],
  );

  const handleSeedDefaultSubscriptions = useCallback(() => {
    const starterIds = ["arctic", "western-ghats", "indo-gangetic", "amazon", "siberia"];
    let next = [...bookmarks];
    for (const id of starterIds) {
      if (!isRegionSubscribed(id, next)) {
        next = toggleRegionSubscription(id, variable, next);
      }
    }
    setBookmarks(next);
    saveBookmarks(next);
    pushToast("Subscribed to 5 flagship global & Indian regions", "success");
  }, [bookmarks, variable, pushToast]);

  const handleGlobePinSelect = useCallback((regionId: string) => {
    setActiveRegionId(regionId);
    const el = document.getElementById(`pulse-card-${regionId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleRequestCaption = useCallback(
    (trend: TrendResponse) => {
      void fetchCaptionForTrend(trend, variable);
    },
    [fetchCaptionForTrend, variable],
  );

  const activeItem = useMemo(
    () =>
      feedItems.find((item) => item.region.id === activeRegionId) ??
      filteredItems[0] ??
      null,
    [feedItems, filteredItems, activeRegionId],
  );

  const activeDossier = activeItem
    ? getRegionDossier(activeItem.region.id)
    : undefined;

  const explorerHref = useMemo(() => {
    const params = new URLSearchParams();
    if (activeRegionId) params.set("region", activeRegionId);
    params.set("variable", variable);
    return `/?${params.toString()}`;
  }, [activeRegionId, variable]);

  return (
    <main className="flex h-dvh flex-col bg-ink text-slate-100 animate-fade-in noise-texture">
      {/* Shared Top Space Telemetry Header */}
      <header
        className="relative z-40 shrink-0 border-b border-white/10 bg-[#050b13]/95 px-4 py-3 backdrop-blur-md sm:px-5 sm:py-3.5"
        role="banner"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <Link
              href={explorerHref}
              className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-sky-400/30 bg-[#02050a] shadow-[0_0_22px_rgba(56,189,248,0.22)] ring-1 ring-white/10 sm:h-12 sm:w-12"
            >
              <Image
                src="/logo.png"
                alt="Bluegram logo"
                fill
                sizes="48px"
                priority
                className="object-cover object-[50%_20%] scale-[1.35]"
              />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Bluegram{" "}
                  <span className="font-normal text-sky-300">Pulse</span>
                </h1>
                <span className="hidden rounded-pill border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-200 sm:inline-block">
                  6-Agency Stream
                </span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400 sm:text-[11px]">
                NASA · ESA · JAXA · ISRO · Roscosmos · CNSA — Scroll-Synced Geolocation Telemetry
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <VariableTabs value={variable} onChange={setVariable} compact />

            {/* Mode Switcher: Globe Explorer <-> Pulse Feed */}
            <nav
              aria-label="View mode"
              className="inline-flex items-center rounded-xl border border-white/12 bg-[#08101b] p-1"
            >
              <Link
                href={explorerHref}
                data-agent-action="switch-to-globe-explorer"
                className="rounded-lg px-3 py-1.5 font-mono text-xs font-medium text-slate-400 transition-colors hover:text-white"
              >
                Globe Explorer
              </Link>
              <span
                aria-current="page"
                className="rounded-lg bg-primary/20 px-3 py-1.5 font-mono text-xs font-semibold text-white shadow-sm"
              >
                Pulse Feed
              </span>
            </nav>
          </div>
        </div>

        {/* Smart Filter & Multi-Agency Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-white/8 pt-3">
          {/* Following vs All Regions + Space Agency Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex rounded-pill border border-white/10 bg-[#070e18] p-0.5">
              <button
                type="button"
                onClick={() => setFeedScope("all")}
                className={`rounded-pill px-3 py-1 font-mono text-[11px] font-medium transition-colors ${
                  feedScope === "all"
                    ? "bg-white/15 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All Regions ({feedItems.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedScope("following")}
                className={`rounded-pill px-3 py-1 font-mono text-[11px] font-medium transition-colors ${
                  feedScope === "following"
                    ? "bg-amber-400/20 text-amber-200"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ★ Following ({subscribedIds.size})
              </button>
            </div>

            <span className="mx-1 hidden h-4 w-px bg-white/10 sm:inline-block" />

            <button
              type="button"
              onClick={() => setAgencyFilter("ALL")}
              className={`rounded-pill border px-2.5 py-1 font-mono text-[10px] font-medium transition-all ${
                agencyFilter === "ALL"
                  ? "border-white/30 bg-white/15 text-white"
                  : "border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-200"
              }`}
            >
              All Agencies
            </button>
            {SPACE_AGENCY_LIST.map((agencyId) => {
              const meta = SPACE_AGENCIES[agencyId];
              const active = agencyFilter === agencyId;
              return (
                <button
                  key={agencyId}
                  type="button"
                  onClick={() =>
                    setAgencyFilter((prev) => (prev === agencyId ? "ALL" : agencyId))
                  }
                  className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-mono text-[10px] font-medium transition-all ${
                    active
                      ? meta.activePillClass
                      : "border-white/8 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200"
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: meta.dotColor }}
                  />
                  <span>{agencyId}</span>
                </button>
              );
            })}
          </div>

          {/* Era Window + Biome + Sort + Search */}
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="pulse-era-select" className="sr-only">
              Time window
            </label>
            <select
              id="pulse-era-select"
              value={eraId}
              onChange={(e) => setEraId(e.target.value as EraPresetId)}
              aria-label="Select satellite record time window"
              className="rounded-lg border border-white/12 bg-[#08111d] px-2.5 py-1.5 font-mono text-[11px] text-slate-200 focus:border-primary/60"
            >
              {ERA_PRESETS.map((era) => (
                <option key={era.id} value={era.id} className="bg-[#0b1420]">
                  {era.label}
                </option>
              ))}
            </select>

            <label htmlFor="pulse-biome-select" className="sr-only">
              Biome
            </label>
            <select
              id="pulse-biome-select"
              value={biomeFilter}
              onChange={(e) =>
                setBiomeFilter(e.target.value as RegionType | "ALL")
              }
              aria-label="Filter by region biome"
              className="rounded-lg border border-white/12 bg-[#08111d] px-2.5 py-1.5 font-mono text-[11px] text-slate-200 focus:border-primary/60"
            >
              <option value="ALL">All Biomes</option>
              <option value="polar">Polar</option>
              <option value="tropical">Tropical</option>
              <option value="arid">Arid</option>
              <option value="temperate">Temperate</option>
            </select>

            <label htmlFor="pulse-sort-select" className="sr-only">
              Sort order
            </label>
            <select
              id="pulse-sort-select"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              aria-label="Sort Pulse feed cards"
              className="rounded-lg border border-white/12 bg-[#08111d] px-2.5 py-1.5 font-mono text-[11px] text-slate-200 focus:border-primary/60"
            >
              <option value="significance">Sort: Most Significant (p-value)</option>
              <option value="slope">Sort: Strongest Decadal Slope</option>
              <option value="agencies">Sort: Multi-Agency Coverage</option>
            </select>

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search regions, missions, DOIs…"
              className="w-48 rounded-lg border border-white/12 bg-[#08111d] px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-primary/60 focus:outline-none sm:w-56"
            />
          </div>
        </div>
      </header>

      {/* Main 2-Column Split: Left Scrolling Pulse Stream (~56%) + Right Sticky Geolocation 3D Globe (~44%) */}
      <div
        className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1.28fr)_minmax(24rem,1fr)]"
        role="region"
        aria-label="Bluegram Pulse feed and geolocation globe"
      >
        {/* Left: Scrollable Instagram-Style Scientific Feed */}
        <section
          className="min-h-0 overflow-y-auto px-4 py-5 scrollbar-thin sm:px-6 lg:px-8"
          aria-label="Regional telemetry feed"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-16">
            {error && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-200">
                <p className="font-semibold">Stats telemetry service unreachable</p>
                <p className="mt-1 text-xs text-red-300">{error}</p>
              </div>
            )}

            {loading ? (
              Array.from({ length: 4 }, (_, idx) => (
                <div
                  key={idx}
                  className="telemetry-card h-96 animate-pulse rounded-2xl p-6"
                />
              ))
            ) : filteredItems.length === 0 ? (
              <div className="telemetry-card flex flex-col items-center justify-center gap-3 rounded-2xl p-10 text-center">
                <p className="font-display text-base font-semibold text-white">
                  {feedScope === "following"
                    ? "You aren't following any regions yet"
                    : "No regions match your current filter combination"}
                </p>
                <p className="max-w-md text-xs leading-relaxed text-slate-400">
                  {feedScope === "following"
                    ? "Follow regions using the '+ Follow' button on any card, or load our starter subscription pack below."
                    : "Try switching the Space Agency chip, biome selector, or search query."}
                </p>
                {feedScope === "following" ? (
                  <div className="mt-2 flex gap-2.5">
                    <button
                      type="button"
                      onClick={handleSeedDefaultSubscriptions}
                      className="rounded-xl border border-amber-400/50 bg-amber-400/15 px-4 py-2 font-mono text-xs font-medium text-amber-200 hover:bg-amber-400/25"
                    >
                      ★ Follow 5 Flagship Regions
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedScope("all")}
                      className="rounded-xl border border-white/12 bg-white/5 px-4 py-2 font-mono text-xs text-slate-200 hover:bg-white/10"
                    >
                      Show All 13 Regions
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAgencyFilter("ALL");
                      setBiomeFilter("ALL");
                      setSearchQuery("");
                    }}
                    className="mt-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-mono text-xs text-slate-200 hover:bg-white/10"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              filteredItems.map((item) => {
                const syntheticTrendKey = {
                  region: item.region,
                  variable,
                } as TrendResponse;
                return (
                  <PulseFeedCard
                    key={`${item.region.id}-${variable}-${eraId}`}
                    item={item}
                    variable={variable}
                    timeWindow={activeTimeWindow}
                    isActiveOnGlobe={item.region.id === activeItem?.region.id}
                    isSubscribed={subscribedIds.has(item.region.id)}
                    highlightedAgency={agencyFilter}
                    caption={getCaption(syntheticTrendKey, variable)}
                    captionLoading={isCaptionLoading(syntheticTrendKey, variable)}
                    onFocusRegion={setActiveRegionId}
                    onToggleSubscribe={handleToggleSubscribe}
                    onRequestCaption={handleRequestCaption}
                    onNotify={pushToast}
                  />
                );
              })
            )}
          </div>
        </section>

        {/* Right: Sticky Geolocation-Synced 3D Globe */}
        <aside
          className="relative hidden min-h-0 flex-col border-l border-white/10 bg-[#04090f] lg:flex"
          aria-label="Synced 3D geolocation globe"
        >
          <div className="relative flex-1">
            <Globe
              regions={globeRegions}
              slopes={slopes}
              markerMeta={globeMarkerMeta}
              variable={variable}
              selectedId={activeItem?.region.id ?? activeRegionId}
              onSelect={handleGlobePinSelect}
            />

            {/* Active Scrolled Card Telemetry HUD Overlay */}
            {activeItem && (
              <div className="glass-panel pointer-events-none absolute right-4 top-4 z-20 max-w-xs rounded-2xl p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Geolocation Lock
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {formatCoord(
                      activeItem.region.latitude,
                      activeItem.region.longitude,
                    )}
                  </span>
                </div>
                <p className="mt-1 font-display text-base font-semibold text-white">
                  {activeItem.region.name}
                </p>
                {activeDossier && (
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-300">
                    {activeDossier.headline}
                  </p>
                )}
                {activeDossier && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {activeDossier.agencyRecords.map((rec) => (
                      <span
                        key={rec.agency}
                        className={`rounded border px-1.5 py-0.2 font-mono text-[9px] ${
                          SPACE_AGENCIES[rec.agency].badgeClass
                        }`}
                      >
                        {rec.agency}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
