import { Suspense } from "react";
import { PulseFeedClient } from "@/components/PulseFeedClient";

function PulseFeedFallback() {
  return (
    <main className="flex h-dvh flex-col bg-ink text-slate-100">
      <header className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
        <h1 className="font-display text-base font-semibold tracking-tight text-white sm:text-lg">
          Bluegram Pulse
        </h1>
        <p className="mt-0.5 font-mono text-[11px] text-slate-400">
          Loading multi-agency telemetry stream…
        </p>
      </header>
      <div className="min-h-0 flex-1 animate-pulse bg-white/[0.02]" />
    </main>
  );
}

export default function PulseFeedPage() {
  return (
    <Suspense fallback={<PulseFeedFallback />}>
      <PulseFeedClient />
    </Suspense>
  );
}
