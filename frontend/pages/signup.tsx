import Head from "next/head";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SignupForm from "../components/SignupForm";
import ThemeToggle from "../components/ThemeToggle";
import BrandLogo from "../components/BrandLogo";

export default function SignupPage() {
  return <>
    <Head><title>Create your account | GreenNeural</title></Head>
    <main className="min-h-screen bg-white px-6 py-8 text-slate-900 dark:bg-[#07120f] dark:text-white lg:px-10"><header className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/" className="flex w-fit items-center"><BrandLogo className="h-8 w-auto" /></Link><ThemeToggle /></header><div className="mx-auto grid max-w-6xl gap-14 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-20"><div className="max-w-lg"><Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-emerald-200/50 dark:hover:text-emerald-200"><ArrowLeft size={15} /> Back to home</Link><p className="mt-12 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Start with a signal</p><h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl">Build a greener operating picture.</h1><p className="mt-6 max-w-md leading-7 text-slate-600 dark:text-emerald-50/55">Create a free account to save your regions, personalize risk views, and turn sustainability data into momentum.</p><div className="mt-9 grid max-w-sm gap-3 text-sm text-slate-600 dark:text-emerald-100/65"><span>✓ Free forever for individual builders</span><span>✓ Live carbon and climate data</span><span>✓ No credit card required</span></div></div><div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-white/[0.05] sm:p-8"><div className="mb-8"><h2 className="text-2xl font-semibold">Create your account</h2><p className="mt-2 text-sm text-slate-500 dark:text-emerald-100/50">Set up your workspace in under a minute.</p></div><SignupForm /></div></div></main>
  </>;
}
