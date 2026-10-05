import type { FC } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Globe2,
  MapPinned,
  Radio,
  Sparkles,
} from "lucide-react";
import CleanestRegionLeaderboard from "./CleanestRegionLeaderboard";
import CoverageMap from "./CoverageMap";
import GlobalCarbonSnapshot from "./GlobalCarbonSnapshot";
import ProviderHealthWidget from "./ProviderHealthWidget";

const comingSoon = [
  "Asia real-time grid coverage",
  "Africa regional carbon signals",
  "Global cleanest-region leaderboard",
  "Carbon-aware routing for Kubernetes",
  "Historical carbon trends (24h, 7d, 30d)",
  "City-level emissions intelligence",
];

const HomePage: FC = () => (
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

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { value: "42", label: "regions", icon: MapPinned },
            { value: "29", label: "countries", icon: Globe2 },
            { value: "120+", label: "cities", icon: Activity },
          ].map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-6"
            >
              <Icon
                size={20}
                className="text-emerald-700 dark:text-emerald-300"
                aria-hidden="true"
              />
              <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {value}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-white/50">
                {label}
              </p>
            </div>
          ))}
          <p className="col-span-3 text-right text-xs text-slate-500 dark:text-white/40">
            Coverage expanding weekly
          </p>
        </div>
      </div>
    </section>

    <div className="bg-[#f7faf8] px-6 py-16 dark:bg-[#08130f] sm:py-20 lg:px-10">
      <div className="mx-auto mb-5 max-w-7xl">
        <ProviderHealthWidget />
      </div>
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
        <GlobalCarbonSnapshot />
        <CleanestRegionLeaderboard />
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

    <section className="bg-[#f1f6f3] px-6 py-16 dark:bg-[#0a1712] sm:py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
          <BarChart3
            size={20}
            className="text-emerald-700 dark:text-emerald-300"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              Coming soon
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Coverage is growing
            </h2>
          </div>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {comingSoon.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-emerald-50/70"
            >
              <Radio
                size={17}
                className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  </>
);

export default HomePage;
