import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Cloud, Map } from "lucide-react";
import DemoTopBar from "@/components/DemoTopBar";
import CarbonTab from "@/components/CarbonTab";
import CitySearchBar, { type SelectedCity } from "@/components/CitySearchBar";
import Footer from "@/components/Footer";

const ClimateRiskMap = dynamic(() => import("@/components/ClimateRiskMap"), { ssr: false });

type DemoTab = "carbon" | "risk";

const TABS: { key: DemoTab; label: string; icon: typeof Cloud }[] = [
  { key: "carbon", label: "Carbon Intensity", icon: Cloud },
  { key: "risk", label: "Climate Risk Map", icon: Map },
];

export default function DemoDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DemoTab>("carbon");
  const [riskType, setRiskType] = useState<"heat" | "flood" | "airquality">("heat");
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);

  // LaunchTry (and similar embed partners) load this in an iframe with ?embed=1,
  // which drops the GreenNeural wordmark and tightens spacing so it reads as a
  // widget rather than a whole separate site.
  const embed = router.query.embed === "1";
  const hasMapboxToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

  useEffect(() => {
    if (typeof router.query.tab === "string" && TABS.some((t) => t.key === router.query.tab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing tab state from the URL on load/navigation, not a derived render value
      setActiveTab(router.query.tab as DemoTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  return (
    <>
      <Head>
        <title>GreenNeural — Live Demo</title>
        <meta
          name="description"
          content="Try GreenNeural's carbon intensity, climate risk, and SCI tools with live data — no account required."
        />
      </Head>

      <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <DemoTopBar embed={embed} />

        <div className="mx-auto max-w-6xl p-4 sm:p-6">
          {!embed && (
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              This is a read-only preview with live data. Nothing you change here is saved —{" "}
              <Link href="/signup" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
                sign up
              </Link>{" "}
              to keep your provider, region, and workload settings.
            </p>
          )}

          <nav className="mb-6 flex flex-wrap gap-2">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-white text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-200"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>

          {activeTab === "carbon" && <CarbonTab />}

          {activeTab === "risk" && (
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="md:w-72">
                <CitySearchBar setSelectedCity={setSelectedCity} />
                <select
                  value={riskType}
                  onChange={(event) => setRiskType(event.target.value as typeof riskType)}
                  className="w-full rounded border bg-gray-100 p-2 dark:bg-gray-700 dark:text-gray-100"
                  aria-label="Climate risk layer"
                >
                  <option value="heat">Heat Risk</option>
                  <option value="flood">Flood Risk</option>
                  <option value="airquality">Air Quality</option>
                </select>
              </div>
              <div className="flex-1">
                {hasMapboxToken ? (
                  <ClimateRiskMap riskType={riskType} selectedCity={selectedCity} />
                ) : (
                  <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Map preview unavailable in this environment.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {!embed && (
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Footer />
          </div>
        )}
      </div>
    </>
  );
}
