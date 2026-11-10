"use client";

import { useEffect, useState } from "react";
import { TrendMiniChart } from "@/components/TrendMiniChart";
import {
  directionLabel,
  formatCoord,
  formatPValue,
  significanceClass,
  significanceLabel,
  significanceMark,
} from "@/lib/labels";
import { getVariablePalette } from "@/lib/variableMeta";
import type { TrendResponse, TrendState } from "@/lib/types";

type DuelingPostsProps = {
  stateA: TrendState;
  stateB: TrendState;
  captionA: string | null;
  captionB: string | null;
  loadingA: boolean;
  loadingB: boolean;
  comparisonReason?: string;
  pairTitle?: string;
  pairSubtitle?: string;
};

export function DuelingPosts({
  stateA,
  stateB,
  captionA,
  captionB,
  loadingA,
  loadingB,
  comparisonReason,
  pairTitle,
  pairSubtitle,
}: DuelingPostsProps) {
  const [comparisonCaption, setComparisonCaption] = useState<string | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [mechanismExpanded, setMechanismExpanded] = useState(false);

  const trendA = stateA.status === "ready" ? stateA.trend : null;
  const trendB = stateB.status === "ready" ? stateB.trend : null;

  const hasOpposingSlopes = Boolean(
    trendA &&
      trendB &&
      ((trendA.slopePerDecade > 0 && trendB.slopePerDecade < 0) ||
        (trendA.slopePerDecade < 0 && trendB.slopePerDecade > 0)),
  );

  useEffect(() => {
    if (!trendA || !trendB) {
      setComparisonCaption(null);
      return;
    }

    let cancelled = false;

    const fetchComparisonCaption = async () => {
      setComparisonLoading(true);
      try {
        const response = await fetch("/api/caption", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            regionName: trendA.region.name,
            variableLabel: trendA.variableLabel,
            direction: trendA.direction,
            significance:
              trendA.significance === "significant" || trendB.significance === "significant"
                ? "significant"
                : "not_significant",
            pValue: Math.min(trendA.pValue, trendB.pValue),
            slopePerDecade: trendA.slopePerDecade,
            unit: trendA.unit,
            nMonths: Math.min(trendA.nMonths, trendB.nMonths),
            comparisonMode: true,
            regionBName: trendB.region.name,
            slopeB: trendB.slopePerDecade,
          }),
        });

        if (!cancelled && response.ok) {
          const data = (await response.json()) as { caption: string };
          setComparisonCaption(data.caption);
        }
      } catch (error: unknown) {
        console.error("Failed to fetch comparison caption:", error);
      } finally {
        if (!cancelled) {
          setComparisonLoading(false);
        }
      }
    };

    void fetchComparisonCaption();

    return () => {
      cancelled = true;
    };
  }, [trendA, trendB]);

  if (stateA.status === "idle" && stateB.status === "idle") {
    return (
      <section className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <p className="font-display text-sm font-medium text-slate-300">No regions selected</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            Select a contradiction pair from the header bar to compare regional telemetry.
          </p>
        </div>
      </section>
    );
  }

  const slopeDelta =
    trendA && trendB ? Math.abs(trendA.slopePerDecade - trendB.slopePerDecade) : null;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 scrollbar-thin sm:p-5 lg:p-6">
      {/* Compact Telemetry Mechanism Header */}
      <section
        className={`rounded-2xl border p-4 transition-colors ${
          hasOpposingSlopes
            ? "border-amber-400/35 bg-gradient-to-br from-amber-500/[0.08] via-[#0c1624] to-[#08101a]"
            : "border-white/10 bg-[#0b1420]/90"
        }`}
        aria-label="Comparison synthesis"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
              hasOpposingSlopes
                ? "border-amber-400/45 bg-amber-400/15 text-amber-300"
                : "border-indigo-400/35 bg-indigo-500/12 text-indigo-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasOpposingSlopes ? "bg-amber-400" : "bg-indigo-400"
              }`}
            />
            {hasOpposingSlopes
              ? "Same Driver · Opposite Direction"
              : "Regional Trend Divergence"}
          </span>

          {slopeDelta !== null && trendA && (
            <span className="font-mono text-[11px] tabular-nums text-slate-400">
              |Δ slope|{" "}
              <strong className="text-white">
                {slopeDelta.toFixed(3)} {trendA.unit}/dec
              </strong>
            </span>
          )}
        </div>

        {pairTitle && (
          <h2 className="mt-2.5 font-display text-base font-semibold tracking-tight text-white">
            {pairTitle}
          </h2>
        )}
        {pairSubtitle && (
          <p className="mt-0.5 text-xs text-slate-400">{pairSubtitle}</p>
        )}

        {comparisonLoading ? (
          <div className="mt-3 space-y-1.5">
            <div className="h-3 w-full animate-pulse rounded bg-white/10" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
          </div>
        ) : comparisonCaption ? (
          <p className="mt-2.5 text-xs leading-relaxed text-slate-200">
            {comparisonCaption}
          </p>
        ) : null}

        {comparisonReason && (
          <div className="mt-3 border-t border-white/10 pt-2.5">
            <button
              type="button"
              onClick={() => setMechanismExpanded((prev) => !prev)}
              aria-expanded={mechanismExpanded}
              className="flex w-full items-center justify-between text-left font-mono text-[10px] font-medium uppercase tracking-wider text-slate-400 transition-colors hover:text-white"
            >
              <span>Physical Mechanism &amp; Prior Art</span>
              <span className="text-xs">{mechanismExpanded ? "−" : "+"}</span>
            </button>
            {mechanismExpanded && (
              <div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-300 animate-fade-in">
                <p>{comparisonReason}</p>
                <p className="text-[11px] text-slate-400">
                  Tri-agency reference:{" "}
                  <a
                    href="https://eodashboard.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
                  >
                    Earth Observing Dashboard (NASA · ESA · JAXA)
                  </a>
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Stacked Telemetry Cards — full drawer width for legible axes */}
      <div className="flex flex-col gap-4">
        <SidePane
          state={stateA}
          caption={captionA}
          captionLoading={loadingA}
          label="Region A · Left Globe"
        />
        <SidePane
          state={stateB}
          caption={captionB}
          captionLoading={loadingB}
          label="Region B · Right Globe"
        />
      </div>
    </div>
  );
}

function SidePane({
  state,
  caption,
  captionLoading,
  label,
}: {
  state: TrendState;
  caption: string | null;
  captionLoading: boolean;
  label: string;
}) {
  switch (state.status) {
    case "idle":
    case "loading":
      return (
        <div className="telemetry-card flex flex-col gap-3 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {label}
            </p>
            <div className="h-5 w-20 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="h-6 w-1/2 animate-pulse rounded bg-white/10" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-white/[0.04]" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
        </div>
      );
    case "error":
      return (
        <div className="flex flex-col gap-2 rounded-2xl border border-red-400/30 bg-red-500/5 p-4 sm:p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-red-300/80">
            {label} · Telemetry Error
          </p>
          <p className="text-xs leading-relaxed text-red-200">{state.message}</p>
        </div>
      );
    case "ready":
      return (
        <TrendCard
          trend={state.trend}
          caption={caption}
          loading={captionLoading}
          label={label}
        />
      );
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
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
  const palette = getVariablePalette(trend.variable);
  const slopeSign = trend.slopePerDecade >= 0 ? "+" : "";
  const slopeText = `${slopeSign}${trend.slopePerDecade.toFixed(3)} ${trend.unit}/decade`;
  const first = trend.series[0]?.date;
  const last = trend.series[trend.series.length - 1]?.date;

  return (
    <article className="telemetry-card flex flex-col gap-3.5 rounded-2xl p-4 transition-all hover:border-white/15 sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {label}
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {formatCoord(trend.region.latitude, trend.region.longitude)}
            </span>
          </div>
          <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-white">
            {trend.region.name}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-pill border px-2 py-0.5 font-mono text-[10px] font-medium ${palette.badgeClass}`}
            >
              {trend.variableLabel} · {palette.parameterCode}
            </span>
            <span className="text-xs font-medium text-slate-300">
              {directionLabel(trend.direction)}
            </span>
          </div>
        </div>

        <div
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-1 font-mono text-[11px] font-medium ${significanceClass(
            trend.significance,
          )}`}
          title={significanceLabel(trend.significance)}
        >
          <span>{significanceMark(trend.significance)}</span>
          <span>{significanceLabel(trend.significance)}</span>
        </div>
      </header>

      <div className="rounded-xl border border-white/[0.06] bg-[#060c14]/70 p-2.5">
        <TrendMiniChart trend={trend} heightClassName="h-40" />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-white/8 pt-3">
        <p className="font-mono text-base font-semibold tabular-nums text-white">
          {slopeText}
        </p>
        <p className="font-mono text-[11px] tabular-nums text-slate-400">
          p = {formatPValue(trend.pValue)}
          {typeof trend.qValue === "number" ? ` · q = ${formatPValue(trend.qValue)}` : ""} ·{" "}
          {trend.nMonths} mo
          {first && last ? ` (${first.slice(0, 4)}–${last.slice(0, 4)})` : ""}
        </p>
      </div>

      {trend.supplemental && (
        <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/[0.05] px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold text-indigo-300">
              {trend.supplemental.agency}
            </span>
            <span className="font-mono text-[10px] text-indigo-200/80">
              {trend.supplemental.badge}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-300">{trend.supplemental.indexName}</p>
        </div>
      )}

      {caption && (
        <div className="border-t border-white/8 pt-2.5">
          <p className="text-xs leading-relaxed text-slate-300">{caption}</p>
        </div>
      )}
      {loading && (
        <div className="space-y-1.5 pt-1">
          <div className="h-3 w-full animate-pulse rounded bg-white/10" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
        </div>
      )}
    </article>
  );
}
