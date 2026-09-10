import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
      <section className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold">
          GreenNeural — Carbon & Climate Risk Explorer
        </h1>
        <p className="text-lg text-slate-300">
          See your cloud’s carbon intensity, your city’s climate risk, and your workload’s SCI score — in one simple dashboard.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-md bg-emerald-500 text-slate-950 font-semibold"
          >
            Start Free
          </Link>
        </div>
      </section>
      <div className="mt-4 flex justify-center gap-4">
  <Link href="/dashboard" className="px-4 py-2 bg-emerald-500 rounded-md">
    Start Free
  </Link>
  <Link href="/signup" className="px-4 py-2 bg-slate-800 rounded-md">
    Sign Up
  </Link>
</div>
      
    </main>
  );
}
