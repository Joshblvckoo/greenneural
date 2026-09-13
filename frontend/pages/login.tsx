import Head from "next/head";
import Link from "next/link";
import LoginForm from "../components/LoginForm";
import ThemeToggle from "../components/ThemeToggle";
import BrandLogo from "../components/BrandLogo";

export default function LoginPage() {
  return <>
    <Head><title>Sign in | GreenNeural</title></Head>
    <main className="min-h-screen bg-white px-6 py-8 text-slate-900 dark:bg-[#07120f] dark:text-white lg:px-10"><header className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/" className="flex w-fit items-center"><BrandLogo className="h-8 w-auto" /></Link><ThemeToggle /></header><div className="mx-auto grid max-w-6xl gap-14 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-24"><div className="hidden lg:block"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Welcome back</p><h1 className="mt-5 max-w-lg text-6xl font-semibold leading-[1.02] tracking-[-0.04em]">Your climate intelligence hub is ready.</h1><p className="mt-6 max-w-md leading-7 text-slate-600 dark:text-emerald-50/55">Return to the workspace where carbon, risk, and engineering signals meet.</p></div><div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-white/[0.05] sm:p-8"><div className="mb-8"><h2 className="text-2xl font-semibold">Sign in to GreenNeural</h2><p className="mt-2 text-sm text-slate-500 dark:text-emerald-100/50">Continue to your sustainability workspace.</p></div><LoginForm /></div></div></main>
  </>;
}
