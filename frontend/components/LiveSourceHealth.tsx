import DataSourceTag from "./DataSourceTag";
import type { LiveHomeResponse } from "./liveHomeTypes";

export default function LiveSourceHealth({
  sources,
}: {
  sources: LiveHomeResponse["source_health"] | null;
}) {
  if (!sources) return null;

  return (
    <section
      className="mx-auto mb-5 max-w-7xl rounded-3xl border border-emerald-900/10 bg-white p-6 dark:border-white/10 dark:bg-[#0d1d18] sm:p-8"
      aria-labelledby="live-source-health-title"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          Feed diagnostics
        </p>
        <h2
          id="live-source-health-title"
          className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white"
        >
          Live source availability
        </h2>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(sources).map(([source, health]) => (
          <article
            key={source}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {source}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-white/60">
              {health.regions_available} of {health.regions_checked} mapped
              regions reporting
            </p>
            <DataSourceTag
              source={source}
              latencyMs={health.latency_ms}
              status={health.status}
              updatedAt={health.updated_at}
              className="mt-2"
            />
            {health.errors.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-amber-800 dark:text-amber-200">
                {health.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
