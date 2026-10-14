export type RegionType = "polar" | "tropical" | "arid" | "temperate";

export const REGION_TYPE_MAP: Record<string, RegionType> = {
  arctic: "polar",
  antarctic: "polar",
  amazon: "tropical",
  sahel: "arid",
  "n-atlantic": "temperate",
  "w-pacific": "tropical",
  "bay-of-bengal": "tropical",
  "gulf-of-mexico": "temperate",
  siberia: "temperate",
  "sw-usa": "arid",
};

export function getRegionType(regionId: string): RegionType | null {
  return REGION_TYPE_MAP[regionId] ?? null;
}
