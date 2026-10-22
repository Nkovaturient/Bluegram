import type { TrendResponse } from "@/lib/types";

type IPFSUploadResponse = {
  cid: string;
  gateway_url: string;
  timestamp: string;
  size: number;
};

type IPFSUploadError = {
  error: string;
};

type StoredCidEntry = {
  cid: string;
  gateway_url: string;
  timestamp: string;
};

const STORAGE_KEY = "bluegram:ipfs-cids";
const uploadCache = new Map<string, StoredCidEntry>();
let hydrated = false;

function getCacheKey(trend: Pick<TrendResponse, "region" | "variable">): string {
  return `${trend.region.id}:${trend.variable}`;
}

function hydrateFromStorage(): void {
  if (hydrated || typeof window === "undefined") {
    return;
  }
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as Record<string, StoredCidEntry | string>;
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.length > 0) {
        uploadCache.set(key, {
          cid: value,
          gateway_url: getGatewayURL(value),
          timestamp: "",
        });
      } else if (
        value &&
        typeof value === "object" &&
        typeof value.cid === "string" &&
        value.cid.length > 0
      ) {
        uploadCache.set(key, {
          cid: value.cid,
          gateway_url: value.gateway_url || getGatewayURL(value.cid),
          timestamp: value.timestamp || "",
        });
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }
}

function persistToStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const serializable: Record<string, StoredCidEntry> = {};
    for (const [key, entry] of uploadCache.entries()) {
      serializable[key] = entry;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Ignore localStorage quota/security errors
  }
}

export async function uploadTrendToIPFS(trend: TrendResponse): Promise<IPFSUploadResponse> {
  hydrateFromStorage();
  const cacheKey = getCacheKey(trend);
  const cached = uploadCache.get(cacheKey);

  if (cached) {
    return {
      cid: cached.cid,
      gateway_url: cached.gateway_url,
      timestamp: cached.timestamp,
      size: 0,
    };
  }

  const payload = {
    region: {
      id: trend.region.id,
      name: trend.region.name,
      latitude: trend.region.latitude,
      longitude: trend.region.longitude,
    },
    variable: trend.variable,
    variableLabel: trend.variableLabel,
    unit: trend.unit,
    dataSource: trend.dataSource,
    statistics: {
      direction: trend.direction,
      significance: trend.significance,
      pValue: trend.pValue,
      slopePerYear: trend.slopePerYear,
      slopePerDecade: trend.slopePerDecade,
      mkTrend: trend.mkTrend,
      nMonths: trend.nMonths,
    },
    series: trend.series,
    annual: trend.annual,
    slopeLine: trend.slopeLine,
    metadata: {
      uploadedAt: new Date().toISOString(),
      platform: "Bluegram",
      version: "1.0",
    },
  };

  const response = await fetch("/api/ipfs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error: IPFSUploadError = await response.json();
    throw new Error(error.error || "Failed to upload to IPFS");
  }

  const data: IPFSUploadResponse = await response.json();

  uploadCache.set(cacheKey, {
    cid: data.cid,
    gateway_url: data.gateway_url,
    timestamp: data.timestamp,
  });
  persistToStorage();

  return data;
}

export function getCachedCID(trend: Pick<TrendResponse, "region" | "variable">): string | null {
  hydrateFromStorage();
  const cacheKey = getCacheKey(trend);
  return uploadCache.get(cacheKey)?.cid ?? null;
}

export function getGatewayURL(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

export function getIPFSProtocolURL(cid: string): string {
  return `ipfs://${cid}`;
}
