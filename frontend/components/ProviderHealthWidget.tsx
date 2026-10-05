import { useEffect, useState } from "react";
import { Activity, MapPin } from "lucide-react";

type RegionHealth = {
  region: string;
  intensity: number;
};

type ProviderHealth = {
  average_intensity: number;
  cleanest_region: RegionHealth;
  regions_available: number;
  regions_checked: number;
};

type HomeLiveResponse = {
  provider_health: Record<string, ProviderHealth>;
  generated_at: string;
};

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const providers = ["aws", "azure", "gcp"];

export default function ProviderHealthWidget() {
  const [data, setData] = useState<HomeLiveResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const loadHealth = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/home/live`);
        if (!response.ok) {
          throw new Error(`Provider health request returned ${response.status}`);
        }
        const result: HomeLiveResponse = await response.json();
        if (active) {
          setData(result);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) timer = setTimeout(loadHealth, 30_000);
      }
    };

    void loadHealth();
    return () => {
      active = false;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);

  const availableProviders = providers.filter(
    (provider) => data?.provider_health[provider],
  );

  return (
    <section
      className="rounded-3xl border border-emerald-900/10 bg-white p-6 dark:border-white/10 dark:bg-[#0d1d18] sm:p-8"
      aria-labelledby="provider-health-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Activity
            size={20}
            className="mt-1 text-emerald-700 dark:text-emerald-300"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              Live grid signals
            </p>
            <h2
              id="provider-health-title"
              className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white"
            >
              Cloud provider carbon health
            </h2>
          </div>
        </div>
        {data && (
          <p className="text-xs text-slate-500 dark:text-white/40">
            Updated{" "}
            {new Date(data.generated_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {error && (
        <p className="mt-5 text-sm text-amber-700 dark:text-amber-200/75" role="status">
          Live health data could not be refreshed.
          {data ? " Showing the last available readings." : ""}
        </p>
      )}

      {data && availableProviders.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {availableProviders.map((provider) => {
            const health = data.provider_health[provider];
            return (
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
                  Average intensity
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
                  {health.average_intensity.toLocaleString()}
                  <span className="ml-2 text-xs font-normal text-slate-500 dark:text-white/45">
                    gCO₂/kWh
                  </span>
                </p>
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
              </article>
            );
          })}
        </div>
      ) : data ? (
        <p className="mt-5 text-sm text-slate-500 dark:text-white/50">
          No provider health data is currently available.
        </p>
      ) : (
        <p className="mt-5 text-sm text-slate-400 dark:text-white/45" role="status">
          Loading provider health…
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-white/40">
        Averages include only regions with an available reading; live values
        refresh every 30 seconds.
      </p>
    </section>
  );
}
