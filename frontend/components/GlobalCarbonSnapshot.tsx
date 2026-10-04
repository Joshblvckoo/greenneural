import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

type Provider = "aws" | "azure" | "gcp";
type Snapshot = Record<Provider, number | null>;

const regions: { provider: Provider; label: string; region: string }[] = [
  { provider: "aws", label: "AWS · London", region: "eu-west-2" },
  { provider: "azure", label: "Azure · UK South", region: "uksouth" },
  { provider: "gcp", label: "GCP · London", region: "europe-west2" },
];

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchIntensity(provider: Provider, region: string): Promise<number | null> {
  const query = new URLSearchParams({ provider, region });
  const response = await fetch(`${apiUrl}/api/v1/carbon/intensity?${query}`);
  if (!response.ok) {
    throw new Error(`Carbon API returned ${response.status}`);
  }

  const result: { intensity_gco2_per_kwh?: number } = await response.json();
  return typeof result.intensity_gco2_per_kwh === "number"
    ? result.intensity_gco2_per_kwh
    : null;
}

const GlobalCarbonSnapshot = () => {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all(
      regions.map(async ({ provider, region }) => {
        try {
          return [provider, await fetchIntensity(provider, region)] as const;
        } catch {
          return [provider, null] as const;
        }
      }),
    ).then((results) => {
      if (active) {
        const nextSnapshot: Snapshot = { aws: null, azure: null, gcp: null };
        for (const [provider, value] of results) {
          nextSnapshot[provider] = value;
        }
        setSnapshot(nextSnapshot);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-white p-6 dark:border-white/10 dark:bg-[#0d1d18] sm:p-8">
      <div className="flex items-start gap-3">
        <Activity
          size={20}
          className="mt-1 text-emerald-700 dark:text-emerald-300"
          aria-hidden="true"
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            Live signals where available
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Global carbon snapshot
          </h2>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {regions.map(({ provider, label }) => (
          <div
            key={provider}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <p className="text-sm text-slate-500 dark:text-white/50">{label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
              {snapshot ? (
                snapshot[provider] === null ? (
                  <span className="text-sm font-medium text-slate-500 dark:text-white/50">
                    Unavailable
                  </span>
                ) : (
                  <>
                    {snapshot[provider]?.toLocaleString()}{" "}
                    <span className="text-xs font-normal text-slate-500 dark:text-white/45">
                      gCO₂/kWh
                    </span>
                  </>
                )
              ) : (
                <span className="text-sm font-medium text-slate-400">Loading…</span>
              )}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-white/40">
        Values depend on live grid data availability for each region.
      </p>
    </section>
  );
};

export default GlobalCarbonSnapshot;
