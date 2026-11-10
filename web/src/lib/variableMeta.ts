import type { VariableId } from "@/lib/types";

export type VariablePalette = {
  id: VariableId;
  label: string;
  shortLabel: string;
  parameterCode: string;
  unitLabel: string;
  accentHex: string;
  lineStroke: string;
  senStroke: string;
  gradientStopTop: string;
  gradientStopBottom: string;
  badgeClass: string;
  activeTabClass: string;
  borderGlowClass: string;
  textAccentClass: string;
};

export const VARIABLE_PALETTES: Record<VariableId, VariablePalette> = {
  temperature: {
    id: "temperature",
    label: "Surface Temperature",
    shortLabel: "Temp",
    parameterCode: "T2M",
    unitLabel: "°C/dec",
    accentHex: "#ff6b4a",
    lineStroke: "#ff7a59",
    senStroke: "#f4e1c1",
    gradientStopTop: "rgba(255, 122, 89, 0.25)",
    gradientStopBottom: "rgba(255, 122, 89, 0.0)",
    badgeClass: "border-[#ff6b4a]/35 bg-[#ff6b4a]/12 text-[#ffb199]",
    activeTabClass:
      "border-[#ff6b4a]/50 bg-[#ff6b4a]/15 text-white shadow-[0_0_16px_rgba(255,107,74,0.2)]",
    borderGlowClass: "border-[#ff6b4a]/45 shadow-glow",
    textAccentClass: "text-[#ffb199]",
  },
  precipitation: {
    id: "precipitation",
    label: "Precipitation",
    shortLabel: "Precip",
    parameterCode: "PRECTOTCORR",
    unitLabel: "mm/d/dec",
    accentHex: "#818cf8",
    lineStroke: "#818cf8",
    senStroke: "#e0e7ff",
    gradientStopTop: "rgba(129, 140, 248, 0.25)",
    gradientStopBottom: "rgba(129, 140, 248, 0.0)",
    badgeClass: "border-indigo-400/35 bg-indigo-500/12 text-indigo-200",
    activeTabClass:
      "border-indigo-400/50 bg-indigo-500/18 text-white shadow-[0_0_16px_rgba(129,140,248,0.22)]",
    borderGlowClass: "border-indigo-400/45 shadow-glow-precip",
    textAccentClass: "text-indigo-300",
  },
  solar: {
    id: "solar",
    label: "Solar Radiation",
    shortLabel: "Solar",
    parameterCode: "ALLSKY_SFC_SW_DWN",
    unitLabel: "W/m²/dec",
    accentHex: "#f59e0b",
    lineStroke: "#fbbf24",
    senStroke: "#fef3c7",
    gradientStopTop: "rgba(251, 191, 36, 0.24)",
    gradientStopBottom: "rgba(251, 191, 36, 0.0)",
    badgeClass: "border-amber-400/35 bg-amber-500/12 text-amber-200",
    activeTabClass:
      "border-amber-400/50 bg-amber-500/18 text-white shadow-[0_0_16px_rgba(245,158,11,0.22)]",
    borderGlowClass: "border-amber-400/45",
    textAccentClass: "text-amber-300",
  },
  humidity: {
    id: "humidity",
    label: "Relative Humidity",
    shortLabel: "Humidity",
    parameterCode: "RH2M",
    unitLabel: "%/dec",
    accentHex: "#14b8a6",
    lineStroke: "#2dd4bf",
    senStroke: "#ccfbf1",
    gradientStopTop: "rgba(45, 212, 191, 0.24)",
    gradientStopBottom: "rgba(45, 212, 191, 0.0)",
    badgeClass: "border-teal-400/35 bg-teal-500/12 text-teal-200",
    activeTabClass:
      "border-teal-400/50 bg-teal-500/18 text-white shadow-[0_0_16px_rgba(20,184,166,0.22)]",
    borderGlowClass: "border-teal-400/45",
    textAccentClass: "text-teal-300",
  },
};

export function getVariablePalette(variable: VariableId | string): VariablePalette {
  switch (variable) {
    case "precipitation":
    case "PRECTOTCORR":
      return VARIABLE_PALETTES.precipitation;
    case "solar":
    case "ALLSKY_SFC_SW_DWN":
      return VARIABLE_PALETTES.solar;
    case "humidity":
    case "RH2M":
      return VARIABLE_PALETTES.humidity;
    default:
      return VARIABLE_PALETTES.temperature;
  }
}

export function isValidVariableId(val: string | null): val is VariableId {
  return (
    val === "temperature" ||
    val === "precipitation" ||
    val === "solar" ||
    val === "humidity"
  );
}
