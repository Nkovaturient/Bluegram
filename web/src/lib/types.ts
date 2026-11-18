export type Region = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type SeriesPoint = {
  date: string;
  value: number;
};

export type AnnualPoint = {
  year: number;
  value: number;
};

export type Direction = "increasing" | "decreasing" | "no trend";

export type Significance =
  | "significant"
  | "borderline"
  | "not_significant"
  | "insufficient_data";

export type VariableId = "temperature" | "precipitation" | "solar" | "humidity";

export type SlopePoint = {
  regionId: string;
  slopePerDecade: number;
};

export type EonetEvent = {
  id: string;
  title: string;
  category: string;
  date: string;
  distanceKm: number;
  sourceUrl: string;
};

export type GlobalEonetEvent = {
  id: string;
  title: string;
  category: string;
  date: string;
  latitude: number;
  longitude: number;
  sourceUrl: string;
};

export type PlanetaryStacScene = {
  id: string;
  collection: string;
  platform: string;
  datetime: string;
  cloudCover: number | null;
  previewUrl: string | null;
  catalogUrl: string;
  stacApiUrl: string;
};

export type SynopticNowcast = {
  source: string;
  providerLabel: string;
  observedAt: string;
  temperatureC: number | null;
  precip24hMm: number | null;
  windSpeedMs: number | null;
  pressureHpa: number | null;
  humidityPct: number | null;
};

export type IsroGroundTelemetry = {
  groundStation: string;
  downlinkBand: string;
  scienceArchive: string;
  datasetId: string;
  archiveUrl: string;
  istracUrl: string;
  issdcUrl: string;
};

export type PlanetaryIntelResponse = {
  regionId: string;
  stacScene: PlanetaryStacScene;
  synoptic: SynopticNowcast;
  isroTelemetry: IsroGroundTelemetry;
};

export type SupplementalInfo = {
  source: string;
  agency: string;
  badge: string;
  indexName: string;
  recordLengthMonths: number;
  primarySource: string;
  liveTokenActive: boolean;
  note: string;
};

export type TrendResponse = {
  region: Region;
  variable: string;
  variableLabel: string;
  unit: string;
  units: string;
  dataSource: string;
  startYear?: number;
  endYear?: number;
  direction: Direction;
  significance: Significance;
  pValue: number;
  qValue?: number;
  missingRatio?: number;
  slopePerYear: number;
  slopePerDecade: number;
  nMonths: number;
  mkTrend: string;
  series: SeriesPoint[];
  annual: AnnualPoint[];
  slopeLine: AnnualPoint[];
  events?: EonetEvent[];
  supplemental?: SupplementalInfo;
};

export type TrendState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; trend: TrendResponse }
  | { status: "error"; message: string };

export type RegionType = "polar" | "tropical" | "arid" | "temperate";

export type FeedItem = {
  region: Region;
  regionType: RegionType | null;
  slopePerDecade: number;
  pValue: number;
  qValue?: number;
  direction: Direction;
  significance: Significance;
  unit: string;
  variableLabel: string;
};

export type FilterState = {
  searchText: string;
  significanceTiers: Set<Significance>;
  directions: Set<Direction>;
  regionTypes: Set<RegionType>;
  showBookmarkedOnly: boolean;
};
