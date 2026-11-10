"use client";

import { useEffect, useState } from "react";
import { TrendMiniChart } from "@/components/TrendMiniChart";
import { TrendPostSkeleton } from "@/components/TrendPostSkeleton";
import type { ToastVariant } from "@/components/Toast";
import { uploadTrendToIPFS, getCachedCID, getGatewayURL, getIPFSProtocolURL } from "@/lib/ipfs";
import {
  directionLabel,
  formatCoord,
  formatPValue,
  significanceClass,
  significanceLabel,
  significanceMark,
} from "@/lib/labels";
import { getVariablePalette } from "@/lib/variableMeta";
import type { TrendState } from "@/lib/types";

type TrendPostProps = {
  state: TrendState;
  caption?: string | null;
  captionLoading?: boolean;
  captionError?: string | null;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  onCopyLink?: () => void | Promise<boolean>;
  onNotify?: (message: string, variant?: ToastVariant) => void;
};

export function TrendPost({
  state,
  caption,
  captionLoading,
  captionError,
  isBookmarked,
  onBookmarkToggle,
  onCopyLink,
  onNotify,
}: TrendPostProps) {
  switch (state.status) {
    case "idle":
      return (
        <section className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] font-mono text-xs text-slate-400">
            ◎
          </div>
          <p className="font-display text-sm font-medium text-slate-200">No region selected</p>
          <p className="max-w-[16rem] text-xs leading-relaxed text-slate-400">
            Select a pin on the 3D globe or a region from the left feed to inspect its NASA POWER trend and Mann–Kendall significance verdict.
          </p>
        </section>
      );
    case "loading":
      return <TrendPostSkeleton />;
    case "error":
      return (
        <section className="p-6">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-red-300/80">NASA POWER</p>
          <p className="mt-3 text-sm leading-6 text-red-200">{state.message}</p>
        </section>
      );
    case "ready":
      return (
        <ReadyPost
          state={state}
          caption={caption}
          captionLoading={captionLoading}
          captionError={captionError}
          isBookmarked={isBookmarked}
          onBookmarkToggle={onBookmarkToggle}
          onCopyLink={onCopyLink}
          onNotify={onNotify}
        />
      );
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

function ReadyPost({
  state,
  caption,
  captionLoading,
  captionError,
  isBookmarked,
  onBookmarkToggle,
  onCopyLink,
  onNotify,
}: {
  state: Extract<TrendState, { status: "ready" }>;
  caption?: string | null;
  captionLoading?: boolean;
  captionError?: string | null;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  onCopyLink?: () => void | Promise<boolean>;
  onNotify?: (message: string, variant?: ToastVariant) => void;
}) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [ipfsUploading, setIpfsUploading] = useState(false);
  const [ipfsError, setIpfsError] = useState<string | null>(null);
  const [ipfsCID, setIpfsCID] = useState<string | null>(() => getCachedCID(state.trend));
  const [cidCopied, setCidCopied] = useState(false);

  useEffect(() => {
    setIpfsCID(getCachedCID(state.trend));
    setIpfsError(null);
  }, [state.trend]);

  useEffect(() => {
    if (!copySuccess) {
      return;
    }
    const timer = window.setTimeout(() => setCopySuccess(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copySuccess]);

  useEffect(() => {
    if (!cidCopied) {
      return;
    }
    const timer = window.setTimeout(() => setCidCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [cidCopied]);

  const handleCopyClick = async () => {
    if (!onCopyLink) {
      return;
    }
    const result = await onCopyLink();
    if (result === true) {
      setCopySuccess(true);
      onNotify?.("Shareable region link copied to clipboard", "success");
    } else {
      onNotify?.("Could not copy share link", "error");
    }
  };

  const handleBookmarkClick = () => {
    if (!onBookmarkToggle) {
      return;
    }
    const nextState = !isBookmarked;
    onBookmarkToggle();
    onNotify?.(
      nextState
        ? `Saved ${state.trend.region.name} (${state.trend.variableLabel})`
        : `Removed ${state.trend.region.name} from bookmarks`,
      "info",
    );
  };

  const handleIPFSUpload = async () => {
    if (ipfsCID || ipfsUploading) {
      return;
    }

    setIpfsUploading(true);
    setIpfsError(null);

    try {
      const result = await uploadTrendToIPFS(state.trend);
      setIpfsCID(result.cid);
      onNotify?.(`Trend JSON pinned to IPFS (${result.cid.slice(0, 10)}…)`, "success");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Upload failed";
      setIpfsError(msg);
      onNotify?.(msg, "error");
    } finally {
      setIpfsUploading(false);
    }
  };

  const handleCopyCID = async () => {
    if (!ipfsCID) {
      return;
    }
    try {
      await navigator.clipboard.writeText(ipfsCID);
      setCidCopied(true);
      onNotify?.("IPFS CID copied to clipboard", "success");
    } catch (error: unknown) {
      console.error("Failed to copy CID:", error);
      onNotify?.("Failed to copy CID", "error");
    }
  };

  const { trend } = state;
  const palette = getVariablePalette(trend.variable);
  const first = trend.series[0]?.date;
  const last = trend.series[trend.series.length - 1]?.date;
  const slopeText = `${trend.slopePerDecade >= 0 ? "+" : ""}${trend.slopePerDecade.toFixed(3)} ${trend.unit} / decade`;

  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Bluegram ${trend.region.name} ${trend.variableLabel} Trend (1981–2025)`,
    description:
      caption ??
      `Mann-Kendall trend analysis of NASA POWER ${trend.variableLabel} at ${trend.region.name}: ${slopeText} (p = ${trend.pValue.toFixed(4)}, ${trend.significance}).`,
    creator: {
      "@type": "Organization",
      name: "NASA POWER / Bluegram",
      url: "https://power.larc.nasa.gov/",
    },
    temporalCoverage: first && last ? `${first}/${last}` : "1981-01/2025-12",
    spatialCoverage: {
      "@type": "Place",
      name: trend.region.name,
      geo: {
        "@type": "GeoCoordinates",
        latitude: trend.region.latitude,
        longitude: trend.region.longitude,
      },
    },
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: trend.variableLabel,
        propertyID: palette.parameterCode,
        unitText: `${trend.unit}/decade`,
        value: trend.slopePerDecade,
      },
      {
        "@type": "PropertyValue",
        name: "Mann-Kendall p-value",
        value: trend.pValue,
      },
    ],
    ...(ipfsCID ? { identifier: `ipfs://${ipfsCID}` } : {}),
  };

  return (
    <article
      className="flex h-full flex-col gap-5 overflow-y-auto p-5 scrollbar-thin lg:p-6"
      data-region-id={trend.region.id}
      data-variable={trend.variable}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />
      <header>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Telemetry Post
              </p>
              <span className="font-mono text-[10px] text-slate-500">
                {formatCoord(trend.region.latitude, trend.region.longitude)}
              </span>
            </div>
            <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-white">
              {trend.region.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-pill border px-2.5 py-0.5 font-mono text-[11px] font-medium ${palette.badgeClass}`}
              >
                {trend.variableLabel} · {palette.parameterCode}
              </span>
              <span className={`text-xs font-medium ${palette.textAccentClass}`}>
                {directionLabel(trend.direction)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {onBookmarkToggle && (
              <button
                type="button"
                onClick={handleBookmarkClick}
                data-agent-action="toggle-bookmark"
                className="rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:border-white/20 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b4a]/60"
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
                aria-pressed={isBookmarked}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill={isBookmarked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            )}
            {onCopyLink && (
              <button
                type="button"
                onClick={() => void handleCopyClick()}
                data-agent-action="copy-share-link"
                className={`rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:border-white/20 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b4a]/60 ${
                  copySuccess ? "trend-post-copy--success" : ""
                }`}
                aria-label={copySuccess ? "Link copied" : "Copy link"}
              >
                {copySuccess ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-emerald-400"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-white/[0.08] bg-[#060c14]/75 p-3">
        <TrendMiniChart trend={trend} heightClassName="h-56" />
        <p className="mt-2 font-mono text-[11px] text-slate-500">
          Annual means of monthly {trend.variableLabel.toLowerCase()} · Dashed line = Theil–Sen slope
        </p>
      </div>

      <div className="telemetry-card space-y-2.5 rounded-2xl p-4">
        <p className="font-mono text-lg font-semibold tabular-nums text-white">{slopeText}</p>
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`inline-flex items-center gap-2 rounded-pill border px-3 py-1 font-mono text-xs tabular-nums ${significanceClass(trend.significance)}`}
          >
            <span>{significanceMark(trend.significance)}</span>
            <span>
              {significanceLabel(trend.significance)} · p = {formatPValue(trend.pValue)}
            </span>
          </p>
          {typeof trend.qValue === "number" && (
            <span
              className="rounded-pill border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] tabular-nums text-slate-300"
              title="Benjamini–Hochberg FDR-adjusted q-value across spatial regions"
            >
              FDR q = {formatPValue(trend.qValue)}
            </span>
          )}
        </div>
        <p className="font-mono text-xs tabular-nums text-slate-400">
          {trend.nMonths} months
          {first && last ? ` · ${first} – ${last}` : ""} · NASA POWER ({trend.dataSource})
        </p>
      </div>

      {trend.supplemental && (
        <section
          className="rounded-2xl border border-indigo-400/25 bg-indigo-500/[0.06] p-3.5"
          aria-label="Partner and supplemental observation layer"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-300">
              {trend.supplemental.agency}
            </span>
            <span className="rounded-pill border border-indigo-400/35 bg-indigo-500/15 px-2 py-0.5 font-mono text-[10px] font-medium text-indigo-200">
              {trend.supplemental.badge}
            </span>
          </div>
          <p className="mt-1.5 font-display text-xs font-semibold text-white">
            {trend.supplemental.indexName}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            {trend.supplemental.note}
          </p>
        </section>
      )}

      {trend.events && trend.events.length > 0 && (
        <section
          className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.05] p-3.5"
          aria-label="Active NASA EONET natural events"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300">
              Active Events · NASA EONET v3 ({trend.events.length})
            </span>
            <a
              href="https://eonet.gsfc.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] text-slate-400 underline decoration-white/20 underline-offset-2 hover:text-white"
            >
              EONET Live
            </a>
          </div>
          <ul className="mt-2 space-y-1.5">
            {trend.events.map((ev) => (
              <li
                key={ev.id}
                className="flex items-baseline justify-between gap-2 text-xs text-slate-200"
              >
                <span className="truncate">
                  <strong className="font-medium text-amber-200">{ev.category}:</strong>{" "}
                  {ev.title}
                </span>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-400">
                  {ev.distanceKm} km · {ev.date}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-white/10 pt-4">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          AI Plain-Language Synthesis
        </p>
        {captionLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-white/10" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
          </div>
        ) : captionError ? (
          <p className="text-xs italic text-slate-500">{captionError}</p>
        ) : caption ? (
          <p className="text-sm leading-relaxed text-slate-200">{caption}</p>
        ) : (
          <p className="text-xs italic text-slate-500">No summary available</p>
        )}
      </footer>

      <footer className="mt-auto space-y-3 border-t border-white/10 pt-4">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Verifiable Science (IPFS)
        </p>
        {!ipfsCID ? (
          <button
            type="button"
            onClick={() => void handleIPFSUpload()}
            disabled={ipfsUploading}
            data-agent-action="verify-on-ipfs"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b4a]/60"
          >
            {ipfsUploading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Uploading to IPFS...</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <span>Verify on IPFS</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-2 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-emerald-400">
                  Stored on IPFS
                </p>
                <p className="mt-1.5 break-all font-mono text-[11px] text-slate-300">
                  Verifiable science: ipfs://{ipfsCID}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleCopyCID()}
                className="shrink-0 rounded p-1.5 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b4a]/60"
                aria-label={cidCopied ? "CID copied" : "Copy CID"}
              >
                {cidCopied ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-emerald-400"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex gap-2">
              <a
                href={getGatewayURL(ipfsCID)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-md bg-white/5 px-2.5 py-1.5 text-center text-xs font-medium transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b4a]/60"
              >
                View on Gateway
              </a>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(getIPFSProtocolURL(ipfsCID));
                  onNotify?.("Copied ipfs:// protocol URI", "success");
                }}
                className="flex-1 rounded-md bg-white/5 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b4a]/60"
              >
                Copy ipfs://
              </button>
            </div>
          </div>
        )}
        {ipfsError && (
          <p className="text-xs text-red-400">{ipfsError}</p>
        )}
      </footer>
    </article>
  );
}
