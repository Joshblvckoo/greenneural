import { Trophy } from "lucide-react";
import DataSourceTag from "./DataSourceTag";
import SignalValue from "./SignalValue";
import type { LiveSignal } from "./liveHomeTypes";

type Props = {
  entries: LiveSignal[] | null;
  loading: boolean;
};

export default function CleanestRegionLeaderboard({
  entries,
  loading,
}: Props) {
  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-white p-6 dark:border-white/10 dark:bg-[#0d1d18] sm:p-8">
      <div className="flex items-start gap-3">
        <Trophy
          size={20}
          className="mt-1 text-emerald-700 dark:text-emerald-300"
          aria-hidden="true"
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            Global top 3 · AWS, Azure &amp; GCP
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Cleanest regions across providers
          </h2>
        </div>
      </div>

      {loading && !entries ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-white/50" role="status">
          Loading regional readings…
        </p>
      ) : entries?.length ? (
        <ol className="mt-6 divide-y divide-slate-200 dark:divide-white/10">
          {entries.map((entry, index) => (
            <li
              key={`${entry.provider}-${entry.region}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {entry.provider.toUpperCase()} · {entry.region}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-slate-800 dark:text-emerald-100/80">
                  <SignalValue
                    value={entry.intensity}
                    trend={entry.trend}
                    updatedAt={entry.updated_at}
                  />{" "}
                  <span className="text-xs font-normal text-slate-500 dark:text-white/40">
                    gCO₂/kWh
                  </span>
                </p>
              </div>
              <DataSourceTag
                source={entry.source}
                latencyMs={entry.latency_ms}
                status={entry.status}
                updatedAt={entry.updated_at}
                className="col-span-2 mt-0"
              />
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-6 text-sm text-slate-500 dark:text-white/50">
          No recent regional readings are available for the global ranking.
        </p>
      )}
      <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-white/40">
        Static estimates are intentionally excluded from this ranking.
      </p>
    </section>
  );
}
