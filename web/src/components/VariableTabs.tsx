"use client";

import { getVariablePalette } from "@/lib/variableMeta";
import type { VariableId } from "@/lib/types";

const TABS: { id: VariableId; label: string; shortLabel: string; code: string }[] = [
  { id: "temperature", label: "Temperature", shortLabel: "Temp", code: "T2M" },
  { id: "precipitation", label: "Precipitation", shortLabel: "Precip", code: "PRECTOT" },
  { id: "solar", label: "Solar", shortLabel: "Solar", code: "SW_DWN" },
  { id: "humidity", label: "Humidity", shortLabel: "RH2M", code: "RH2M" },
];

type VariableTabsProps = {
  value: VariableId;
  onChange: (variable: VariableId) => void;
  compact?: boolean;
};

export function VariableTabs({ value, onChange, compact = false }: VariableTabsProps) {
  return (
    <div
      className={
        compact
          ? "inline-flex flex-wrap items-center gap-1 rounded-pill border border-white/10 bg-[#08101a]/90 p-1"
          : "grid grid-cols-2 gap-1.5 px-4 pt-3.5 sm:flex sm:flex-wrap lg:px-5"
      }
      role="tablist"
      aria-label="Earth system variable"
    >
      {TABS.map((tab) => {
        const selected = tab.id === value;
        const palette = getVariablePalette(tab.id);
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            data-agent-action={`select-variable-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-pill border text-xs font-medium transition-all duration-200 ${
              compact ? "px-2.5 py-1.5" : "px-3 py-1.5"
            } ${
              selected
                ? palette.activeTabClass
                : "border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                backgroundColor: selected ? palette.accentHex : "rgba(148, 163, 184, 0.45)",
              }}
              aria-hidden="true"
            />
            <span>{compact ? tab.shortLabel : tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function variableHeadline(variable: VariableId): string {
  switch (variable) {
    case "temperature":
      return "Surface temperature · NASA POWER monthly T2M · 1981–2025";
    case "precipitation":
      return "Precipitation · NASA POWER monthly PRECTOTCORR · 1981–2025";
    case "solar":
      return "Solar radiation · NASA POWER monthly ALLSKY_SFC_SW_DWN · 1981–2025";
    case "humidity":
      return "Relative humidity · NASA POWER monthly RH2M · 1981–2025";
    default: {
      const exhaustive: never = variable;
      return exhaustive;
    }
  }
}
