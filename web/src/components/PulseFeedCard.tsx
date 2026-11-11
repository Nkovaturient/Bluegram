"use client";

import { useEffect, useRef, useState } from "react";
import { TrendMiniChart } from "@/components/TrendMiniChart";
import type { ToastVariant } from "@/components/Toast";
import {
  getCachedCID,
  getGatewayURL,
  getIPFSProtocolURL,
  uploadTrendToIPFS,
} from "@/lib/ipfs";
import {
  directionLabel,
  formatCoord,
  formatPValue,
  significanceClass,
  significanceLabel,
  significanceMark,
} from "@/lib/labels";
import {
  SPACE_AGENCIES,
  getRegionDossier,
  type SpaceAgencyId,
} from "@/lib/regionDossiers";
import { fetchTrend, type TimeWindow } from "@/lib/stats";
import { getVariablePalette } from "@/lib/variableMeta";
import type { FeedItem, TrendState, VariableId } from "@/lib/types";

type PulseFeedCardProps = {
  item: FeedItem;
  variable: VariableId;
  timeWindow: TimeWindow;
  isActiveOnGlobe: boolean;
  isSubscribed: boolean;
  highlightedAgency: SpaceAgencyId | "ALL";
  caption?: string | null;
  captionLoading?: boolean;
  onFocusRegion: (regionId: string) => void;
  onToggleSubscribe: (regionId: string) => void;
  onRequestCaption: (trend: Extract<TrendState, { status: "ready" }>["trend"]) => void;
  onNotify?: (message: string, variant?: ToastVariant) => void;
};

function concordanceBadge(concordance: "confirms" | "complements" | "extends"): {
  label: string;
  className: string;
} {
  switch (concordance) {
    case "confirms":
      return {
        label: "✓ Confirms",
        className: "border-emerald-400/35 bg-emerald-500/12 text-emerald-200",
      };
    case "complements":
      return {
        label: "⊕ Complements",
        className: "border-sky-400/35 bg-sky-500/12 text-sky-200",
      };
    case "extends":
      return {
        label: "↗ Extends",
        className: "border-amber-400/35 bg-amber-500/12 text-amber-200",
      };
    default: {
      const exhaustive: never = concordance;
      return exhaustive;
    }
  }
}

export function PulseFeedCard({
  item,
  variable,
  timeWindow,
  isActiveOnGlobe,
  isSubscribed,
  highlightedAgency,
  caption,
  captionLoading,
  onFocusRegion,
  onToggleSubscribe,
  onRequestCaption,
  onNotify,
}: PulseFeedCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const [trendState, setTrendState] = useState<TrendState>({ status: "idle" });
  const [selectedAgency, setSelectedAgency] = useState<SpaceAgencyId>("NASA");
  const [activeFooterTab, setActiveFooterTab] = useState<"anecdote" | "papers" | "ipfs">(
    "anecdote",
  );
  const [ipfsUploading, setIpfsUploading] = useState(false);
  const [ipfsCID, setIpfsCID] = useState<string | null>(null);

  const dossier = getRegionDossier(item.region.id);
  const palette = getVariablePalette(variable);

  // Sync selected agency tab when user filters by a specific space agency at top of /feed
  useEffect(() => {
    if (
      highlightedAgency !== "ALL" &&
      dossier?.agencyRecords.some((rec) => rec.agency === highlightedAgency)
    ) {
      setSelectedAgency(highlightedAgency);
    } else if (
      dossier &&
      !dossier.agencyRecords.some((rec) => rec.agency === selectedAgency)
    ) {
      setSelectedAgency(dossier.agencyRecords[0]?.agency ?? "NASA");
    }
  }, [highlightedAgency, dossier, selectedAgency]);

  // Observe card visibility to lazy-load full series + EONET events and notify side-globe
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const nearObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasEnteredView(true);
        }
      },
      { rootMargin: "320px 0px" },
    );

    const centerObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.52) {
          onFocusRegion(item.region.id);
        }
      },
      { threshold: [0.52, 0.75] },
    );

    nearObserver.observe(el);
    centerObserver.observe(el);

    return () => {
      nearObserver.disconnect();
      centerObserver.disconnect();
    };
  }, [item.region.id, onFocusRegion]);

  // Fetch windowed trend + live EONET events when card approaches viewport
  useEffect(() => {
    if (!hasEnteredView) return;
    const controller = new AbortController();
    setTrendState({ status: "loading" });

    fetchTrend(item.region.id, variable, controller.signal, timeWindow)
      .then((trend) => {
        setTrendState({ status: "ready", trend });
        setIpfsCID(getCachedCID(trend));
        onRequestCaption(trend);
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
          message: error instanceof Error ? error.message : "Failed to load region telemetry",
        });
      });

    return () => controller.abort();
  }, [hasEnteredView, item.region.id, variable, timeWindow, onRequestCaption]);

  const handleIPFSUpload = async () => {
    if (trendState.status !== "ready" || ipfsCID || ipfsUploading) {
      return;
    }
    setIpfsUploading(true);
    try {
      const res = await uploadTrendToIPFS(trendState.trend);
      setIpfsCID(res.cid);
      onNotify?.(`Pinned ${item.region.name} telemetry to IPFS (${res.cid.slice(0, 10)}…)`, "success");
    } catch (error: unknown) {
      onNotify?.(
        error instanceof Error ? error.message : "IPFS upload failed",
        "error",
      );
    } finally {
      setIpfsUploading(false);
    }
  };

  const decimals = item.unit.includes("mm") ? 3 : 2;
  const slopeSign = item.slopePerDecade >= 0 ? "+" : "";
  const slopeFormatted = `${slopeSign}${item.slopePerDecade.toFixed(decimals)} ${item.unit}/decade`;

  const activeAgencyRecord =
    dossier?.agencyRecords.find((r) => r.agency === selectedAgency) ??
    dossier?.agencyRecords[0];

  const liveEvents =
    trendState.status === "ready" && trendState.trend.events
      ? trendState.trend.events
      : [];

  return (
    <article
      ref={cardRef}
      id={`pulse-card-${item.region.id}`}
      data-region-id={item.region.id}
      className={`telemetry-card group relative flex flex-col gap-4 rounded-2xl p-5 transition-all duration-300 sm:p-6 ${
        isActiveOnGlobe
          ? "border-primary/55 shadow-[0_0_0_1px_rgba(255,107,74,0.28),0_14px_36px_rgba(0,0,0,0.65)]"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* 1. Instagram-Style Telemetry Post Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => onFocusRegion(item.region.id)}
            title="Sync & fly 3D side-globe to this region"
            data-agent-action={`focus-globe-${item.region.id}`}
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-xs font-bold transition-all ${
              isActiveOnGlobe
                ? "border-primary/60 bg-primary/20 text-white shadow-glow"
                : "border-white/12 bg-white/[0.04] text-slate-300 hover:border-white/25 hover:text-white"
            }`}
          >
            {item.region.name.slice(0, 2).toUpperCase()}
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
                {item.region.name}
              </h2>
              {item.regionType && (
                <span className="rounded-pill border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-300">
                  {item.regionType}
                </span>
              )}
              {isActiveOnGlobe && (
                <span className="inline-flex items-center gap-1 rounded-pill border border-emerald-400/40 bg-emerald-500/12 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Globe Locked
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => onFocusRegion(item.region.id)}
                className="inline-flex items-center gap-1 text-sky-300 underline decoration-sky-400/30 underline-offset-2 hover:text-sky-200"
              >
                <span>◎ {formatCoord(item.region.latitude, item.region.longitude)}</span>
              </button>
              <span>·</span>
              <span>
                Window:{" "}
                <strong className="text-slate-200">
                  {timeWindow.startYear}–{timeWindow.endYear}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSubscribe(item.region.id)}
            aria-pressed={isSubscribed}
            data-agent-action={`subscribe-region-${item.region.id}`}
            className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 font-mono text-xs font-medium transition-all ${
              isSubscribed
                ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                : "border-white/12 bg-white/[0.04] text-slate-300 hover:border-white/25 hover:bg-white/10"
            }`}
          >
            <span>{isSubscribed ? "★ Following" : "+ Follow"}</span>
          </button>
        </div>
      </header>

      {/* 2. "What Is Happening Now?" Live Anomaly & EONET Ping Strip */}
      <section
        className="rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-500/[0.07] via-[#0b1523] to-[#08101b] p-3.5"
        aria-label="What is happening now"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300">
              Happening Now · {dossier?.headline ?? "Regional Telemetry Status"}
            </span>
          </div>
          {liveEvents.length > 0 && (
            <span className="rounded-pill border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-200">
              {liveEvents.length} Live NASA EONET {liveEvents.length === 1 ? "Ping" : "Pings"}
            </span>
          )}
        </div>

        {dossier && (
          <p className="mt-1.5 text-xs leading-relaxed text-slate-200">
            {dossier.whatIsHappeningNow}
          </p>
        )}

        {liveEvents.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-white/8 pt-2.5">
            {liveEvents.map((ev) => (
              <a
                key={ev.id}
                href={ev.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] text-amber-100 transition-colors hover:border-amber-400/60"
              >
                <span className="font-semibold text-amber-300">{ev.category}:</span>
                <span className="max-w-[14rem] truncate">{ev.title}</span>
                <span className="text-slate-400">({ev.distanceKm} km)</span>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* 3. Windowed NASA POWER Chart & Statistical Significance Verdict */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#060c14]/85 p-3.5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-pill border px-2.5 py-0.5 font-mono text-[10px] font-medium ${palette.badgeClass}`}
            >
              {palette.label} · {palette.parameterCode}
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-white">
              {slopeFormatted}
            </span>
            <span className="text-xs text-slate-400">
              ({directionLabel(item.direction)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 font-mono text-[11px] tabular-nums ${significanceClass(
                item.significance,
              )}`}
            >
              <span>{significanceMark(item.significance)}</span>
              <span>
                {significanceLabel(item.significance)} · p = {formatPValue(item.pValue)}
              </span>
            </span>
            {typeof item.qValue === "number" && (
              <span
                className="rounded-pill border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] tabular-nums text-slate-300"
                title="Benjamini-Hochberg spatial FDR q-value"
              >
                FDR q = {formatPValue(item.qValue)}
              </span>
            )}
          </div>
        </div>

        {trendState.status === "ready" ? (
          <TrendMiniChart trend={trendState.trend} heightClassName="h-44" />
        ) : trendState.status === "error" ? (
          <div className="flex h-44 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/5 p-4 text-xs text-red-200">
            {trendState.message}
          </div>
        ) : (
          <div className="h-44 w-full animate-pulse rounded-xl bg-white/[0.03]" />
        )}

        {(caption || captionLoading) && (
          <div className="mt-3 border-t border-white/8 pt-2.5">
            {captionLoading ? (
              <div className="space-y-1.5">
                <div className="h-3 w-full animate-pulse rounded bg-white/10" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
              </div>
            ) : caption ? (
              <p className="text-xs leading-relaxed text-slate-300">{caption}</p>
            ) : null}
          </div>
        )}
      </section>

      {/* 4. Multi-Agency Consensus Strip & Interactive Mission Tabs (NASA · ESA · JAXA · ISRO · Roscosmos · CNSA) */}
      {dossier && (
        <section
          className="rounded-2xl border border-white/10 bg-[#08111d]/90 p-4"
          aria-label="Global space agency synthesis"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
              Multi-Agency Earth Observation Consensus ({dossier.agencyRecords.length} Agencies)
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              Click agency to inspect mission record
            </span>
          </div>

          <div
            className="mt-2.5 flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="Space agency records for this region"
          >
            {dossier.agencyRecords.map((rec) => {
              const agencyMeta = SPACE_AGENCIES[rec.agency];
              const isSelected = rec.agency === selectedAgency;
              return (
                <button
                  key={rec.agency}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedAgency(rec.agency)}
                  className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-mono text-[10px] font-medium transition-all ${
                    isSelected
                      ? agencyMeta.activePillClass
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200"
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: agencyMeta.dotColor }}
                  />
                  <span>{agencyMeta.shortName}</span>
                </button>
              );
            })}
          </div>

          {activeAgencyRecord && (
            <div className="mt-3 rounded-xl border border-white/8 bg-[#050b13]/90 p-3.5 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-xs font-semibold text-white">
                    {SPACE_AGENCIES[activeAgencyRecord.agency].fullName}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-sky-300">
                    Mission: {activeAgencyRecord.mission} ·{" "}
                    <span className="text-slate-400">
                      {activeAgencyRecord.sensorParameter}
                    </span>
                  </p>
                </div>
                <span
                  className={`rounded-pill border px-2 py-0.5 font-mono text-[10px] font-medium ${
                    concordanceBadge(activeAgencyRecord.concordance).className
                  }`}
                >
                  {concordanceBadge(activeAgencyRecord.concordance).label}
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-slate-200">
                {activeAgencyRecord.observedFinding}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-2">
                <p className="text-[11px] leading-relaxed text-slate-400">
                  <strong className="font-mono text-[10px] uppercase text-slate-300">
                    Cross-Agency Synthesis:
                  </strong>{" "}
                  {dossier.complementarySynthesis}
                </p>
                <a
                  href={activeAgencyRecord.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-mono text-[10px] font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
                >
                  {activeAgencyRecord.agency} Data Portal ↗
                </a>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 5. Dossier Footer Tabs: Historical Anecdote · Peer-Reviewed Papers · IPFS Provenance */}
      {dossier && (
        <footer className="border-t border-white/10 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-pill border border-white/10 bg-[#060c14] p-0.5">
              <button
                type="button"
                onClick={() => setActiveFooterTab("anecdote")}
                className={`rounded-pill px-3 py-1 font-mono text-[10px] font-medium transition-colors ${
                  activeFooterTab === "anecdote"
                    ? "bg-white/15 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Historical Record ({dossier.historicalAnecdote.year})
              </button>
              <button
                type="button"
                onClick={() => setActiveFooterTab("papers")}
                className={`rounded-pill px-3 py-1 font-mono text-[10px] font-medium transition-colors ${
                  activeFooterTab === "papers"
                    ? "bg-white/15 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Research Papers ({dossier.references.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFooterTab("ipfs")}
                className={`rounded-pill px-3 py-1 font-mono text-[10px] font-medium transition-colors ${
                  activeFooterTab === "ipfs"
                    ? "bg-white/15 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {ipfsCID ? "✓ IPFS Pinned" : "Verify on IPFS"}
              </button>
            </div>
          </div>

          <div className="mt-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
            {activeFooterTab === "anecdote" && (
              <div>
                <p className="font-display font-semibold text-amber-200">
                  {dossier.historicalAnecdote.year} — {dossier.historicalAnecdote.title}
                </p>
                <p className="mt-1 leading-relaxed text-slate-300">
                  {dossier.historicalAnecdote.summary}
                </p>
              </div>
            )}

            {activeFooterTab === "papers" && (
              <ul className="space-y-2">
                {dossier.references.map((ref) => (
                  <li
                    key={ref.doiUrl}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/5 pb-2 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <span
                        className={`mr-2 inline-block rounded border px-1.5 py-0.2 font-mono text-[9px] ${
                          SPACE_AGENCIES[ref.agency].badgeClass
                        }`}
                      >
                        {ref.agency}
                      </span>
                      <span className="font-medium text-slate-100">{ref.title}</span>
                      <span className="ml-1.5 text-slate-400">
                        — {ref.authors} ({ref.year}), <em>{ref.journal}</em>
                      </span>
                    </div>
                    <a
                      href={ref.doiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 font-mono text-[10px] text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
                    >
                      DOI ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {activeFooterTab === "ipfs" && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                {ipfsCID ? (
                  <>
                    <p className="break-all font-mono text-[11px] text-emerald-300">
                      Verifiable science: ipfs://{ipfsCID}
                    </p>
                    <div className="flex gap-2">
                      <a
                        href={getGatewayURL(ipfsCID)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-slate-200 hover:bg-white/10"
                      >
                        Gateway ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(getIPFSProtocolURL(ipfsCID));
                          onNotify?.("Copied ipfs:// URI", "success");
                        }}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-slate-200 hover:bg-white/10"
                      >
                        Copy URI
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-slate-400">
                      Pin this region&apos;s NASA POWER + Mann–Kendall JSON payload to IPFS via Pinata.
                    </p>
                    <button
                      type="button"
                      disabled={ipfsUploading || trendState.status !== "ready"}
                      onClick={() => void handleIPFSUpload()}
                      className="rounded-lg border border-primary/40 bg-primary/15 px-3 py-1.5 font-mono text-[11px] font-medium text-white transition-colors hover:bg-primary/25 disabled:opacity-50"
                    >
                      {ipfsUploading ? "Pinning…" : "Pin JSON to IPFS"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </footer>
      )}
    </article>
  );
}
