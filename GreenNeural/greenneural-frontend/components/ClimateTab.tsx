import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CITY_GROUPS, cityValue } from "@/config/cities";

const RiskMap = dynamic(() => import("./RiskMap"), { ssr: false });

type RiskResponse = {
  city: string;
  layer_url: string;
  summary_score: number;
};

const layers = ["heat", "flood", "airquality"];

type RealtimeRisk = {
  city: string;
  heat: number;
  flood: number;
  air: number;
  total_risk: number;
};

type TopRisk = {
  highest: RealtimeRisk;
  lowest: RealtimeRisk;
  top_5: RealtimeRisk[];
  bottom_5: RealtimeRisk[];
  top_5_by_layer: {
    heat: RealtimeRisk[];
    flood: RealtimeRisk[];
    airquality: RealtimeRisk[];
  };
};

export default function ClimateTab() {
  const [city, setCity] = useState("london");
  const [layer, setLayer] = useState("heat");
  const [citySearch, setCitySearch] = useState("");
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [snapshot, setSnapshot] = useState<TopRisk | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchRisk() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/risk/${layer}?city=${city}`
      );
      if (!res.ok) throw new Error(`Climate API returned ${res.status}`);
      const data = await res.json();
      setRisk(data);
    } catch {
      setError("Unable to reach the climate-risk API. Start the backend at http://localhost:8000 and try again.");
    }
  }

  async function fetchSnapshot() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/risk/top`);
      if (!res.ok) throw new Error(`Climate API returned ${res.status}`);
      setSnapshot(await res.json());
    } catch {
      setError("Unable to load the climate-risk snapshot.");
    }
  }

  useEffect(() => {
    setError(null);
    fetchRisk();
  }, [city, layer]);

  useEffect(() => {
    fetchSnapshot();
  }, []);

  const matchingCityGroups = Object.entries(CITY_GROUPS).map(([continent, cities]) => [
    continent,
    cities.filter((candidate) => candidate.toLowerCase().includes(citySearch.toLowerCase())),
  ] as const).filter(([, cities]) => cities.length > 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Urban Climate Risk</h1>
      <div className="flex gap-4">
        <div>
          <label>City</label>
          <input
            type="search"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            placeholder="Search cities"
            className="mb-2 block w-full rounded-md border border-green-600 bg-green-50 px-2 py-1 text-green-900"
          />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-slate-800 text-white px-2 py-1 rounded-md"
          >
            {matchingCityGroups.map(([continent, cities]) => (
              <optgroup key={continent} label={continent}>
                {cities.map((candidate) => (
                  <option key={candidate} value={cityValue(candidate)}>
                    {candidate}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label>Layer</label>
          <select
            value={layer}
            onChange={(e) => setLayer(e.target.value)}
            className="bg-slate-800 text-white px-2 py-1 rounded-md"
          >
            {layers.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-950 p-3 text-red-200">
          {error}
        </p>
      )}

      <section className="rounded-md bg-slate-900 p-4">
        <h2 className="mb-3 text-xl font-semibold">Live Climate Risk Snapshot</h2>
        {snapshot ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-medium text-red-300">Highest risk right now</h3>
              <p>{snapshot.highest.city} — {snapshot.highest.total_risk}</p>
              <h3 className="mt-3 font-medium">Top 5</h3>
              <ol className="list-inside list-decimal">
                {snapshot.top_5.map((entry) => <li key={entry.city}>{entry.city} — {entry.total_risk}</li>)}
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-green-300">Lowest risk right now</h3>
              <p>{snapshot.lowest.city} — {snapshot.lowest.total_risk}</p>
              <h3 className="mt-3 font-medium">Bottom 5</h3>
              <ol className="list-inside list-decimal">
                {snapshot.bottom_5.map((entry) => <li key={entry.city}>{entry.city} — {entry.total_risk}</li>)}
              </ol>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {(["heat", "flood", "airquality"] as const).map((riskLayer) => (
              <div key={riskLayer}>
                <h3 className="font-medium">Top 5 {riskLayer === "airquality" ? "air quality" : riskLayer}</h3>
                <ol className="list-inside list-decimal">
                  {snapshot.top_5_by_layer[riskLayer].map((entry) => (
                    <li key={entry.city}>{entry.city} — {entry[riskLayer === "airquality" ? "air" : riskLayer]}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          </>
        ) : <p>Loading snapshot…</p>}
      </section>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded-md">
          <h2 className="font-semibold mb-2">Summary</h2>
          {risk ? (
            <p>
              {layer === "heat" ? "🔥" : layer === "flood" ? "🌊" : "🌫"} {risk.city.toUpperCase()} {layer.toUpperCase()} risk score:{" "}
              <strong>{risk.summary_score}/100</strong>
            </p>
          ) : (
            <p>Loading…</p>
          )}
        </div>
        <div className="bg-slate-900 p-4 rounded-md">
          <h2 className="font-semibold mb-2">Risk map</h2>
          {risk ? (
            <RiskMap city={risk.city} />
          ) : (
            <p>Loading map…</p>
          )}
        </div>
      </div>
    </div>
  );
}
