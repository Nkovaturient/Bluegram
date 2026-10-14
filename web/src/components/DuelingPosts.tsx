"use client";

import { useEffect, useState } from "react";
import {
  directionLabel,
  formatPValue,
  significanceClass,
  significanceLabel,
  significanceMark,
} from "@/lib/labels";
import type { TrendResponse } from "@/lib/types";

type DuelingPostsProps = {
  trendA: TrendResponse | null;
  trendB: TrendResponse | null;
  captionA: string | null;
  captionB: string | null;
  loadingA: boolean;
  loadingB: boolean;
  comparisonReason?: string;
};

export function DuelingPosts({
  trendA,
  trendB,
  captionA,
  captionB,
  loadingA,
  loadingB,
  comparisonReason,
}: DuelingPostsProps) {
  const [comparisonCaption, setComparisonCaption] = useState<string | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  const hasOpposingSlopes =
    trendA && trendB &&
    ((trendA.slopePerDecade > 0 && trendB.slopePerDecade < 0) ||
      (trendA.slopePerDecade < 0 && trendB.slopePerDecade > 0));

  useEffect(() => {
    if (!trendA || !trendB || !hasOpposingSlopes) {
      setComparisonCaption(null);
      return;
    }

    const fetchComparisonCaption = async () => {
      setComparisonLoading(true);
      try {
        const response = await fetch("/api/caption", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            regionName: `${trendA.region.name} vs ${trendB.region.name}`,
            variableLabel: trendA.variableLabel,
            direction: "contradiction",
            significance: "significant",
            pValue: Math.min(trendA.pValue, trendB.pValue),
            slopePerDecade: trendA.slopePerDecade - trendB.slopePerDecade,
            unit: trendA.unit,
            nMonths: Math.min(trendA.nMonths, trendB.nMonths),
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as { caption: string };
          setComparisonCaption(data.caption);
        }
      } catch (error: unknown) {
        console.error("Failed to fetch comparison caption:", error);
      } finally {
        setComparisonLoading(false);
      }
    };

    void fetchComparisonCaption();
  }, [trendA, trendB, hasOpposingSlopes]);

  if (!trendA && !trendB) {
    return (
      <section className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm font-medium text-slate-300">No regions selected</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            Select a contradiction pair to compare trends from two regions.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5 lg:p-6">
      {hasOpposingSlopes && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-4">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 shrink-0 text-amber-400"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" x2="12" y1="9" y2="13" />
              <line x1="12" x2="12.01" y1="17" y2="17" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">Same driver. Opposite direction.</p>
              {comparisonReason && (
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{comparisonReason}</p>
              )}
              {comparisonLoading && (
                <div className="mt-2 space-y-1.5">
                  <div className="h-3 w-full animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
                </div>
              )}
              {!comparisonLoading && comparisonCaption && (
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{comparisonCaption}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {trendA ? (
          <TrendCard trend={trendA} caption={captionA} loading={loadingA} label="Region A" />
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">Region A loading...</p>
          </div>
        )}
        {trendB ? (
          <TrendCard trend={trendB} caption={captionB} loading={loadingB} label="Region B" />
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">Region B loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TrendCard({
  trend,
  caption,
  loading,
  label,
}: {
  trend: TrendResponse;
  caption: string | null;
  loading: boolean;
  label: string;
}) {
  const slopeText = `${trend.slopePerDecade >= 0 ? "+" : ""}${trend.slopePerDecade.toFixed(3)} ${trend.unit} / decade`;
  const first = trend.series[0]?.date;
  const last = trend.series[trend.series.length - 1]?.date;

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#0c1520]/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{trend.region.name}</h3>
          <p className="mt-0.5 text-sm text-slate-300">
            {trend.variableLabel}
            <span className="text-slate-500"> · {trend.variable}</span>
          </p>
          <p className="mt-2 text-sm text-[#ffb199]">{directionLabel(trend.direction)}</p>
        </div>
        <div
          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${significanceClass(trend.significance)}`}
        >
          {significanceMark(trend.significance)}
        </div>
      </div>

      <div className="space-y-1.5 border-t border-white/5 pt-3">
        <p className="font-mono text-base text-white">{slopeText}</p>
        <p className="font-mono text-xs text-slate-400">
          p = {formatPValue(trend.pValue)} · {trend.nMonths} months
          {first && last && ` · ${first} – ${last}`}
        </p>
      </div>

      {caption && (
        <div className="border-t border-white/5 pt-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Summary</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{caption}</p>
        </div>
      )}
      {loading && (
        <div className="space-y-1.5">
          <div className="h-3 w-full animate-pulse rounded bg-white/10" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
        </div>
      )}
    </article>
  );
}
