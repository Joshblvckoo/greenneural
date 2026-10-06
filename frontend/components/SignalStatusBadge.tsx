import type { SignalStatus } from "./liveHomeTypes";

const statusStyles: Record<SignalStatus, string> = {
  live: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  delayed: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  stale: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  forecast: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  fallback: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  unavailable: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export default function SignalStatusBadge({ status }: { status: SignalStatus }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[status]}`}>
      <span
        className={`h-2 w-2 rounded-full ${
          status === "live"
            ? "animate-pulse bg-emerald-500 motion-reduce:animate-none"
            : status === "unavailable" || status === "stale"
              ? "bg-rose-500"
              : status === "delayed"
                ? "bg-amber-500"
                : status === "forecast"
                  ? "bg-sky-500"
                  : "bg-slate-500"
        }`}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}
