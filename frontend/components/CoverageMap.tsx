import type { FC } from "react";
import { Activity, Cloud, Database, MapPinned, Radio } from "lucide-react";

const coverage = [
  {
    title: "Real-time grids",
    detail: "UK and US",
    icon: Radio,
  },
  {
    title: "Live generation mix",
    detail: "EU",
    icon: Activity,
  },
  {
    title: "Emerging regions",
    detail: "Asia, Africa, and Middle East",
    icon: MapPinned,
  },
  {
    title: "Fallback coverage",
    detail: "Global static dataset",
    icon: Database,
  },
];

const CoverageMap: FC = () => (
  <section
    id="coverage"
    className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-white dark:border-white/10 dark:bg-[#0d1d18]"
  >
    <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
      <div className="p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          Global coverage
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Signals for a multi-cloud world
        </h2>
        <p className="mt-4 leading-7 text-slate-600 dark:text-emerald-50/60">
          Coverage spans AWS, Azure, and GCP, combining live grid data where
          available with clearly identified fallback signals.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {["AWS", "Azure", "GCP"].map((provider) => (
            <span
              key={provider}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-800/15 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-900 dark:border-emerald-200/15 dark:bg-emerald-300/10 dark:text-emerald-100"
            >
              <Cloud size={14} aria-hidden="true" />
              {provider}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-px bg-emerald-900/10 dark:bg-white/10 sm:grid-cols-2">
        {coverage.map(({ title, detail, icon: Icon }) => (
          <div
            key={title}
            className="bg-white p-6 dark:bg-[#0d1d18] sm:p-8"
          >
            <Icon
              size={20}
              className="text-emerald-700 dark:text-emerald-300"
              aria-hidden="true"
            />
            <h3 className="mt-5 font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-white/50">
              {detail}
            </p>
          </div>
        ))}
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/45 sm:px-8">
      <span>Coverage is expanding over time</span>
      <span className="inline-flex items-center gap-2">
        <MapPinned size={15} aria-hidden="true" />
        Interactive coverage map coming soon
      </span>
    </div>
  </section>
);

export default CoverageMap;
