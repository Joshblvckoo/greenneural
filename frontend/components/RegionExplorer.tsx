import { useEffect, useState } from "react";
import { REGION_OPTIONS } from "@/config/regions";

type RegionResult = {
  value: string;
  label: string;
  group: string;
  intensity: number | null;
  failed: boolean;
};

const providers = Object.keys(REGION_OPTIONS);
const CONCURRENCY = 6;

function bandColor(intensity: number | null) {
  if (intensity == null) return "bg-gray-400";
  if (intensity <= 150) return "bg-emerald-500";
  if (intensity <= 350) return "bg-amber-500";
  return "bg-red-500";
}

async function fetchWithLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const current = cursor;
      cursor += 1;
      results[current] = await worker(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

type RegionExplorerProps = {
  onSelectRegion?: (provider: string, region: string) => void;
};

export default function RegionExplorer({ onSelectRegion }: RegionExplorerProps) {
  const [provider, setProvider] = useState("aws");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultsByProvider, setResultsByProvider] = useState<Record<string, RegionResult[]>>({});

  useEffect(() => {
    if (resultsByProvider[provider]) return;

    const flatRegions = Object.entries(REGION_OPTIONS[provider].groups).flatMap(([group, regions]) =>
      regions.map((region) => ({ ...region, group })),
    );

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a live fetch on provider change, not deriving render state
    setLoading(true);
    setError(null);

    fetchWithLimit(flatRegions, CONCURRENCY, async (region): Promise<RegionResult> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/carbon/intensity?provider=${provider}&region=${region.value}`,
        );
        if (!response.ok) throw new Error("bad response");
        const data = await response.json();
        const intensity = data?.intensity_gco2_per_kwh ?? data?.intensity ?? null;
        return { ...region, intensity, failed: intensity == null };
      } catch {
        return { ...region, intensity: null, failed: true };
      }
    }).then((results) => {
      if (cancelled) return;
      setResultsByProvider((prev) => ({ ...prev, [provider]: results }));
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setError("Unable to reach the carbon API. Start the backend and try again.");
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const results = resultsByProvider[provider] ?? [];
  const sorted = [...results]
    .filter((r) => !r.failed)
    .sort((a, b) => (a.intensity ?? Infinity) - (b.intensity ?? Infinity));
  const cleanest = sorted[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Region Explorer</h1>
        <select
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-white"
        >
          {providers.map((item) => (
            <option key={item} value={item}>
              {REGION_OPTIONS[item].label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        Live carbon intensity across every {REGION_OPTIONS[provider].label} region, ranked cleanest first.
      </p>

      {error && (
        <p role="alert" className="rounded-md bg-red-950 p-3 text-red-200">
          {error}
        </p>
      )}

      {cleanest && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Cleanest region right now</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {cleanest.label} — {cleanest.intensity} gCO₂/kWh
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 font-medium">Region</th>
              <th className="px-4 py-2 font-medium">Area</th>
              <th className="px-4 py-2 font-medium text-right">gCO₂/kWh</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading && results.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  Loading live intensity for every region…
                </td>
              </tr>
            )}

            {sorted.map((region) => (
              <tr key={region.value} className="text-gray-900 dark:text-gray-100">
                <td className="px-4 py-2">
                  <span className={`mr-2 inline-block h-2 w-2 rounded-full ${bandColor(region.intensity)}`} />
                  {region.label}
                </td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{region.group}</td>
                <td className="px-4 py-2 text-right font-semibold">{region.intensity}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectRegion?.(provider, region.value)}
                    className="text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {results
              .filter((r) => r.failed)
              .map((region) => (
                <tr key={region.value} className="text-gray-400 dark:text-gray-500">
                  <td className="px-4 py-2">{region.label}</td>
                  <td className="px-4 py-2">{region.group}</td>
                  <td className="px-4 py-2 text-right">unavailable</td>
                  <td />
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
