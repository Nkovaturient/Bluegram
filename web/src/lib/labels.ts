import type { Direction, Significance } from "@/lib/types";

export function directionLabel(direction: Direction): string {
  switch (direction) {
    case "increasing":
      return "Increasing";
    case "decreasing":
      return "Decreasing";
    case "no trend":
      return "No trend";
    default: {
      const exhaustive: never = direction;
      return exhaustive;
    }
  }
}

export function significanceLabel(significance: Significance): string {
  switch (significance) {
    case "significant":
      return "Significant";
    case "borderline":
      return "Borderline";
    case "not_significant":
      return "Not significant";
    default: {
      const exhaustive: never = significance;
      return exhaustive;
    }
  }
}

export function significanceMark(significance: Significance): string {
  switch (significance) {
    case "significant":
      return "✓";
    case "borderline":
      return "⚠";
    case "not_significant":
      return "–";
    default: {
      const exhaustive: never = significance;
      return exhaustive;
    }
  }
}

export function significanceClass(significance: Significance): string {
  switch (significance) {
    case "significant":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
    case "borderline":
      return "border-amber-400/40 bg-amber-400/10 text-amber-200";
    case "not_significant":
      return "border-slate-400/30 bg-slate-400/10 text-slate-300";
    default: {
      const exhaustive: never = significance;
      return exhaustive;
    }
  }
}

export function formatPValue(pValue: number): string {
  if (pValue < 0.001) {
    return pValue.toExponential(2);
  }
  return pValue.toFixed(3);
}

export function formatCoord(latitude: number, longitude: number): string {
  const latHemisphere = latitude >= 0 ? "N" : "S";
  const lonHemisphere = longitude >= 0 ? "E" : "W";
  const lat = `${Math.abs(latitude).toFixed(1)}°${latHemisphere}`;
  const lon = `${Math.abs(longitude).toFixed(1)}°${lonHemisphere}`;
  return `${lat}, ${lon}`;
}
