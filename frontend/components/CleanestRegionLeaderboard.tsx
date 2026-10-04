import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

type Entry = {
  provider: string;
  region?: string;
  intensity_gco2_per_kwh?: number;
};

const providers = ["aws", "azure", "gcp"];
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

const CleanestRegionLeaderboard = () => {
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all(
      providers.map(async (provider): Promise<Entry> => {
        try {
          const response = await fetch(
            `${apiUrl}/api/v1/carbon/cleanest-region?${new URLSearchParams({ provider })}`,
          );
          if (!response.ok) {
            throw new Error(`Carbon API returned ${response.status}`);
          }
          const result: Omit<Entry, "provider"> = await response.json();
          return { provider, ...result };
        } catch {
          return { provider };
        }
      }),
    ).then((results) => {
      if (active) setEntries(results);
    });

    return () => {
      active = false;
    };
  }, []);

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
            Across supported regions
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Cleanest regions right now
          </h2>
        </div>
      </div>
      <ul className="mt-6 divide-y divide-slate-200 dark:divide-white/10">
        {providers.map((provider) => {
          const entry = entries?.find((item) => item.provider === provider);
          return (
            <li
              key={provider}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="font-semibold uppercase text-slate-900 dark:text-white">
                  {provider}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-white/50">
                  {entry?.region ?? (entries ? "No live data available" : "Loading…")}
                </p>
              </div>
              <p className="text-right text-sm font-medium text-slate-700 dark:text-emerald-100/70">
                {typeof entry?.intensity_gco2_per_kwh === "number" ? (
                  <>
                    {entry.intensity_gco2_per_kwh.toLocaleString()}{" "}
                    <span className="text-xs text-slate-500 dark:text-white/40">
                      gCO₂/kWh
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-white/40">
                    —
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-white/40">
        A live comparison of regions with available carbon-intensity readings.
      </p>
    </section>
  );
};

export default CleanestRegionLeaderboard;
