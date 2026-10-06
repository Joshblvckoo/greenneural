import { Activity, MapPin } from "lucide-react";
import DataSourceTag from "./DataSourceTag";
import SignalValue from "./SignalValue";
import type { LiveHomeResponse, SignalTrend } from "./liveHomeTypes";

type Props = {
  providers: LiveHomeResponse["provider_health"] | null;
  loading: boolean;
};

function trendLabel(trend: SignalTrend, delta: number | null) {
  if (trend === "unknown" || delta === null) return "Trend warming up";
  const direction = trend === "down" ? "↓" : trend === "up" ? "↑" : "→";
  return `${direction} ${Math.abs(delta).toFixed(1)} gCO₂/kWh in 10 min`;
}

export default function ProviderHealthWidget({ providers, loading }: Props) {
  const availableProviders = Object.entries(providers ?? {});

  return (
    <section
      className="rounded-3xl border border-emerald-900/10 bg-white p-6 dark:border-white/10 dark:bg-[#0d1d18] sm:p-8"
      aria-labelledby="provider-health-title"
    >
      <div className="flex items-start gap-3">
        <Activity
          size={20}
          className="mt-1 text-emerald-700 dark:text-emerald-300"
          aria-hidden="true"
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            Provider signals
          </p>
          <h2 id="provider-health-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Cloud provider carbon health
          </h2>
        </div>
      </div>

      {loading && !providers ? (
        <p className="mt-5 text-sm text-slate-500 dark:text-white/50" role="status">
          Loading provider readings…
        </p>
      ) : availableProviders.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {availableProviders.map(([provider, health]) => (
            <article
              key={provider}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
                  {provider}
                </h3>
                <span className="text-xs text-slate-500 dark:text-white/45">
                  {health.regions_available}/{health.regions_checked} regions
                </span>
              </div>
              <p className="mt-5 text-sm text-slate-500 dark:text-white/50">
                Regional average
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
                <SignalValue
                  value={health.average_intensity}
                  trend={health.trend}
                  updatedAt={health.updated_at}
                />
                {health.average_intensity !== null && (
                  <span className="ml-2 text-xs font-normal text-slate-500 dark:text-white/45">
                    gCO₂/kWh
                  </span>
                )}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-white/45">
                {trendLabel(health.trend, health.delta_10m)}
              </p>
              {health.cleanest_region ? (
                <div className="mt-5 flex items-start gap-2 border-t border-slate-200 pt-4 text-sm dark:border-white/10">
                  <MapPin
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300"
                    aria-hidden="true"
                  />
                  <p className="text-slate-600 dark:text-emerald-50/65">
                    Cleanest:{" "}
                    <span className="font-medium text-slate-900 dark:text-white">
                      {health.cleanest_region.region}
                    </span>
                    <br />
                    {health.cleanest_region.intensity.toLocaleString()} gCO₂/kWh
                  </p>
                </div>
              ) : (
                <p className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-white/10 dark:text-white/45">
                  No current signal available.
                </p>
              )}
              <DataSourceTag
                source={health.sources}
                latencyMs={health.latency_ms}
                status={health.status}
                updatedAt={health.updated_at}
              />
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-500 dark:text-white/50">
          Provider readings are unavailable.
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-white/40">
        Regional provider averages are combined from available readings; provider carbon methodologies can differ.
      </p>
    </section>
  );
}
