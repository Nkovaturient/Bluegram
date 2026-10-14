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

export type Significance = "significant" | "borderline" | "not_significant";

export type VariableId = "temperature" | "precipitation";

export type SlopePoint = {
  regionId: string;
  slopePerDecade: number;
};

export type TrendResponse = {
  region: Region;
  variable: string;
  variableLabel: string;
  unit: string;
  units: string;
  dataSource: string;
  direction: Direction;
  significance: Significance;
  pValue: number;
  slopePerYear: number;
  slopePerDecade: number;
  nMonths: number;
  mkTrend: string;
  series: SeriesPoint[];
  annual: AnnualPoint[];
  slopeLine: AnnualPoint[];
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
