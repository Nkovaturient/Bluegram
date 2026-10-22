import type { VariableId } from "@/lib/types";

export type VariablePalette = {
  id: VariableId;
  label: string;
  shortLabel: string;
  parameterCode: string;
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
    shortLabel: "Temperature",
    parameterCode: "T2M",
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
    shortLabel: "Precipitation",
    parameterCode: "PRECTOTCORR",
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
};

export function getVariablePalette(variable: VariableId | string): VariablePalette {
  if (variable === "precipitation" || variable === "PRECTOTCORR") {
    return VARIABLE_PALETTES.precipitation;
  }
  return VARIABLE_PALETTES.temperature;
}
