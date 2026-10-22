"use client";

import { getVariablePalette } from "@/lib/variableMeta";
import type { VariableId } from "@/lib/types";

const TABS: { id: VariableId; label: string; code: string }[] = [
  { id: "temperature", label: "Temperature", code: "T2M" },
  { id: "precipitation", label: "Precipitation", code: "PRECTOT" },
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
          ? "inline-flex items-center gap-1 rounded-pill border border-white/10 bg-[#08101a]/90 p-1"
          : "flex flex-wrap gap-2 px-4 pt-3.5 lg:px-5"
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
            className={`inline-flex items-center gap-1.5 rounded-pill border text-xs font-medium transition-all duration-200 ${
              compact ? "px-3 py-1.5" : "px-3.5 py-2"
            } ${
              selected
                ? palette.activeTabClass
                : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: selected ? palette.accentHex : "rgba(148, 163, 184, 0.45)",
              }}
              aria-hidden="true"
            />
            <span>{tab.label}</span>
            {compact && (
              <span className="hidden font-mono text-[10px] opacity-65 sm:inline">
                {tab.code}
              </span>
            )}
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
    default: {
      const exhaustive: never = variable;
      return exhaustive;
    }
  }
}
