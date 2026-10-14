import { Suspense } from "react";
import { HomePageClient } from "@/app/HomePageClient";

function HomePageFallback() {
  return (
    <main className="flex h-dvh flex-col bg-ink text-slate-100">
      <header className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
        <h1 className="text-base font-medium tracking-tight text-white sm:text-lg">Bluegram</h1>
        <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">Loading…</p>
      </header>
      <div className="min-h-0 flex-1 animate-pulse bg-white/[0.02]" />
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageClient />
    </Suspense>
  );
}
