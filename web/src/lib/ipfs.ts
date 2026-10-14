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

const uploadCache = new Map<string, string>();

function getCacheKey(trend: TrendResponse): string {
  return `${trend.region.id}:${trend.variable}:${trend.nMonths}`;
}

export async function uploadTrendToIPFS(trend: TrendResponse): Promise<IPFSUploadResponse> {
  const cacheKey = getCacheKey(trend);
  const cached = uploadCache.get(cacheKey);
  
  if (cached) {
    const [cid, gateway_url, timestamp] = cached.split("|");
    return {
      cid,
      gateway_url,
      timestamp,
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
  
  uploadCache.set(cacheKey, `${data.cid}|${data.gateway_url}|${data.timestamp}`);

  return data;
}

export function getCachedCID(trend: TrendResponse): string | null {
  const cacheKey = getCacheKey(trend);
  const cached = uploadCache.get(cacheKey);
  if (cached) {
    const [cid] = cached.split("|");
    return cid;
  }
  return null;
}

export function getGatewayURL(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

export function getIPFSProtocolURL(cid: string): string {
  return `ipfs://${cid}`;
}
