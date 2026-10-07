import type { FC } from "react";
import Link from "next/link";
import { ArrowRight, MapPinned, Sparkles } from "lucide-react";
import CleanestRegionLeaderboard from "./CleanestRegionLeaderboard";
import CoverageMap from "./CoverageMap";
import GlobalCarbonSnapshot from "./GlobalCarbonSnapshot";
import LiveGenerationMix from "./LiveGenerationMix";
import LiveSourceHealth from "./LiveSourceHealth";
import MemberFeatures from "./MemberFeatures";
import ProviderHealthWidget from "./ProviderHealthWidget";
import SignalStatusBadge from "./SignalStatusBadge";
import SignalValue from "./SignalValue";
import { useLiveHomeData } from "./useLiveHomeData";

const HomePage: FC = () => {
  const { data, loading, error } = useLiveHomeData();
  const signal = data?.global_signal;

  return (
    <>
    <section className="relative isolate overflow-hidden border-b border-emerald-900/10 bg-gradient-to-br from-[#f4fbf6] via-white to-emerald-50 px-6 py-20 dark:border-emerald-300/10 dark:from-[#07120f] dark:via-[#0b1914] dark:to-[#10281d] sm:py-28 lg:px-10">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-400/10" />
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:border-emerald-200/15 dark:bg-white/5 dark:text-emerald-200">
            <Sparkles size={14} aria-hidden="true" />
            Sustainable tech intelligence
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-6xl">
            GreenNeural — Sustainable Tech Intelligence for the Modern Cloud
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-emerald-50/65 sm:text-xl">
            Carbon-aware insights across AWS, Azure, and GCP.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="gn-btn-primary inline-flex items-center gap-2"
            >
              Explore the demo <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              href="#coverage"
              className="gn-btn-ghost inline-flex items-center gap-2"
            >
              Explore coverage <MapPinned size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-900/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              Live global grid signal
            </p>
            {signal && <SignalStatusBadge status={signal.status} />}
          </div>
          <p className="mt-8 min-h-12 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {signal?.intensity == null ? (loading ? "Connecting…" : "Live data unavailable") : (
              <>
                <SignalValue
                  value={signal.intensity}
                  trend={signal.trend}
                  updatedAt={signal.updated_at}
                />
                <span className="ml-2 text-sm font-normal text-slate-500 dark:text-white/50">
                  gCO₂/kWh
                </span>
              </>
            )}
          </p>
          <p className="mt-3 text-sm text-slate-600 dark:text-emerald-50/60">
            {signal?.partial
              ? `Partial signal · ${signal.regions_included} of ${signal.regions_expected} mapped grid sources reporting.`
              : signal?.intensity == null
                ? "No live or recent mapped grid readings are available. No static values are substituted."
                : `Based on ${signal.regions_included} unique grid readings.`}
          </p>
        </div>
      </div>
    </section>

    <div className="bg-[#f7faf8] px-6 pt-6 dark:bg-[#08130f] lg:px-10">
      <MemberFeatures />
    </div>

    <div className="bg-[#f7faf8] px-6 py-16 dark:bg-[#08130f] sm:py-20 lg:px-10">
      {error && (
        <p className="mx-auto mb-5 max-w-7xl rounded-xl border border-amber-500/20 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200" role="status">
          {error}
        </p>
      )}
      <LiveSourceHealth sources={data?.source_health ?? null} />
      <div className="mx-auto mb-5 max-w-7xl">
        <ProviderHealthWidget providers={data?.provider_health ?? null} loading={loading} />
      </div>
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
        <GlobalCarbonSnapshot
          signal={data?.global_signal ?? null}
          loading={loading}
        />
        <CleanestRegionLeaderboard
          entries={data?.cleanest_regions ?? null}
          cleanestGlobal={data?.cleanest_global ?? null}
          loading={loading}
        />
      </div>
      <div className="mx-auto mt-5 grid max-w-7xl gap-5 lg:grid-cols-2">
        <LiveGenerationMix generationMix={data?.generation_mix ?? null} />
      </div>
      <div className="mx-auto mt-5 max-w-7xl">
        <CoverageMap />
      </div>
    </div>

    <section
      id="why"
      className="border-y border-slate-200 bg-white px-6 py-16 dark:border-white/10 dark:bg-[#07120f] sm:py-20 lg:px-10"
    >
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.7fr_1.3fr] md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            Why it matters
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            A clearer signal for a fragmented landscape.
          </h2>
        </div>
        <p className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-emerald-50/65">
          Carbon data can be fragmented, expensive, and locked behind
          enterprise APIs. GreenNeural brings cloud and climate signals
          together in a free, developer-friendly, cloud-native experience.
        </p>
      </div>
    </section>

    </>
  );
};

export default HomePage;
