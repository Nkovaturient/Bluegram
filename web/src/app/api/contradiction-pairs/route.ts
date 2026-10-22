import { NextResponse } from "next/server";
import {
  CURATED_CONTRADICTION_PAIRS,
  type ContradictionPair,
} from "@/lib/contradictionPairs";
import { REGION_BY_ID } from "@/lib/regions";
import { statsBaseUrl } from "@/lib/stats";
import type { Direction, Region, Significance, VariableId } from "@/lib/types";

export const runtime = "nodejs";

type TrendSummaryPoint = {
  regionId: string;
  slopePerDecade: number;
  direction: Direction;
  significance: Significance;
  pValue: number;
  unit: string;
  error?: string;
};

type TrendsApiResponse = {
  variable?: string;
  unit?: string;
  points?: unknown[];
};

type RegionsApiResponse = {
  regions?: unknown[];
};

export type ContradictionPairsResponse = {
  curated: ContradictionPair[];
  live: ContradictionPair[];
};

function parseValidPoint(raw: unknown): TrendSummaryPoint | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const rec = raw as Record<string, unknown>;
  if (rec.error) {
    return null;
  }
  const regionId = rec.regionId;
  const slopePerDecade = rec.slopePerDecade;
  const direction = rec.direction;
  const significance = rec.significance;
  const pValue = rec.pValue;
  const unit = rec.unit;

  if (
    typeof regionId !== "string" ||
    typeof slopePerDecade !== "number" ||
    !Number.isFinite(slopePerDecade) ||
    (direction !== "increasing" && direction !== "decreasing" && direction !== "no trend") ||
    (significance !== "significant" &&
      significance !== "borderline" &&
      significance !== "not_significant") ||
    typeof pValue !== "number" ||
    !Number.isFinite(pValue) ||
    typeof unit !== "string"
  ) {
    return null;
  }

  return {
    regionId,
    slopePerDecade,
    direction,
    significance,
    pValue,
    unit,
  };
}

function pairRegionKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}::${idB}` : `${idB}::${idA}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawVar = searchParams.get("variable");
  const variable: VariableId = rawVar === "precipitation" ? "precipitation" : "temperature";

  const baseUrl = statsBaseUrl();
  const knownRegions = new Map<string, Region>(REGION_BY_ID);

  try {
    const regionsRes = await fetch(`${baseUrl}/api/regions`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (regionsRes.ok) {
      const regionsData = (await regionsRes.json()) as RegionsApiResponse;
      if (Array.isArray(regionsData.regions)) {
        knownRegions.clear();
        for (const item of regionsData.regions) {
          if (typeof item === "object" && item !== null) {
            const r = item as Record<string, unknown>;
            if (
              typeof r.id === "string" &&
              typeof r.name === "string" &&
              typeof r.latitude === "number" &&
              typeof r.longitude === "number"
            ) {
              knownRegions.set(r.id, {
                id: r.id,
                name: r.name,
                latitude: r.latitude,
                longitude: r.longitude,
              });
            }
          }
        }
      }
    }
  } catch {
    // Fall back to static REGION_BY_ID catalog when stats /api/regions is unreachable
  }

  const curated = CURATED_CONTRADICTION_PAIRS.filter(
    (pair) => knownRegions.has(pair.regionA.id) && knownRegions.has(pair.regionB.id),
  ).map((pair) => ({
    ...pair,
    regionA: knownRegions.get(pair.regionA.id) ?? pair.regionA,
    regionB: knownRegions.get(pair.regionB.id) ?? pair.regionB,
    source: "curated" as const,
  }));

  const curatedKeys = new Set(
    curated.map((p) => pairRegionKey(p.regionA.id, p.regionB.id)),
  );

  const live: ContradictionPair[] = [];

  try {
    const trendsRes = await fetch(
      `${baseUrl}/api/trends?variable=${encodeURIComponent(variable)}`,
      {
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      },
    );

    if (trendsRes.ok) {
      const trendsData = (await trendsRes.json()) as TrendsApiResponse;
      const rawPoints = Array.isArray(trendsData.points) ? trendsData.points : [];
      const validPoints: TrendSummaryPoint[] = [];

      for (const raw of rawPoints) {
        const parsed = parseValidPoint(raw);
        if (
          parsed &&
          knownRegions.has(parsed.regionId) &&
          parsed.significance === "significant" &&
          parsed.direction !== "no trend"
        ) {
          validPoints.push(parsed);
        }
      }

      const increasing = validPoints.filter(
        (pt) => pt.direction === "increasing" && pt.slopePerDecade > 0,
      );
      const decreasing = validPoints.filter(
        (pt) => pt.direction === "decreasing" && pt.slopePerDecade < 0,
      );

      type Candidate = {
        inc: TrendSummaryPoint;
        dec: TrendSummaryPoint;
        regA: Region;
        regB: Region;
        contrast: number;
      };

      const candidates: Candidate[] = [];
      for (const inc of increasing) {
        const regA = knownRegions.get(inc.regionId);
        if (!regA) continue;
        for (const dec of decreasing) {
          const regB = knownRegions.get(dec.regionId);
          if (!regB) continue;
          if (curatedKeys.has(pairRegionKey(regA.id, regB.id))) {
            continue;
          }
          const latDiff = Math.abs(regA.latitude - regB.latitude);
          const lonDiff = Math.abs(regA.longitude - regB.longitude);
          if (latDiff > 20 || lonDiff > 30) {
            candidates.push({
              inc,
              dec,
              regA,
              regB,
              contrast: Math.abs(inc.slopePerDecade - dec.slopePerDecade),
            });
          }
        }
      }

      candidates.sort((a, b) => b.contrast - a.contrast);

      for (const cand of candidates.slice(0, 10)) {
        const unitLabel = cand.inc.unit || (variable === "temperature" ? "°C" : "mm/day");
        live.push({
          id: `dynamic-${cand.regA.id}-${cand.regB.id}`,
          name: `${cand.regA.name} vs ${cand.regB.name}`,
          description: `Live opposite ${variable} trends on NASA POWER`,
          regionA: cand.regA,
          regionB: cand.regB,
          variable,
          reason: `${cand.regA.name} is rising at +${Math.abs(cand.inc.slopePerDecade).toFixed(3)} ${unitLabel}/decade (p = ${cand.inc.pValue.toFixed(4)}), while ${cand.regB.name} is declining at -${Math.abs(cand.dec.slopePerDecade).toFixed(3)} ${unitLabel}/decade (p = ${cand.dec.pValue.toFixed(4)}).`,
          category: variable === "precipitation" ? "precipitation" : "atmosphere",
          source: "live",
        });
      }
    }
  } catch (error: unknown) {
    console.error("Failed to compute live contradiction pairs:", error);
  }

  const body: ContradictionPairsResponse = { curated, live };
  return NextResponse.json(body);
}
