import Link from "next/link";

export default function DemoSidebar() {
  return (
    <aside className="w-full border-b border-gray-200 bg-slate-900 text-white md:w-64 md:border-b-0 md:border-r md:h-[calc(100vh-3.25rem)]">
      <div className="p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Demo navigation
        </h2>

        <div className="space-y-2">
          <div className="rounded-md bg-slate-800 px-3 py-2 text-sm font-medium">
            🌍 Region Explorer (demo)
          </div>
        </div>

        <div className="mt-6 space-y-2 text-xs text-gray-400">
          <p>
            This demo only shows live cloud region carbon intensity.
          </p>
          <p>
            Sign up to unlock Carbon Intensity, Climate Risk, SCI, and full personalization.
          </p>
        </div>

        <Link
          href="/signup"
          className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Create free account
        </Link>
      </div>
    </aside>
  );
}