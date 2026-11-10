import type { RegionType, Significance, VariableId } from "@/lib/types";

export type GlobeMarkerMeta = {
  regionId: string;
  regionName: string;
  regionType: RegionType | null;
  slopePerDecade: number;
  unit: string;
  significance: Significance;
};

export type GlobeMarkerDisplayMode = "hidden" | "compact" | "full";

function formatSlope(slope: number): string {
  return slope >= 0 ? `+${slope.toFixed(2)}` : slope.toFixed(2);
}

function significanceModifier(significance: Significance): string {
  switch (significance) {
    case "significant":
      return "globe-marker-badge--significant";
    case "borderline":
      return "globe-marker-badge--borderline";
    case "not_significant":
    case "insufficient_data":
      return "globe-marker-badge--muted";
    default: {
      const exhaustive: never = significance;
      return exhaustive;
    }
  }
}

function modeClass(mode: GlobeMarkerDisplayMode): string {
  switch (mode) {
    case "hidden":
      return "globe-marker-badge--mode-hidden";
    case "compact":
      return "globe-marker-badge--mode-compact";
    case "full":
      return "globe-marker-badge--mode-full";
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}

function regionTypeLabel(type: RegionType): string {
  switch (type) {
    case "polar":
      return "Polar";
    case "tropical":
      return "Tropical";
    case "arid":
      return "Arid";
    case "temperate":
      return "Temperate";
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

function regionTypeGlyph(type: RegionType | null): string {
  if (!type) {
    return `<span class="globe-marker-badge__region-type globe-marker-badge__region-type--unknown" hidden aria-hidden="true"></span>`;
  }
  const label = regionTypeLabel(type);
  switch (type) {
    case "polar":
      return `<span class="globe-marker-badge__region-type globe-marker-badge__region-type--polar" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07"/></svg></span>`;
    case "tropical":
      return `<span class="globe-marker-badge__region-type globe-marker-badge__region-type--tropical" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22V12M12 12C12 7 17 4 17 4s-3 5-3 10M12 12C12 7 7 4 7 4s3 5 3 10"/></svg></span>`;
    case "arid":
      return `<span class="globe-marker-badge__region-type globe-marker-badge__region-type--arid" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg></span>`;
    case "temperate":
      return `<span class="globe-marker-badge__region-type globe-marker-badge__region-type--temperate" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22c-4-3-7-7-7-11a7 7 0 0 1 14 0c0 4-3 8-7 11z"/><path d="M12 11v0"/></svg></span>`;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

function variableIcon(variable: VariableId): string {
  switch (variable) {
    case "temperature":
      return `<svg class="globe-marker-badge__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>`;
    case "precipitation":
      return `<svg class="globe-marker-badge__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`;
    case "solar":
      return `<svg class="globe-marker-badge__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;
    case "humidity":
      return `<svg class="globe-marker-badge__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    default: {
      const exhaustive: never = variable;
      return exhaustive;
    }
  }
}

export function createGlobeMarkerBadgeElement(
  meta: GlobeMarkerMeta,
  variable: VariableId,
  selected: boolean,
): HTMLDivElement {
  const root = document.createElement("div");
  root.dataset.regionId = meta.regionId;

  const unitShort = meta.unit === "°C" ? "°C/dec" : `${meta.unit}/dec`;

  root.innerHTML = `
    <div class="globe-marker-badge__pointer" aria-hidden="true"></div>
    <div class="globe-marker-badge__body">
      ${variableIcon(variable)}
      <span class="globe-marker-badge__title">
        ${regionTypeGlyph(meta.regionType)}
        <span class="globe-marker-badge__name">${meta.regionName}</span>
      </span>
      <span class="globe-marker-badge__slope">${formatSlope(meta.slopePerDecade)}</span>
      <span class="globe-marker-badge__unit">${unitShort}</span>
    </div>
  `;

  applyGlobeMarkerDisplay(root, meta, variable, selected, selected ? "full" : "hidden");

  return root;
}

function badgeStateKey(
  meta: GlobeMarkerMeta,
  variable: VariableId,
  selected: boolean,
  mode: GlobeMarkerDisplayMode,
): string {
  return `${meta.regionId}|${meta.regionName}|${meta.regionType}|${meta.slopePerDecade}|${meta.unit}|${meta.significance}|${variable}|${selected}|${mode}`;
}

export function applyGlobeMarkerDisplay(
  element: HTMLDivElement,
  meta: GlobeMarkerMeta,
  variable: VariableId,
  selected: boolean,
  mode: GlobeMarkerDisplayMode,
): void {
  const nextKey = badgeStateKey(meta, variable, selected, mode);
  if (element.dataset.badgeState === nextKey) {
    return;
  }
  element.dataset.badgeState = nextKey;

  element.className = [
    "globe-marker-badge",
    significanceModifier(meta.significance),
    modeClass(mode),
    selected ? "globe-marker-badge--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const title = element.querySelector(".globe-marker-badge__title");
  const name = element.querySelector(".globe-marker-badge__name");
  const slope = element.querySelector(".globe-marker-badge__slope");
  const unit = element.querySelector(".globe-marker-badge__unit");
  const iconWrap = element.querySelector(".globe-marker-badge__body");
  if (title) {
    const existingGlyph = title.querySelector(".globe-marker-badge__region-type");
    if (existingGlyph) {
      existingGlyph.outerHTML = regionTypeGlyph(meta.regionType);
    }
  }
  if (name) {
    name.textContent = meta.regionName;
  }
  if (slope) {
    slope.textContent = formatSlope(meta.slopePerDecade);
  }
  if (unit) {
    unit.textContent = meta.unit === "°C" ? "°C/dec" : `${meta.unit}/dec`;
  }
  if (iconWrap) {
    const existingIcon = iconWrap.querySelector(".globe-marker-badge__icon");
    if (existingIcon) {
      existingIcon.outerHTML = variableIcon(variable);
    }
  }
}

export function updateGlobeMarkerBadgeElement(
  element: HTMLDivElement,
  meta: GlobeMarkerMeta,
  variable: VariableId,
  selected: boolean,
): void {
  applyGlobeMarkerDisplay(element, meta, variable, selected, selected ? "full" : "hidden");
}
