import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "../../components/DashboardLayout";

type Carbon = {
  intensity: number | null;
  intensity_gco2_per_kwh?: number | null;
  region: string;
};

type Risk = { city: string; heat: number; flood: number; air: number };
type Sci = { score: number | null; interpretation: string };
type Telemetry = {
  top_feature: string;
  last_event: string | null;
  sci_count: number;
  risk_count: number;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function DashboardHome() {
  const [carbon, setCarbon] = useState<Carbon | null>(null);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [sci, setSci] = useState<Sci | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [carbonRes, riskRes, sciRes, telemetryRes] = await Promise.all([
          fetch(`${apiUrl}/api/v1/carbon/intensity?provider=aws&region=eu-west-2`),
          fetch(`${apiUrl}/api/v1/risk/realtime?city=London`),
          fetch(`${apiUrl}/api/v1/sci/last`),
          fetch(`${apiUrl}/api/v1/telemetry/summary`),
        ]);

        if (![carbonRes, riskRes, sciRes, telemetryRes].every((response) => response.ok)) {
          throw new Error("One or more dashboard services are unavailable.");
        }

        const [carbonData, riskData, sciData, telemetryData] = await Promise.all([
          carbonRes.json() as Promise<Carbon>,
          riskRes.json() as Promise<Risk>,
          sciRes.json() as Promise<Sci>,
          telemetryRes.json() as Promise<Telemetry>,
        ]);

        setCarbon(carbonData);
        setRisk(riskData);
        setSci(sciData);
        setTelemetry(telemetryData);
      } catch {
        setError("Unable to load dashboard data. Confirm the backend is running and try again.");
      }
    };

    void loadDashboard();
  }, []);

  const carbonIntensity = carbon?.intensity ?? carbon?.intensity_gco2_per_kwh;

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="mb-4 flex justify-end">
        <Link href="/profile" className="font-medium text-emerald-300 hover:text-emerald-200">
          My Profile
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">GreenNeural Dashboard</h1>
      <p className="text-gray-600">Your sustainability insights at a glance.</p>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6">
        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Carbon Intensity</h2>
          {carbon ? (
            <>
              <p className="mt-2 break-words text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
                {carbonIntensity ?? "N/A"} <span className="whitespace-nowrap text-xl sm:text-2xl">gCO₂/kWh</span>
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-300">Region: {carbon.region}</p>
              <button type="button" className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Check Regions</button>
            </>
          ) : <p>Loading...</p>}
        </div>

        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Climate Risk</h2>
          {risk ? (
            <>
              <p className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">{risk.city}</p>
              <p className="mt-1 text-gray-900 dark:text-gray-100">Heat: {risk.heat}</p>
              <p className="text-gray-900 dark:text-gray-100">Flood: {risk.flood}</p>
              <p className="text-gray-900 dark:text-gray-100">Air Quality: {risk.air}</p>
              <button type="button" className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">View 3D Map</button>
            </>
          ) : <p className="text-gray-900 dark:text-gray-100">Loading...</p>}
        </div>

        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">SCI Summary</h2>
          {sci?.score !== null && sci ? (
            <>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{sci.score} gCO₂</p>
              <p className="mt-1 text-gray-600 dark:text-gray-300">{sci.interpretation}</p>
              <button type="button" className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Calculate SCI</button>
            </>
          ) : <p className="text-gray-900 dark:text-gray-100">No SCI calculations yet.</p>}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Telemetry Insights</h2>
        {telemetry ? (
          <div className="mt-2 space-y-1 text-gray-700 dark:text-gray-300">
            <p>Most used feature: {telemetry.top_feature}</p>
            <p>Last activity: {telemetry.last_event ?? "No activity yet"}</p>
            <p>Total SCI calculations: {telemetry.sci_count}</p>
            <p>Total climate risk checks: {telemetry.risk_count}</p>
          </div>
        ) : <p className="text-gray-900 dark:text-gray-100">Loading telemetry...</p>}
      </div>
      </div>
    </DashboardLayout>
  );
}
