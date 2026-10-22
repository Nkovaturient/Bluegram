"use client";

import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getVariablePalette } from "@/lib/variableMeta";
import type { TrendResponse } from "@/lib/types";

type TrendMiniChartProps = {
  trend: TrendResponse;
  heightClassName?: string;
};

export function TrendMiniChart({
  trend,
  heightClassName = "h-44",
}: TrendMiniChartProps) {
  const palette = getVariablePalette(trend.variable);
  const lineByYear = new Map(trend.slopeLine.map((point) => [point.year, point.value]));
  const rows = trend.annual.map((point) => ({
    year: point.year,
    value: point.value,
    trend: lineByYear.get(point.year) ?? null,
  }));

  if (rows.length === 0) {
    return (
      <p className="text-sm text-red-200">
        The stats service returned no annual means to chart.
      </p>
    );
  }

  const values = rows.map((r) => r.value).filter((v) => Number.isFinite(v));
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 1;
  const span = Math.abs(maxVal - minVal);
  const maxAbs = Math.max(Math.abs(minVal), Math.abs(maxVal));

  const formatYTick = (value: number): string => {
    if (!Number.isFinite(value)) {
      return "";
    }
    if (span < 0.25 || maxAbs < 1) {
      return value.toFixed(2);
    }
    if (span < 3 || maxAbs < 10) {
      return value.toFixed(1);
    }
    return value.toFixed(0);
  };

  const gradientId = `chart-grad-${trend.region.id}-${trend.variable}`;

  return (
    <div className={`${heightClassName} w-full select-none`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 10, right: 10, left: -4, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.lineStroke} stopOpacity={0.22} />
              <stop offset="95%" stopColor={palette.lineStroke} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 10.5, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            minTickGap={34}
            tickMargin={6}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 10.5, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            width={44}
            domain={["auto", "auto"]}
            tickCount={4}
            tickFormatter={formatYTick}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(8, 14, 23, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: 10,
              fontSize: 12,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6)",
              fontFamily: "var(--font-mono)",
            }}
            labelStyle={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 4 }}
            formatter={(value, name) => {
              const numeric = typeof value === "number" ? value : Number(value);
              const label = name === "trend" ? "Sen slope" : "Annual mean";
              if (!Number.isFinite(numeric)) {
                return ["—", label];
              }
              const decimals = trend.variable === "precipitation" ? 3 : 2;
              return [`${numeric.toFixed(decimals)} ${trend.unit}`, label];
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            fill={`url(#${gradientId})`}
            stroke="none"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="value"
            stroke={palette.lineStroke}
            dot={false}
            strokeWidth={2}
            activeDot={{ r: 4, fill: palette.lineStroke, stroke: "#04090f", strokeWidth: 1.5 }}
          />
          <Line
            type="monotone"
            dataKey="trend"
            name="trend"
            stroke={palette.senStroke}
            dot={false}
            strokeWidth={1.75}
            strokeDasharray="6 4"
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
