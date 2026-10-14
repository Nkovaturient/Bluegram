import type { Region, VariableId } from "@/lib/types";

export type ContradictionPair = {
  id: string;
  name: string;
  description: string;
  regionA: Region;
  regionB: Region;
  variable: VariableId;
  reason: string;
  category: "ice" | "vegetation" | "ocean" | "atmosphere" | "precipitation";
};

export const CURATED_CONTRADICTION_PAIRS: ContradictionPair[] = [
  {
    id: "arctic-antarctic-temp",
    name: "Arctic vs Antarctic Warming",
    description: "Polar amplification shows opposite patterns",
    regionA: {
      id: "arctic",
      name: "Arctic",
      latitude: 75,
      longitude: -40,
    },
    regionB: {
      id: "antarctic",
      name: "Antarctic",
      latitude: -75,
      longitude: 0,
    },
    variable: "temperature",
    reason: "Arctic experiences amplified warming while Antarctic interior remains relatively stable due to differences in ocean circulation, ice-albedo feedback, and continental vs oceanic geography.",
    category: "ice",
  },
  {
    id: "amazon-sahel-vegetation",
    name: "Amazon vs Sahel Greening",
    description: "CO₂ fertilization with opposing regional moisture",
    regionA: {
      id: "amazon",
      name: "Amazon",
      latitude: -3.4,
      longitude: -62,
    },
    regionB: {
      id: "sahel",
      name: "Sahel",
      latitude: 14,
      longitude: 0,
    },
    variable: "temperature",
    reason: "While CO₂ fertilization promotes greening globally, Amazon faces deforestation and drought stress, whereas Sahel shows recovery greening from improved rainfall patterns and land management.",
    category: "vegetation",
  },
  {
    id: "north-atlantic-west-pacific-temp",
    name: "N. Atlantic vs W. Pacific SST",
    description: "Atlantic warming vs Pacific cooling phases",
    regionA: {
      id: "north_atlantic",
      name: "N. Atlantic",
      latitude: 45,
      longitude: -30,
    },
    regionB: {
      id: "west_pacific",
      name: "W. Pacific",
      latitude: 10,
      longitude: 140,
    },
    variable: "temperature",
    reason: "Atlantic Multidecadal Oscillation drives warming in North Atlantic, while Pacific Decadal Oscillation and La Niña-like trends create relative cooling in Western Pacific regions.",
    category: "ocean",
  },
  {
    id: "bengal-gulf-precip",
    name: "Bay of Bengal vs Gulf of Mexico",
    description: "Monsoon intensification vs hurricane season shifts",
    regionA: {
      id: "bay_of_bengal",
      name: "Bay of Bengal",
      latitude: 15,
      longitude: 88,
    },
    regionB: {
      id: "gulf_of_mexico",
      name: "Gulf of Mexico",
      latitude: 25,
      longitude: -90,
    },
    variable: "precipitation",
    reason: "South Asian monsoon intensifies with warming, increasing Bay of Bengal precipitation, while Gulf of Mexico shows seasonal redistribution with more extreme events but variable total precipitation.",
    category: "precipitation",
  },
  {
    id: "siberia-southwest-us-temp",
    name: "Siberia vs SW USA Warming",
    description: "Continental interior temperature extremes",
    regionA: {
      id: "siberia",
      name: "Siberia",
      latitude: 62,
      longitude: 100,
    },
    regionB: {
      id: "southwest_usa",
      name: "SW USA",
      latitude: 34,
      longitude: -112,
    },
    variable: "temperature",
    reason: "Siberia shows extreme high-latitude amplification (>2× global average), while SW USA experiences moderate warming modulated by Pacific ocean patterns and drought-heat feedbacks.",
    category: "atmosphere",
  },
  {
    id: "greenland-west-antarctic-temp",
    name: "Greenland vs W. Antarctic Ice",
    description: "Ice sheet mass loss mechanisms differ",
    regionA: {
      id: "greenland",
      name: "Greenland",
      latitude: 72,
      longitude: -40,
    },
    regionB: {
      id: "west_antarctic",
      name: "W. Antarctic",
      latitude: -78,
      longitude: -100,
    },
    variable: "temperature",
    reason: "Greenland ice loss driven primarily by surface melting and runoff, while West Antarctic driven by warm ocean water undermining ice shelves from below - same driver (warming), different mechanisms.",
    category: "ice",
  },
  {
    id: "mediterranean-horn-africa-precip",
    name: "Mediterranean vs Horn of Africa",
    description: "Subtropical drying vs equatorial variability",
    regionA: {
      id: "mediterranean",
      name: "Mediterranean",
      latitude: 38,
      longitude: 15,
    },
    regionB: {
      id: "horn_of_africa",
      name: "Horn of Africa",
      latitude: 8,
      longitude: 42,
    },
    variable: "precipitation",
    reason: "Mediterranean experiences subtropical drying from poleward expansion of Hadley cells, while Horn of Africa shows high interannual variability with recent drought trends from Indian Ocean warming.",
    category: "precipitation",
  },
  {
    id: "scandinavia-central-asia-temp",
    name: "Scandinavia vs Central Asia",
    description: "Maritime vs continental warming responses",
    regionA: {
      id: "scandinavia",
      name: "Scandinavia",
      latitude: 62,
      longitude: 15,
    },
    regionB: {
      id: "central_asia",
      name: "Central Asia",
      latitude: 45,
      longitude: 65,
    },
    variable: "temperature",
    reason: "Scandinavia's maritime climate shows moderated warming with Atlantic influence, while Central Asia's continental interior experiences extreme warming with reduced snow cover feedback.",
    category: "atmosphere",
  },
  {
    id: "east-pacific-west-pacific-temp",
    name: "E. Pacific vs W. Pacific Trends",
    description: "Walker circulation strengthening effects",
    regionA: {
      id: "east_pacific",
      name: "E. Pacific",
      latitude: -5,
      longitude: -110,
    },
    regionB: {
      id: "west_pacific",
      name: "W. Pacific",
      latitude: -5,
      longitude: 160,
    },
    variable: "temperature",
    reason: "Strengthened trade winds enhance upwelling in Eastern Pacific (cooling), while Western Pacific warm pool intensifies (warming) - a La Niña-like pattern superimposed on global warming.",
    category: "ocean",
  },
  {
    id: "india-australia-precip",
    name: "Indian Monsoon vs Australian Outback",
    description: "Monsoon enhancement vs subtropical drying",
    regionA: {
      id: "india_monsoon",
      name: "India",
      latitude: 22,
      longitude: 78,
    },
    regionB: {
      id: "australia_outback",
      name: "Australia",
      latitude: -25,
      longitude: 135,
    },
    variable: "precipitation",
    reason: "Indian monsoon intensifies with warming oceans despite variability, while Australian interior experiences persistent drying from subtropical high-pressure system intensification.",
    category: "precipitation",
  },
  {
    id: "alaska-patagonia-temp",
    name: "Alaska vs Patagonia Glaciers",
    description: "High-latitude vs mid-latitude glacier response",
    regionA: {
      id: "alaska",
      name: "Alaska",
      latitude: 63,
      longitude: -152,
    },
    regionB: {
      id: "patagonia",
      name: "Patagonia",
      latitude: -50,
      longitude: -73,
    },
    variable: "temperature",
    reason: "Alaska glaciers experience extreme polar amplification and rapid retreat, while Patagonian glaciers show moderate warming but complex responses to Southern Ocean and westerly wind shifts.",
    category: "ice",
  },
  {
    id: "western-europe-eastern-europe-temp",
    name: "Western vs Eastern Europe",
    description: "Atlantic vs continental climate regimes",
    regionA: {
      id: "western_europe",
      name: "Western Europe",
      latitude: 50,
      longitude: 5,
    },
    regionB: {
      id: "eastern_europe",
      name: "Eastern Europe",
      latitude: 50,
      longitude: 30,
    },
    variable: "temperature",
    reason: "Western Europe's oceanic influence moderates temperature trends and increases precipitation, while Eastern Europe shows continental extremes with winter cold snaps despite overall warming.",
    category: "atmosphere",
  },
];
