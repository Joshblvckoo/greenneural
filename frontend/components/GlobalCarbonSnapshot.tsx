import { Activity } from "lucide-react";
import DataSourceTag from "./DataSourceTag";
import SignalStatusBadge from "./SignalStatusBadge";
import SignalValue from "./SignalValue";
import type { LiveHomeResponse } from "./liveHomeTypes";

type Props = {
  signal: LiveHomeResponse["global_signal"] | null;
  loading: boolean;
};

export default function GlobalCarbonSnapshot({ signal, loading }: Props) {
  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-white p-6 transition-colors dark:border-white/10 dark:bg-[#0d1d18] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Activity
            size={20}
            className="mt-1 text-emerald-700 dark:text-emerald-300"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              Aggregated grid signal
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Global carbon snapshot
            </h2>
          </div>
        </div>
        {signal && <SignalStatusBadge status={signal.status} />}
      </div>

      {loading && !signal ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-white/50" role="status">
          Loading live regional signals…
        </p>
      ) : signal ? (
        <>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm text-slate-500 dark:text-white/50">
                {signal.status === "fallback"
                  ? "Fallback estimate · not a live reading"
                  : `Mean of ${signal.regions_included} available grid readings`}
              </p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                <SignalValue
                  value={signal.intensity}
                  trend={signal.trend}
                  updatedAt={signal.updated_at}
                />
                {signal.intensity !== null && (
                  <span className="ml-2 text-sm font-normal text-slate-500 dark:text-white/45">
                    gCO₂/kWh
                  </span>
                )}
              </p>
            </div>
            <div className="text-sm text-slate-600 dark:text-emerald-50/65">
              <p className="font-medium">
                {signal.trend === "unknown"
                  ? "10-minute trend is warming up"
                  : `${signal.trend === "down" ? "↓" : signal.trend === "up" ? "↑" : "→"} ${
                      signal.delta_10m === null ? "" : `${Math.abs(signal.delta_10m).toFixed(1)} gCO₂/kWh over 10 min`
                    }`}
              </p>
            </div>
          </div>
          <DataSourceTag
            source={signal.sources}
            latencyMs={signal.latency_ms}
            status={signal.status}
            updatedAt={signal.updated_at}
          />
          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-white/40">
              {signal.methodology}
            </p>
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-slate-500 dark:text-white/50">
          Global signal is unavailable.
        </p>
      )}

    </section>
  );
}
