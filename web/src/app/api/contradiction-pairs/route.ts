import { NextResponse } from "next/server";
import type { ContradictionPair } from "@/lib/contradictionPairs";
import { CURATED_CONTRADICTION_PAIRS } from "@/lib/contradictionPairs";

export const runtime = "nodejs";

type FeedItem = {
  region: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  slopePerDecade: number;
  pValue: number;
  direction: string;
  significance: string;
};

type RegionsResponse = {
  regions: FeedItem[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const variable = searchParams.get("variable") || "temperature";
  const includeHardcoded = searchParams.get("hardcoded") !== "false";

  const result: ContradictionPair[] = includeHardcoded ? [...CURATED_CONTRADICTION_PAIRS] : [];

  try {
    const statsUrl = process.env.NEXT_PUBLIC_STATS_URL || "http://localhost:8000";
    const response = await fetch(`${statsUrl}/api/regions?variable=${variable}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error("Stats API error:", response.status);
      return NextResponse.json(result);
    }

    const data = (await response.json()) as RegionsResponse;
    const items = data.regions;

    const increasing = items.filter(
      (item) => item.direction === "increasing" && item.significance === "significant"
    );
    const decreasing = items.filter(
      (item) => item.direction === "decreasing" && item.significance === "significant"
    );

    let pairIndex = 0;
    for (const inc of increasing) {
      for (const dec of decreasing) {
        if (pairIndex >= 20) {
          break;
        }

        const latDiff = Math.abs(inc.region.latitude - dec.region.latitude);
        const lonDiff = Math.abs(inc.region.longitude - dec.region.longitude);
        
        if (latDiff > 20 || lonDiff > 30) {
          const dynamicPair: ContradictionPair = {
            id: `dynamic-${inc.region.id}-${dec.region.id}`,
            name: `${inc.region.name} vs ${dec.region.name}`,
            description: `Opposite ${variable} trends detected`,
            regionA: inc.region,
            regionB: dec.region,
            variable: variable as "temperature" | "precipitation",
            reason: `${inc.region.name} shows ${Math.abs(inc.slopePerDecade).toFixed(3)} ${variable === "temperature" ? "°C" : "mm/day"}/decade increase (p=${inc.pValue.toFixed(4)}), while ${dec.region.name} shows ${Math.abs(dec.slopePerDecade).toFixed(3)} ${variable === "temperature" ? "°C" : "mm/day"}/decade decrease (p=${dec.pValue.toFixed(4)}).`,
            category: "atmosphere",
          };
          
          result.push(dynamicPair);
          pairIndex++;
        }
      }
      if (pairIndex >= 20) {
        break;
      }
    }
  } catch (error: unknown) {
    console.error("Failed to fetch dynamic pairs:", error);
  }

  return NextResponse.json(result);
}
