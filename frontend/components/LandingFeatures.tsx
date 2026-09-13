import { Activity, Cloud, Gauge, MapPinned, ShieldCheck, Zap } from "lucide-react";

const features = [
  { icon: Activity, eyebrow: "Observe", title: "Carbon intensity in context", description: "Compare live emissions across AWS, Azure, and GCP regions before you place a workload." },
  { icon: MapPinned, eyebrow: "Anticipate", title: "Climate risk, made legible", description: "See heat, flood, and air-quality signals for the cities and regions your systems depend on." },
  { icon: Gauge, eyebrow: "Improve", title: "A practical SCI score", description: "Measure software carbon intensity with a clear score and concrete ways to reduce it." },
];

export default function LandingFeatures() {
  return (
    <section className="bg-[#f1f6f3] px-6 py-20 text-[#10231c] sm:py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">One clear signal</p><h2 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">Sustainability intelligence that fits the way teams ship.</h2></div>
          <p className="max-w-xl text-lg leading-8 text-slate-600">Move from vague sustainability goals to a shared operating picture for your infrastructure, product, and engineering decisions.</p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, eyebrow, title, description }) => <article key={title} className="group border-t-2 border-emerald-700/20 bg-white p-6 transition hover:-translate-y-1 hover:border-emerald-600 sm:p-8"><div className="flex items-center justify-between"><Icon size={24} className="text-emerald-700" /><span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{eyebrow}</span></div><h3 className="mt-12 text-2xl font-semibold tracking-tight">{title}</h3><p className="mt-3 leading-7 text-slate-600">{description}</p></article>)}
        </div>
        <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-slate-200 pt-6 text-sm text-slate-500"><span className="inline-flex items-center gap-2"><Cloud size={16} className="text-emerald-700" /> AWS · Azure · GCP</span><span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-700" /> Built for responsible teams</span><span className="inline-flex items-center gap-2"><Zap size={16} className="text-emerald-700" /> Ready in minutes</span></div>
      </div>
    </section>
  );
}
