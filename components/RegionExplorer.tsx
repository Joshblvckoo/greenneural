import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { REGION_OPTIONS } from "@/regions";

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

export default function RegionExplorer() {
  const router = useRouter();
  const [provider, setProvider] = useState("aws");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultsByProvider, setResultsByProvider] = useState<Record<string, RegionResult[]>>({});

  useEffect(() => {
    if (resultsByProvider[provider]) return;

    const flatRegions = Object.entries(REGION_OPTIONS[provider].groups).flatMap(([group, regions]) =>
      regions.map((region) => ({ ...region, group }))
    );

    let cancelled = false;
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
    })
      .then((results) => {
        if (cancelled) return;
        setResultsByProvider((prev) => ({ ...prev, [provider]: results }));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Unable to reach the carbon API. Start the backend and try again.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [provider, resultsByProvider]);

  const results = resultsByProvider[provider] ?? [];
  const sorted = [...results]
    .filter((r) => !r.failed)
    .sort((a, b) => (a.intensity ?? Infinity) - (b.intensity ?? Infinity));
  const cleanest = sorted[0];

  const handleView = (region: RegionResult) => {
    router.push({
      pathname: "/signup",
      query: {
        provider,
        region: region.value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Region Explorer</h2>
        <select
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-white text-sm"
        >
          {providers.map((item) => (
            <option key={item} value={item}>
              {REGION_OPTIONS[item].label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-400">
        Live carbon intensity across every {REGION_OPTIONS[provider].label} region, ranked cleanest first.
        Click a region to continue to signup and unlock the full dashboard.
      </p>

      {error && (
        <p role="alert" className="rounded-md bg-red-950 p-3 text-red-200 text-sm">
          {error}
        </p>
      )}

      {cleanest && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
          <p className="text-sm font-medium text-emerald-300">Cleanest region right now</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {cleanest.label} — {cleanest.intensity} gCO₂/kWh
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="bg-slate-800 text-gray-400">
            <tr>
              <th className="px-4 py-2 font-medium">Region</th>
              <th className="px-4 py-2 font-medium">Area</th>
              <th className="px-4 py-2 font-medium text-right">gCO₂/kWh</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading && results.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Loading live intensity for every region…
                </td>
              </tr>
            )}

            {sorted.map((region) => (
              <tr key={region.value} className="text-gray-100">
                <td className="px-4 py-2">
                  <span className={`mr-2 inline-block h-2 w-2 rounded-full ${bandColor(region.intensity)}`} />
                  {region.label}
                </td>
                <td className="px-4 py-2 text-gray-400">{region.group}</td>
                <td className="px-4 py-2 text-right font-semibold">
                  {region.intensity ?? "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleView(region)}
                    className="text-emerald-400 hover:underline text-xs"
                  >
                    View & continue to signup
                  </button>
                </td>
              </tr>
            ))}

            {results
              .filter((r) => r.failed)
              .map((region) => (
                <tr key={region.value} className="text-gray-500">
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