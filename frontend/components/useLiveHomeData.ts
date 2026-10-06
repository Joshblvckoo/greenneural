import { useEffect, useState } from "react";
import type { LiveHomeResponse } from "./liveHomeTypes";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const REFRESH_INTERVAL_MS = 30_000;

export function useLiveHomeData() {
  const [data, setData] = useState<LiveHomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    const refresh = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/home/live`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Live homepage API returned HTTP ${response.status}`);
        }
        const result: LiveHomeResponse = await response.json();
        if (active) {
          setData(result);
          setError(null);
        }
      } catch (requestError) {
        if (active && !(requestError instanceof Error && requestError.name === "AbortError")) {
          setError("Live signals could not be refreshed. Showing the last received readings, if available.");
        }
      } finally {
        if (active) {
          setLoading(false);
          timer = setTimeout(refresh, REFRESH_INTERVAL_MS);
        }
      }
    };

    void refresh();
    return () => {
      active = false;
      controller.abort();
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);

  return { data, loading, error };
}
