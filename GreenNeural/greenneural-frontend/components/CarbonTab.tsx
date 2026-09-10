import { useEffect, useState } from "react";
import RegionSelector from "@/components/RegionSelector";
import { REGION_OPTIONS } from "@/config/regions";

type CarbonResponse = { region: string; provider: string; intensity_gco2_per_kwh: number | null };
type CleanestResponse = { region: string; provider: string; intensity_gco2_per_kwh: number };

const providers = Object.keys(REGION_OPTIONS);

function getDefaultRegion(provider: string) {
  return Object.values(REGION_OPTIONS[provider].groups).flat()[0]?.value ?? "";
}

export default function CarbonTab() {
  const [provider, setProvider] = useState("aws");
  const [region, setRegion] = useState("eu-west-2");
  const [current, setCurrent] = useState<CarbonResponse | null>(null);
  const [cleanest, setCleanest] = useState<CleanestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchCarbon() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/carbon/intensity?provider=${provider}&region=${region}`);
      if (!response.ok) throw new Error(`Carbon API returned ${response.status}`);
      setCurrent(await response.json());
    } catch {
      setError("Unable to reach the carbon API. Start the backend at http://localhost:8000 and try again.");
    }
  }

  async function fetchCleanest() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/carbon/cleanest-region?provider=${provider}`);
      if (!response.ok) throw new Error(`Carbon API returned ${response.status}`);
      setCleanest(await response.json());
    } catch {
      setError("Unable to reach the carbon API. Start the backend at http://localhost:8000 and try again.");
    }
  }

  useEffect(() => {
    setError(null);
    void fetchCarbon();
    void fetchCleanest();
  }, [provider, region]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Carbon Intensity</h1>
      <div className="flex gap-4">
        <div>
          <label>Provider</label>
          <select value={provider} onChange={(event) => {
            const nextProvider = event.target.value;
            setProvider(nextProvider);
            setRegion(getDefaultRegion(nextProvider));
          }} className="rounded-md bg-slate-800 px-2 py-1 text-white">
            {providers.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
          </select>
        </div>
        <div>
          <label>Region</label>
          <RegionSelector provider={provider} region={region} setRegion={setRegion} />
        </div>
      </div>

      {error && <p role="alert" className="rounded-md bg-red-950 p-3 text-red-200">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Carbon Intensity</h3>
          {current?.intensity_gco2_per_kwh != null ? (
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {current.intensity_gco2_per_kwh} gCO₂/kWh
            </p>
          ) : (
            <p className="text-red-600 dark:text-red-400">Carbon intensity unavailable</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Cleanest region right now</h2>
          {cleanest ? (
            <p className="text-gray-900 dark:text-gray-100">{cleanest.provider.toUpperCase()} {cleanest.region}: <strong>{cleanest.intensity_gco2_per_kwh} gCO₂/kWh</strong></p>
          ) : <p className="text-gray-900 dark:text-gray-100">Loading…</p>}
        </div>
      </div>
    </div>
  );
}
