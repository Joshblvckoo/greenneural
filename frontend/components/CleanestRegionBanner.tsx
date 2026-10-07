import { useEffect, useState } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

type CleanestRegion = {
  provider: string;
  region: string;
  intensity: number;
  updated_at: string | null;
};

type CleanestResponse = {
  cleanest: CleanestRegion | null;
};

function formatUpdatedAt(updatedAt: string | null) {
  if (!updatedAt) return "updated time unavailable";
  const timestamp = new Date(updatedAt);
  if (!Number.isFinite(timestamp.getTime())) return "updated time unavailable";
  return `updated ${timestamp.toLocaleTimeString()}`;
}

export default function CleanestRegionBanner() {
  const [cleanest, setCleanest] = useState<CleanestRegion | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    const refresh = async () => {
      controller = new AbortController();
      try {
        const response = await fetch(`${API_URL}/api/v1/signals/cleanest`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Cleanest signal request failed: HTTP ${response.status}`);
        }
        const result: CleanestResponse = await response.json();
        if (active) {
          setCleanest(result.cleanest);
          setError(false);
        }
      } catch (requestError) {
        if (
          active &&
          !(requestError instanceof Error && requestError.name === "AbortError")
        ) {
          setError(true);
        }
      } finally {
        if (active) timer = setTimeout(refresh, REFRESH_INTERVAL_MS);
      }
    };

    void refresh();
    return () => {
      active = false;
      controller?.abort();
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);

  if (!cleanest && !error) return null;

  return (
    <aside
      className="relative z-10 mb-6 ml-auto w-fit max-w-[calc(100%-3rem)] rounded-2xl border border-emerald-200/15 bg-emerald-950/90 px-4 py-3 text-emerald-50 shadow-lg backdrop-blur-md sm:absolute sm:right-10 sm:top-6 sm:mb-0 sm:ml-0"
      aria-live="polite"
      aria-label="Global cleanest region"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/80">
        Cleanest region right now
      </p>
      {cleanest ? (
        <>
          <p className="mt-1 text-sm font-semibold">
            {cleanest.region}{" "}
            <span className="font-medium text-emerald-100/65">
              ({cleanest.provider.toUpperCase()})
            </span>
          </p>
          <p className="mt-1 text-xs text-emerald-100/75">
            {Math.round(cleanest.intensity)} gCO₂/kWh ·{" "}
            {formatUpdatedAt(cleanest.updated_at)}
          </p>
        </>
      ) : (
        <p className="mt-1 text-xs text-emerald-100/75">
          {error
            ? "The signal could not be refreshed."
            : "No recent regional readings are available."}
        </p>
      )}
      {error && cleanest && (
        <p className="mt-1 text-[11px] text-amber-200">
          Refresh failed; showing the last received reading.
        </p>
      )}
    </aside>
  );
}
