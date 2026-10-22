"use client";

import { useState } from "react";

type SnapLevel = "peek" | "half" | "full";
type SheetTab = "feed" | "details";

type MobileBottomSheetProps = {
  compareEnabled: boolean;
  hasSelectedRegion: boolean;
  feedContent: React.ReactNode;
  detailsContent: React.ReactNode;
};

export function MobileBottomSheet({
  compareEnabled,
  hasSelectedRegion,
  feedContent,
  detailsContent,
}: MobileBottomSheetProps) {
  const [snap, setSnap] = useState<SnapLevel>("half");
  const [activeTab, setActiveTab] = useState<SheetTab>("feed");

  const effectiveTab: SheetTab = compareEnabled ? "details" : activeTab;

  const cycleSnap = () => {
    setSnap((prev) => {
      if (prev === "peek") return "half";
      if (prev === "half") return "full";
      return "peek";
    });
  };

  const heightClass =
    snap === "peek"
      ? "h-[4.25rem]"
      : snap === "half"
        ? "h-[46dvh]"
        : "h-[82dvh]";

  return (
    <section
      className={`glass-panel relative z-30 flex flex-col overflow-hidden rounded-t-2xl border-t border-white/15 transition-[height] duration-300 ease-out lg:hidden ${heightClass}`}
      aria-label="Mobile telemetry drawer"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-2.5">
        <button
          type="button"
          onClick={cycleSnap}
          className="flex items-center gap-2 text-left text-xs font-medium text-slate-300"
          aria-label={`Drawer height: ${snap}. Tap to resize`}
        >
          <span className="inline-block h-1.5 w-8 rounded-full bg-white/25" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            {snap === "peek" ? "Expand" : snap === "half" ? "Full View" : "Minimize"}
          </span>
        </button>

        {!compareEnabled && (
          <div className="inline-flex rounded-pill border border-white/10 bg-[#070d16] p-0.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab("feed");
                if (snap === "peek") setSnap("half");
              }}
              className={`rounded-pill px-2.5 py-1 text-[11px] font-medium transition-colors ${
                effectiveTab === "feed"
                  ? "bg-white/15 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Regions
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("details");
                if (snap === "peek") setSnap("half");
              }}
              className={`flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-medium transition-colors ${
                effectiveTab === "details"
                  ? "bg-white/15 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Trend Post</span>
              {hasSelectedRegion && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          </div>
        )}
      </div>

      {snap !== "peek" && (
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          {effectiveTab === "feed" ? feedContent : detailsContent}
        </div>
      )}
    </section>
  );
}
