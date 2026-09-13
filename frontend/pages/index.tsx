import Head from "next/head";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import BrandLogo from "../components/BrandLogo";
import LandingFeatures from "../components/LandingFeatures";
import LandingHero from "../components/LandingHero";

export default function Home() {
  return <>
    <Head><title>GreenNeural | Climate intelligence for modern teams</title><meta name="description" content="Make better infrastructure decisions with live carbon intensity, climate risk, and software carbon intelligence." /></Head>
    <main className="min-h-screen bg-white text-slate-900 dark:bg-[#07120f] dark:text-white">
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10"><Link href="/" className="flex items-center"><BrandLogo className="h-8 w-auto" /></Link><nav className="hidden items-center gap-7 text-sm text-slate-600 dark:text-emerald-50/60 md:flex"><Link href="#platform" className="hover:text-emerald-700 dark:hover:text-white">Platform</Link><Link href="#why" className="hover:text-emerald-700 dark:hover:text-white">Why GreenNeural</Link><Link href="/demo" className="hover:text-emerald-700 dark:hover:text-white">Demo</Link></nav><div className="flex items-center gap-3"><ThemeToggle /><Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-emerald-50/70 dark:hover:text-white sm:block">Sign in</Link><Link href="/signup" className="rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#07120f] transition hover:bg-emerald-200">Get started</Link></div></header>
      <LandingHero />
      <div id="platform"><LandingFeatures /></div>
      <section id="why" className="bg-slate-100 px-6 py-16 text-center dark:bg-[#07120f] lg:px-10"><p className="text-sm text-slate-500 dark:text-emerald-100/45">A clearer signal for the next generation of software.</p><Link href="/signup" className="mt-4 inline-flex items-center gap-2 text-lg font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200">Build your first baseline <ArrowUpRight size={18} /></Link></section>
    </main>
  </>;
}
