import Link from "next/link";
import { Zap, Map, Calculator, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Carbon Intensity",
    desc: "Real-time gCO₂/kWh data across AWS, Azure & GCP regions.",
  },
  {
    icon: Map,
    title: "Climate Risk Maps",
    desc: "Live heat, flood & air-quality risk scores for any city on Earth.",
  },
  {
    icon: Calculator,
    title: "SCI Score",
    desc: "Compute your Software Carbon Intensity score in seconds.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--gn-bg)' }}>
      <div className="relative min-h-screen">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #050D0A 0%, #0a2018 50%, #0D3525 100%)',
            animation: 'meshDrift 12s ease infinite',
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 animate-fade-up">
            Build Greener Software
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--gn-muted)' }}>
            Carbon intensity, climate risk maps, and SCI calculations — all in one platform.
          </p>
          <div className="mt-8">
            <Link href="/signup" className="gn-btn-primary">
              Get Started Free <ArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </div>
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="gn-card p-8 text-center transform hover:-translate-y-2 transition-transform duration-300">
              <feature.icon className="h-12 w-12 mx-auto" style={{ color: 'var(--gn-accent)' }} />
              <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
              <p className="mt-2" style={{ color: 'var(--gn-muted)' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}