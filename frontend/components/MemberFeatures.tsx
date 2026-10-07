import Link from "next/link";
import { ArrowRight, Bell, Cloud, Sparkles } from "lucide-react";

export default function MemberFeatures() {
  return (
    <section
      className="mx-auto mt-6 max-w-7xl rounded-3xl border border-emerald-900/10 bg-white p-6 dark:border-white/10 dark:bg-[#0d1d18] sm:p-8"
      aria-labelledby="member-features-title"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            <Sparkles size={14} aria-hidden="true" />
            Member workspace
          </p>
          <h2
            id="member-features-title"
            className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white"
          >
            Your GreenNeural features
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-emerald-50/60">
            Follow platform improvements and explore tools available to your
            account.
          </p>
        </div>
        <Link
          href="/updates"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-[#07120f] transition hover:bg-emerald-200"
        >
          Daily Upgrade Log <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700 dark:border-white/10 dark:text-emerald-50/75">
          <Sparkles size={17} className="text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
          Daily platform improvements
        </li>
        <li className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700 dark:border-white/10 dark:text-emerald-50/75">
          <Cloud size={17} className="text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
          Time-to-Clean Forecast{" "}
          <Link href="/pro" className="ml-auto text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
            Pro
          </Link>
        </li>
        <li className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700 dark:border-white/10 dark:text-emerald-50/75">
          <Bell size={17} className="text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
          Region alerts{" "}
          <span className="ml-auto text-xs text-slate-500 dark:text-white/40">
            Planned
          </span>
        </li>
        <li className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700 dark:border-white/10 dark:text-emerald-50/75 sm:col-span-2 lg:col-span-1">
          <Cloud size={17} className="text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
          Personalized optimization insights{" "}
          <span className="ml-auto text-xs text-slate-500 dark:text-white/40">
            Planned
          </span>
        </li>
      </ul>
    </section>
  );
}
