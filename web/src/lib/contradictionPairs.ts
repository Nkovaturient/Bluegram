import { REGION_BY_ID } from "@/lib/regions";
import type { Region, VariableId } from "@/lib/types";

export type ContradictionPair = {
  id: string;
  name: string;
  description: string;
  regionA: Region;
  regionB: Region;
  variable: VariableId;
  reason: string;
  category: "ice" | "vegetation" | "ocean" | "atmosphere" | "precipitation" | "monsoon";
  source?: "curated" | "live";
};

function requireRegion(id: string): Region {
  const region = REGION_BY_ID.get(id);
  if (!region) {
    throw new Error(`Unknown region id in curated pairs: ${id}`);
  }
  return region;
}

export const DEFAULT_FEATURED_PAIR_ID = "arctic-antarctic-temp";

export const CURATED_CONTRADICTION_PAIRS: ContradictionPair[] = [
  {
    id: DEFAULT_FEATURED_PAIR_ID,
    name: "Arctic vs Antarctic Warming",
    description:
      "Polar temperature contrast on NASA POWER (ice mass anomaly deferred until GRACE-FO/NSIDC integration)",
    regionA: requireRegion("arctic"),
    regionB: requireRegion("antarctic"),
    variable: "temperature",
    reason:
      "Polar temperature contrast on NASA POWER (ice mass deferred until GRACE/NSIDC lands): the Arctic undergoes amplified warming from sea-ice-albedo feedback and oceanic heat transport, while the high-elevation Antarctic interior is buffered by the circumpolar vortex and Southern Ocean upwelling.",
    category: "ice",
    source: "curated",
  },
  {
    id: "western-ghats-indo-gangetic-precip",
    name: "Western Ghats vs Indo-Gangetic Plain",
    description: "ISRO monsoon belt contrast: coastal orographic belt vs northern alluvial plains",
    regionA: requireRegion("western-ghats"),
    regionB: requireRegion("indo-gangetic"),
    variable: "precipitation",
    reason:
      "Indian subcontinent monsoon divergence (ISRO MOSDAC / NASA POWER anchor): the Western Ghats receive intense Arabian Sea orographic moisture pulses, while the Indo-Gangetic Plain (Ganga/Lucknow corridor) is modulated by monsoon trough shifts, aerosol-cloud interactions, and intensive irrigation.",
    category: "monsoon",
    source: "curated",
  },
  {
    id: "amazon-sahel-temp",
    name: "Amazon vs Sahel Thermal Regime",
    description: "Humid tropical canopy vs semi-arid transition zone",
    regionA: requireRegion("amazon"),
    regionB: requireRegion("sahel"),
    variable: "temperature",
    reason:
      "Evaporative cooling and cloud cover in the humid Amazon basin modulate surface temperature trends differently from the semi-arid Sahel, where land-atmosphere dust and soil-moisture feedbacks amplify thermal shifts.",
    category: "vegetation",
    source: "curated",
  },
  {
    id: "n-atlantic-w-pacific-temp",
    name: "N. Atlantic vs W. Pacific Ocean",
    description: "Atlantic multidecadal circulation vs Indo-Pacific warm pool",
    regionA: requireRegion("n-atlantic"),
    regionB: requireRegion("w-pacific"),
    variable: "temperature",
    reason:
      "North Atlantic surface temperatures respond to Atlantic Meridional Overturning and multidecadal variability, whereas the Western Pacific warm pool is governed by trade-wind intensity and ENSO/PDO phase shifts.",
    category: "ocean",
    source: "curated",
  },
  {
    id: "bay-of-bengal-gulf-of-mexico-precip",
    name: "Bay of Bengal vs Gulf of Mexico",
    description: "South Asian monsoon basin vs subtropical Atlantic gulf",
    regionA: requireRegion("bay-of-bengal"),
    regionB: requireRegion("gulf-of-mexico"),
    variable: "precipitation",
    reason:
      "Indian Ocean warming and monsoon dynamics drive distinct moisture convergence trends over the Bay of Bengal compared with the Gulf of Mexico, where subtropical high-pressure ridges and Atlantic storm tracks control rainfall.",
    category: "precipitation",
    source: "curated",
  },
  {
    id: "siberia-sw-usa-temp",
    name: "Siberia vs SW USA Continental",
    description: "Boreal snow-albedo amplification vs arid subtropical interior",
    regionA: requireRegion("siberia"),
    regionB: requireRegion("sw-usa"),
    variable: "temperature",
    reason:
      "High-latitude Siberia experiences strong snow- and permafrost-albedo amplification under greenhouse forcing, while the arid US Southwest is modulated by Pacific decadal sea-surface patterns and subtropical ridge persistence.",
    category: "atmosphere",
    source: "curated",
  },
  {
    id: "sahel-sw-usa-precip",
    name: "Sahel vs SW USA Arid Margins",
    description: "West African monsoon recovery vs North American megadrought",
    regionA: requireRegion("sahel"),
    regionB: requireRegion("sw-usa"),
    variable: "precipitation",
    reason:
      "The Sahel has shown multi-decade rainfall recovery since the 1980s drought minimum tied to Atlantic SST gradients, while the American Southwest faces subtropical drying and cool-season precipitation deficits.",
    category: "precipitation",
    source: "curated",
  },
];
