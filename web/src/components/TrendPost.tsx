"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  directionLabel,
  formatPValue,
  significanceClass,
  significanceLabel,
  significanceMark,
} from "@/lib/labels";
import { TrendPostSkeleton } from "@/components/TrendPostSkeleton";
import { uploadTrendToIPFS, getCachedCID, getGatewayURL, getIPFSProtocolURL } from "@/lib/ipfs";
import type { TrendState } from "@/lib/types";

type TrendPostProps = {
  state: TrendState;
  caption?: string | null;
  captionLoading?: boolean;
  captionError?: string | null;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  onCopyLink?: () => void | Promise<boolean>;
};

export function TrendPost({
  state,
  caption,
  captionLoading,
  captionError,
  isBookmarked,
  onBookmarkToggle,
  onCopyLink,
}: TrendPostProps) {
  switch (state.status) {
    case "idle":
      return (
        <section className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-300">No region selected</p>
          <p className="max-w-[16rem] text-sm leading-relaxed text-slate-500">
            Choose a marker on the globe or a region in the list to load a NASA POWER trend and
            significance verdict.
          </p>
        </section>
      );
    case "loading":
      return <TrendPostSkeleton />;
    case "error":
      return (
        <section className="p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-red-300/80">NASA POWER</p>
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
}: {
  state: Extract<TrendState, { status: "ready" }>;
  caption?: string | null;
  captionLoading?: boolean;
  captionError?: string | null;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  onCopyLink?: () => void | Promise<boolean>;
}) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [ipfsUploading, setIpfsUploading] = useState(false);
  const [ipfsError, setIpfsError] = useState<string | null>(null);
  const [ipfsCID, setIpfsCID] = useState<string | null>(() => getCachedCID(state.trend));
  const [cidCopied, setCidCopied] = useState(false);

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
    }
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
    } catch (error: unknown) {
      setIpfsError(error instanceof Error ? error.message : "Upload failed");
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
    } catch (error: unknown) {
      console.error("Failed to copy CID:", error);
    }
  };

  const { trend } = state;
  const lineByYear = new Map(trend.slopeLine.map((point) => [point.year, point.value]));
  const rows = trend.annual.map((point) => ({
    year: point.year,
    temperature: point.value,
    trend: lineByYear.get(point.year) ?? null,
  }));
  const first = trend.series[0]?.date;
  const last = trend.series[trend.series.length - 1]?.date;
  const slopeText = `${trend.slopePerDecade >= 0 ? "+" : ""}${trend.slopePerDecade.toFixed(3)} ${trend.unit} / decade`;

  return (
    <article className="flex h-full flex-col gap-5 overflow-y-auto p-5 lg:p-6">
      <header>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Trend post</p>
            <h2 className="mt-2 text-2xl font-medium text-white">{trend.region.name}</h2>
            <p className="mt-1 text-sm text-slate-300">
              {trend.variableLabel}
              <span className="text-slate-500"> · {trend.variable}</span>
            </p>
            <p className="mt-3 text-sm text-[#ffb199]">{directionLabel(trend.direction)}</p>
          </div>
          <div className="flex gap-2">
            {onBookmarkToggle && (
              <button
                type="button"
                onClick={onBookmarkToggle}
                className="rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:border-white/20 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b4a]/60"
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
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
      {rows.length === 0 ? (
        <p className="text-sm text-red-200">The stats service returned no annual means to chart.</p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#163044" vertical={false} />
              <XAxis
                dataKey="year"
                stroke="#8aa0b8"
                tick={{ fill: "#8aa0b8", fontSize: 11 }}
                interval={4}
              />
              <YAxis
                stroke="#8aa0b8"
                tick={{ fill: "#8aa0b8", fontSize: 11 }}
                width={42}
                domain={["auto", "auto"]}
                tickFormatter={(value: number) => value.toFixed(0)}
              />
              <Tooltip
                contentStyle={{
                  background: "#0c1520",
                  border: "1px solid #1c2a3a",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#e7eef7" }}
                formatter={(value, name) => {
                  const numeric = typeof value === "number" ? value : Number(value);
                  const label = name === "trend" ? "Sen slope" : "Annual mean";
                  if (!Number.isFinite(numeric)) {
                    return ["—", label];
                  }
                  return [`${numeric.toFixed(2)} ${trend.unit}`, label];
                }}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                name="temperature"
                stroke="#ff7a59"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="trend"
                name="trend"
                stroke="#f4e1c1"
                dot={false}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="text-xs text-slate-500">
        Annual means of monthly {trend.variableLabel.toLowerCase()}. Dashed line is the Sen slope.
      </p>
      <div className="mt-auto space-y-3">
        <p className="font-mono text-lg text-white">{slopeText}</p>
        <p
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs ${significanceClass(trend.significance)}`}
        >
          <span>{significanceMark(trend.significance)}</span>
          <span>
            {significanceLabel(trend.significance)} · p = {formatPValue(trend.pValue)}
          </span>
        </p>
        <p className="font-mono text-xs text-slate-400">
          {trend.nMonths} months
          {first && last ? ` · ${first} – ${last}` : ""}
        </p>
        <p className="text-xs text-slate-500">NASA POWER · {trend.dataSource}</p>
      </div>
      <footer className="border-t border-white/10 pt-4">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
          AI Summary
        </p>
        {captionLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-white/10" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
          </div>
        ) : captionError ? (
          <p className="text-xs italic text-slate-500">{captionError}</p>
        ) : caption ? (
          <p className="text-sm leading-relaxed text-slate-300">{caption}</p>
        ) : (
          <p className="text-xs italic text-slate-500">No summary available</p>
        )}
      </footer>
      <footer className="space-y-3 border-t border-white/10 pt-4">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Verifiable Science
        </p>
        {!ipfsCID ? (
          <button
            type="button"
            onClick={() => void handleIPFSUpload()}
            disabled={ipfsUploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b4a]/60"
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
          <div className="space-y-2 rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-emerald-400">
                  Stored on IPFS
                </p>
                <p className="mt-1.5 break-all font-mono text-[11px] text-slate-300">
                  {ipfsCID}
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
                onClick={() => void navigator.clipboard.writeText(getIPFSProtocolURL(ipfsCID))}
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
