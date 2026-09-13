import Link from "next/link";
import { ArrowRight, BarChart3, Play, Sparkles } from "lucide-react";

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-emerald-400/10 bg-white text-slate-900 dark:bg-[#07120f] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_15%,rgba(45,212,191,0.16),transparent_28%),radial-gradient(circle_at_18%_70%,rgba(16,185,129,0.12),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-12">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
            <Sparkles size={14} /> Climate intelligence for builders
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-slate-900 dark:text-white sm:text-6xl lg:text-8xl">
            Make every workload <span className="text-emerald-300">greener.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 dark:text-emerald-50/65 sm:text-xl">
            GreenNeural turns live carbon intensity, climate risk, and software carbon metrics into decisions your team can act on.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="gn-btn-primary inline-flex items-center justify-center gap-2">
              Start for free <ArrowRight size={17} />
            </Link>
            <Link href="/demo" className="gn-btn-ghost inline-flex items-center justify-center gap-2">
              <Play size={16} /> Explore live demo
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500 dark:text-emerald-100/45">
            <span>Free individual plan</span><span>No credit card</span><span>Live cloud data</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-5 rounded-[2rem] bg-emerald-400/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-2xl shadow-emerald-950/10 backdrop-blur dark:border-white/10 dark:bg-[#0d1d18]/95 dark:shadow-emerald-950/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div><p className="text-xs uppercase tracking-[0.18em] text-emerald-700/70 dark:text-emerald-200/45">GreenNeural / overview</p><p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">Workload sustainability</p></div>
              <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">Live</span>
            </div>
            <div className="grid gap-3 py-4 sm:grid-cols-3">
              {[["42", "gCO₂/kWh", "text-emerald-300"], ["A−", "SCI score", "text-cyan-300"], ["18%", "lower impact", "text-lime-300"]].map(([value, label, color]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><p className={`text-2xl font-semibold ${color}`}>{value}</p><p className="mt-1 text-xs text-white/45">{label}</p></div>)}
                {[ ["42", "gCO₂/kWh", "text-emerald-700 dark:text-emerald-300"], ["A−", "SCI score", "text-cyan-700 dark:text-cyan-300"], ["18%", "lower impact", "text-lime-700 dark:text-lime-300"]].map(([value, label, color]) => <div key={label} className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]"><p className={`text-2xl font-semibold ${color}`}>{value}</p><p className="mt-1 text-xs text-slate-500 dark:text-white/45">{label}</p></div>)}
            </div>
            <div className="rounded-xl border border-white/10 bg-[#07120f] p-4">
              <div className="mb-4 flex items-center justify-between"><span className="text-sm text-slate-700 dark:text-white/70">Regional intensity</span><BarChart3 size={17} className="text-emerald-700 dark:text-emerald-300" /></div>
              <div className="flex h-32 items-end gap-2 sm:gap-3">{[38, 54, 43, 78, 61, 48, 31, 45, 26, 36, 22, 29].map((height, index) => <div key={index} className="flex-1 rounded-t bg-gradient-to-t from-emerald-500 to-teal-200/80" style={{ height: `${height}%`, opacity: 0.55 + index / 30 }} />)}</div>
              <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-white/25"><span>Now</span><span>Next 12 hours</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
