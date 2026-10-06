import { useEffect, useState } from "react";
import SignalStatusBadge from "./SignalStatusBadge";
import type { SignalStatus } from "./liveHomeTypes";

type Props = {
  source: string | string[] | null | undefined;
  latencyMs: number | null | undefined;
  status: SignalStatus;
  updatedAt: string | null | undefined;
  className?: string;
};

function relativeAge(updatedAt: string | null | undefined, now: number) {
  if (!updatedAt) return "updated time unavailable";
  const timestamp = new Date(updatedAt).getTime();
  if (!Number.isFinite(timestamp)) return "updated time unavailable";
  const differenceSeconds = Math.floor((now - timestamp) / 1000);
  if (differenceSeconds < 0) {
    const secondsUntil = Math.abs(differenceSeconds);
    if (secondsUntil < 60) return `forecast in ${secondsUntil} seconds`;
    return `forecast in ${Math.floor(secondsUntil / 60)} minutes`;
  }
  const seconds = differenceSeconds;
  if (seconds < 60) return `updated ${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `updated ${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  return `updated ${hours} hours ago`;
}

export default function DataSourceTag({
  source,
  latencyMs,
  status,
  updatedAt,
  className = "",
}: Props) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sources = Array.isArray(source) ? source : source ? [source] : [];

  return (
    <div className={`mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-white/45 ${className}`}>
      <span>
        Source: {sources.length ? sources.join(", ") : "unavailable"}
      </span>
      <span aria-hidden="true">·</span>
      <span>
        Latency: {latencyMs == null ? "—" : `${Math.round(latencyMs)} ms`}
      </span>
      <span aria-hidden="true">·</span>
      <span aria-live="off">{now === null ? "updated time syncing" : relativeAge(updatedAt, now)}</span>
      <SignalStatusBadge status={status} />
    </div>
  );
}
