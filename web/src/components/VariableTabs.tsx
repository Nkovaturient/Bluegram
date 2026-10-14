"use client";

import type { VariableId } from "@/lib/types";

const TABS: { id: VariableId; label: string }[] = [
  { id: "temperature", label: "Temperature" },
  { id: "precipitation", label: "Precipitation" },
];

type VariableTabsProps = {
  value: VariableId;
  onChange: (variable: VariableId) => void;
};

export function VariableTabs({ value, onChange }: VariableTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pt-3 lg:px-5" role="tablist" aria-label="Variable">
      {TABS.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b4a]/60 ${
              selected ? "bg-white/15 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            {tab.label}
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
