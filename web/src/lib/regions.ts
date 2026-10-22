import type { Region } from "@/lib/types";

export const REGIONS: readonly Region[] = [
  { id: "arctic", name: "Arctic", latitude: 75.0, longitude: -40.0 },
  { id: "antarctic", name: "Antarctic", latitude: -75.0, longitude: 0.0 },
  { id: "amazon", name: "Amazon", latitude: -3.4, longitude: -62.0 },
  { id: "sahel", name: "Sahel", latitude: 14.0, longitude: 0.0 },
  { id: "n-atlantic", name: "N. Atlantic", latitude: 45.0, longitude: -30.0 },
  { id: "w-pacific", name: "W. Pacific", latitude: 10.0, longitude: 140.0 },
  { id: "bay-of-bengal", name: "Bay of Bengal", latitude: 15.0, longitude: 88.0 },
  { id: "gulf-of-mexico", name: "Gulf of Mexico", latitude: 25.0, longitude: -90.0 },
  { id: "siberia", name: "Siberia", latitude: 62.0, longitude: 100.0 },
  { id: "sw-usa", name: "SW USA", latitude: 34.0, longitude: -112.0 },
] as const;

export const REGION_BY_ID: ReadonlyMap<string, Region> = new Map(
  REGIONS.map((region) => [region.id, region]),
);

export function getRegionById(id: string): Region | undefined {
  return REGION_BY_ID.get(id);
}
