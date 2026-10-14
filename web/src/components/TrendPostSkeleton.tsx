export function TrendPostSkeleton() {
  return (
    <section className="flex h-full flex-col gap-5 p-5 lg:p-6" aria-busy="true" aria-label="Loading trend">
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-20 rounded bg-white/10" />
        <div className="h-8 w-40 rounded bg-white/10" />
        <div className="h-4 w-56 rounded bg-white/5" />
        <div className="h-4 w-28 rounded bg-white/5" />
      </div>
      <div className="flex-1 animate-pulse rounded-xl border border-white/5 bg-white/[0.03] min-h-[12rem]" />
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-36 rounded bg-white/10" />
        <div className="h-8 w-52 rounded-full bg-white/10" />
        <div className="h-3 w-44 rounded bg-white/5" />
      </div>
    </section>
  );
}
