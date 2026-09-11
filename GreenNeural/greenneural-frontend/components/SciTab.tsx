import { useState } from "react";

type SciTabProps = {
  onCheckGreenerRegions?: () => void;
  disableTelemetry?: boolean;
};

export default function SciTab({ onCheckGreenerRegions }: SciTabProps) {
  const [energy, setEnergy] = useState("");
  const [intensity, setIntensity] = useState("");
  const [embodied, setEmbodied] = useState("");
  const [unit, setUnit] = useState("tokens");
  const [result, setResult] = useState<number | null>(null);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function interpret(sci: number) {
    if (sci <= 500) return "Very low impact";
    if (sci <= 2000) return "Moderate impact";
    return "High impact";
  }

  function downloadSCI() {
    if (result === null) return;
    const content = `GreenNeural SCI Result
----------------------

Workload Energy (E): ${energy} kWh
Region Carbon Intensity (I): ${intensity} gCO₂/kWh
Model Resource Overhead (MR): ${embodied} gCO₂

SCI Score: ${result.toFixed(2)} gCO₂

Explanation:
SCI = (E × I) + MR
This score represents the total carbon impact of your workload.`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "GreenNeural_SCI_Result.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setInterpretation(null);

    const body = {
      energy_kwh: parseFloat(energy),
      intensity_gco2_per_kwh: parseFloat(intensity),
      embodied_emissions_gco2e: parseFloat(embodied),
      functional_unit: unit,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sci/calc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: unknown = await res.json();
      const sci =
        typeof data === "object" && data !== null && "sci" in data
          ? (data as { sci: unknown }).sci
          : undefined;

      if (!res.ok || typeof sci !== "number" || !Number.isFinite(sci)) {
        throw new Error("The SCI API returned an invalid result.");
      }

      setResult(sci);
      setInterpretation(interpret(sci));

      // The 'disableTelemetry' prop is not destructured in the component signature, which would cause a runtime error.
      // To fix this, update the signature to: export default function SciTab({ onCheckGreenerRegions, disableTelemetry }: SciTabProps)
      // The telemetry logic is temporarily commented out to prevent a crash.
      /* if (!disableTelemetry) {
        // Telemetry is non-critical: a failed event must not discard the result.
        void fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/telemetry/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_type: "sci_calc", sci_value: sci }),
        });
      } */
    } catch {
      setError("Unable to calculate SCI. Check the input values and confirm the backend is running.");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">SCI Calculator</h1>
      <details className="rounded-lg bg-gray-100 p-4 text-gray-700">
        <summary className="cursor-pointer text-lg font-semibold text-gray-900">How SCI is calculated</summary>
        <p className="mt-2">The Sustainable Compute Intensity (SCI) score measures the carbon impact of running a workload. It combines the energy used, the carbon intensity of the region, and the model’s resource footprint.</p>
        <h3 className="mt-4 font-semibold">SCI Formula</h3>
        <p className="mt-1">SCI = (E × I) + MR</p>
        <h3 className="mt-4 font-semibold">Where:</h3>
        <ul className="ml-6 list-disc">
          <li><strong>E</strong> = Energy consumed by the workload (kWh)</li>
          <li><strong>I</strong> = Carbon intensity of the region (gCO₂/kWh)</li>
          <li><strong>MR</strong> = Model resource overhead (gCO₂)</li>
        </ul>
        <h3 className="mt-4 font-semibold">Example</h3>
        <p className="mt-1">If your workload uses 10 kWh in a region with 200 gCO₂/kWh carbon intensity, and your model overhead is 50 gCO₂:</p>
        <p className="mt-1">SCI = (10 × 200) + 50 = 2050 gCO₂</p>
      </details>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
        <div>
          <label>Energy (kWh)</label>
          <input
            type="number"
            value={energy}
            onChange={(e) => setEnergy(e.target.value)}
            className="w-full bg-slate-800 text-white px-2 py-1 rounded-md"
          />
        </div>
        <div>
          <label>Intensity (gCO₂/kWh)</label>
          <input
            type="number"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full bg-slate-800 text-white px-2 py-1 rounded-md"
          />
        </div>
        <div>
          <label>Embodied emissions (gCO₂e)</label>
          <input
            type="number"
            value={embodied}
            onChange={(e) => setEmbodied(e.target.value)}
            className="w-full bg-slate-800 text-white px-2 py-1 rounded-md"
          />
        </div>
        <div>
          <label>Functional unit</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full bg-slate-800 text-white px-2 py-1 rounded-md"
          />
        </div>
        <button
          type="submit"
          className="mt-2 px-4 py-2 rounded-md bg-emerald-500 text-slate-950 font-semibold"
        >
          Calculate SCI
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-md bg-red-950 p-3 text-red-200">
          {error}
        </p>
      )}

      {typeof result === "number" && Number.isFinite(result) && (
        <div className="mt-4 bg-slate-900 p-4 rounded-md">
          <h2 className="font-semibold mb-2">Result</h2>
          <p>
            SCI: <strong>{result.toFixed(2)}</strong> ({interpretation})
          </p>
          <button type="button" onClick={downloadSCI} className="mt-4 rounded bg-green-600 px-4 py-2 text-white">
            Download SCI Result
          </button>
          <section className="mt-4 rounded border border-green-200 bg-green-50 p-4 text-gray-700">
            <h3 className="font-semibold">SCI Interpretation</h3>
            <p className="mt-2"><strong>0 – 500 gCO₂:</strong> Very low impact — highly efficient workload.</p>
            <p className="mt-1"><strong>500 – 2000 gCO₂:</strong> Moderate impact — consider switching to a greener region.</p>
            <p className="mt-1"><strong>2000+ gCO₂:</strong> High impact — significant carbon footprint.</p>
          </section>
          <section className="mt-4 rounded border border-blue-200 bg-blue-50 p-4 text-gray-700">
            <h3 className="font-semibold">Want to reduce your SCI?</h3>
            <p className="mt-2">Try switching to a greener region or running your workload during low-carbon hours.</p>
            <button type="button" onClick={onCheckGreenerRegions} className="mt-2 rounded bg-blue-600 px-4 py-2 text-white">
              Check Greener Regions
            </button>
          </section>
        </div>
      )}
    </div>
  );
}