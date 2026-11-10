import type {
  AnnualPoint,
  Direction,
  EonetEvent,
  FeedItem,
  Region,
  SeriesPoint,
  Significance,
  SlopePoint,
  SupplementalInfo,
  TrendResponse,
  VariableId,
} from "@/lib/types";
import { getRegionType } from "@/lib/regionMeta";

export function statsBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_STATS_URL;
  if (typeof configured === "string" && configured.trim().length > 0) {
    return configured.trim().replace(/\/$/, "");
  }
  return "http://localhost:8000";
}

export async function fetchRegions(signal: AbortSignal): Promise<Region[]> {
  const response = await fetch(`${statsBaseUrl()}/api/regions`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray((body as { regions?: unknown }).regions)
  ) {
    throw new Error("Stats service returned an unexpected region list");
  }
  const regions: Region[] = [];
  for (const item of (body as { regions: unknown[] }).regions) {
    const region = readRegion(item);
    if (region) {
      regions.push(region);
    }
  }
  if (regions.length === 0) {
    throw new Error("Stats service returned no regions");
  }
  return regions;
}

export async function fetchTrend(
  regionId: string,
  variable: VariableId,
  signal: AbortSignal,
): Promise<TrendResponse> {
  const url = `${statsBaseUrl()}/api/trend?region=${encodeURIComponent(regionId)}&variable=${encodeURIComponent(variable)}`;
  let response: Response;
  try {
    response = await fetch(url, { signal, cache: "no-store" });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new Error(`Cannot reach the stats service at ${statsBaseUrl()}`);
  }
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const body: unknown = await response.json();
  const trend = readTrend(body);
  if (!trend) {
    throw new Error("Stats service returned an unexpected trend payload");
  }
  return trend;
}

export async function fetchSlopes(
  variable: VariableId,
  signal: AbortSignal,
): Promise<SlopePoint[]> {
  const url = `${statsBaseUrl()}/api/trends?variable=${encodeURIComponent(variable)}`;
  let response: Response;
  try {
    response = await fetch(url, { signal, cache: "no-store" });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new Error(`Cannot reach the stats service at ${statsBaseUrl()}`);
  }
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray((body as { points?: unknown }).points)
  ) {
    throw new Error("Stats service returned an unexpected slope list");
  }
  const slopes: SlopePoint[] = [];
  for (const item of (body as { points: unknown[] }).points) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const regionId = (item as { regionId?: unknown }).regionId;
    const slopePerDecade = (item as { slopePerDecade?: unknown }).slopePerDecade;
    if (
      typeof regionId === "string" &&
      typeof slopePerDecade === "number" &&
      Number.isFinite(slopePerDecade)
    ) {
      slopes.push({ regionId, slopePerDecade });
    }
  }
  return slopes;
}

export async function fetchFeedSummary(
  variable: VariableId,
  signal: AbortSignal,
): Promise<FeedItem[]> {
  const regions = await fetchRegions(signal);
  const regionMap = new Map(regions.map((r) => [r.id, r]));

  const url = `${statsBaseUrl()}/api/trends?variable=${encodeURIComponent(variable)}`;
  let response: Response;
  try {
    response = await fetch(url, { signal, cache: "no-store" });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new Error(`Cannot reach the stats service at ${statsBaseUrl()}`);
  }
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray((body as { points?: unknown }).points)
  ) {
    throw new Error("Stats service returned an unexpected feed summary");
  }
  const record = body as { variable?: unknown; points: unknown[] };
  const variableLabel =
    typeof record.variable === "string" ? getVariableLabel(record.variable) : variable;

  const items: FeedItem[] = [];
  for (const item of record.points) {
    const feedItem = readFeedItem(item, regionMap, variableLabel);
    if (feedItem) {
      items.push(feedItem);
    }
  }
  items.sort((a, b) => {
    if (a.pValue !== b.pValue) {
      return a.pValue - b.pValue;
    }
    return Math.abs(b.slopePerDecade) - Math.abs(a.slopePerDecade);
  });
  return items;
}

function getVariableLabel(variableId: string): string {
  switch (variableId) {
    case "temperature":
      return "Temperature";
    case "precipitation":
      return "Precipitation";
    case "solar":
      return "Solar radiation";
    case "humidity":
      return "Relative humidity";
    default:
      return variableId;
  }
}

function readFeedItem(
  value: unknown,
  regionMap: Map<string, Region>,
  variableLabel: string,
): FeedItem | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if ((record as { error?: unknown }).error) {
    return null;
  }
  const regionId = record.regionId;
  if (typeof regionId !== "string") {
    return null;
  }
  const region = regionMap.get(regionId);
  const direction = readDirection(record.direction);
  const significance = readSignificance(record.significance);
  if (
    !region ||
    !direction ||
    !significance ||
    typeof record.slopePerDecade !== "number" ||
    typeof record.pValue !== "number" ||
    typeof record.unit !== "string" ||
    !Number.isFinite(record.slopePerDecade) ||
    !Number.isFinite(record.pValue)
  ) {
    return null;
  }
  const qValue =
    typeof record.qValue === "number" && Number.isFinite(record.qValue)
      ? record.qValue
      : undefined;
  return {
    region,
    regionType: getRegionType(region.id),
    slopePerDecade: record.slopePerDecade,
    pValue: record.pValue,
    qValue,
    direction,
    significance,
    unit: record.unit,
    variableLabel,
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      typeof (body as { detail?: unknown }).detail === "string"
    ) {
      return (body as { detail: string }).detail;
    }
  } catch {
    return `Stats service returned HTTP ${response.status}`;
  }
  return `Stats service returned HTTP ${response.status}`;
}

function readRegion(value: unknown): Region | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.latitude !== "number" ||
    typeof record.longitude !== "number"
  ) {
    return null;
  }
  return {
    id: record.id,
    name: record.name,
    latitude: record.latitude,
    longitude: record.longitude,
  };
}

function readTrend(value: unknown): TrendResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const region = readRegion(record.region);
  const direction = readDirection(record.direction);
  const significance = readSignificance(record.significance);
  if (
    !region ||
    !direction ||
    !significance ||
    typeof record.variable !== "string" ||
    typeof record.variableLabel !== "string" ||
    typeof record.unit !== "string" ||
    typeof record.units !== "string" ||
    typeof record.dataSource !== "string" ||
    typeof record.pValue !== "number" ||
    typeof record.slopePerYear !== "number" ||
    typeof record.slopePerDecade !== "number" ||
    typeof record.nMonths !== "number" ||
    typeof record.mkTrend !== "string" ||
    !Number.isFinite(record.pValue) ||
    !Number.isFinite(record.slopePerDecade)
  ) {
    return null;
  }

  const qValue =
    typeof record.qValue === "number" && Number.isFinite(record.qValue)
      ? record.qValue
      : undefined;
  const missingRatio =
    typeof record.missingRatio === "number" && Number.isFinite(record.missingRatio)
      ? record.missingRatio
      : undefined;

  return {
    region,
    variable: record.variable,
    variableLabel: record.variableLabel,
    unit: record.unit,
    units: record.units,
    dataSource: record.dataSource,
    direction,
    significance,
    pValue: record.pValue,
    qValue,
    missingRatio,
    slopePerYear: record.slopePerYear,
    slopePerDecade: record.slopePerDecade,
    nMonths: record.nMonths,
    mkTrend: record.mkTrend,
    series: readSeries(record.series),
    annual: readAnnual(record.annual),
    slopeLine: readAnnual(record.slopeLine),
    events: readEvents(record.events),
    supplemental: readSupplemental(record.supplemental),
  };
}

function readEvents(value: unknown): EonetEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const list: EonetEvent[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.id === "string" && typeof rec.title === "string") {
      list.push({
        id: rec.id,
        title: rec.title,
        category: typeof rec.category === "string" ? rec.category : "Natural Event",
        date: typeof rec.date === "string" ? rec.date : "",
        distanceKm: typeof rec.distanceKm === "number" ? rec.distanceKm : 0,
        sourceUrl:
          typeof rec.sourceUrl === "string"
            ? rec.sourceUrl
            : "https://eonet.gsfc.nasa.gov/",
      });
    }
  }
  return list;
}

function readSupplemental(value: unknown): SupplementalInfo | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  const rec = value as Record<string, unknown>;
  if (
    typeof rec.source !== "string" ||
    typeof rec.agency !== "string" ||
    typeof rec.badge !== "string" ||
    typeof rec.indexName !== "string" ||
    typeof rec.note !== "string"
  ) {
    return undefined;
  }
  return {
    source: rec.source,
    agency: rec.agency,
    badge: rec.badge,
    indexName: rec.indexName,
    recordLengthMonths:
      typeof rec.recordLengthMonths === "number" ? rec.recordLengthMonths : 12,
    primarySource: typeof rec.primarySource === "string" ? rec.primarySource : "nasa-power",
    liveTokenActive: Boolean(rec.liveTokenActive),
    note: rec.note,
  };
}

function readDirection(value: unknown): Direction | null {
  switch (value) {
    case "increasing":
    case "decreasing":
    case "no trend":
      return value;
    default:
      return null;
  }
}

function readSignificance(value: unknown): Significance | null {
  switch (value) {
    case "significant":
    case "borderline":
    case "not_significant":
    case "insufficient_data":
      return value;
    default:
      return null;
  }
}

function readSeries(value: unknown): SeriesPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const points: SeriesPoint[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const date = (item as { date?: unknown }).date;
    const pointValue = (item as { value?: unknown }).value;
    if (
      typeof date === "string" &&
      typeof pointValue === "number" &&
      Number.isFinite(pointValue)
    ) {
      points.push({ date, value: pointValue });
    }
  }
  return points;
}

function readAnnual(value: unknown): AnnualPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const points: AnnualPoint[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const year = (item as { year?: unknown }).year;
    const pointValue = (item as { value?: unknown }).value;
    if (
      typeof year === "number" &&
      typeof pointValue === "number" &&
      Number.isFinite(pointValue)
    ) {
      points.push({ year, value: pointValue });
    }
  }
  return points;
}
