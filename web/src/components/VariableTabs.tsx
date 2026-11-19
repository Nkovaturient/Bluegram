"use client";

import { getVariablePalette } from "@/lib/variableMeta";
import type { VariableId } from "@/lib/types";

const TABS: { id: VariableId; label: string; shortLabel: string; code: string }[] = [
  { id: "temperature", label: "Temperature", shortLabel: "Temp", code: "T2M" },
  { id: "precipitation", label: "Precipitation", shortLabel: "Precip", code: "PRECTOT" },
  { id: "solar", label: "Solar", shortLabel: "Solar", code: "SW_DWN" },
  { id: "humidity", label: "Humidity", shortLabel: "RH2M", code: "RH2M" },
];

function VariableIcon({ variable, color }: { variable: VariableId; color: string }) {
  switch (variable) {
    case "temperature":
      return (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z" />
          <line x1="11.5" y1="10" x2="11.5" y2="17" />
        </svg>
      );
    case "precipitation":
      return (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M8 19v2" />
          <path d="M12 19v3" />
          <path d="M16 19v2" />
        </svg>
      );
    case "solar":
      return (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      );
    case "humidity":
      return (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      );
    default: {
      const exhaustive: never = variable;
      return exhaustive;
    }
  }
}

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
            <VariableIcon
              variable={tab.id}
              color={selected ? palette.accentHex : "rgba(148, 163, 184, 0.7)"}
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
