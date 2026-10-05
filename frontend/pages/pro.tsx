import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Clock3, Leaf, TrendingDown } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { supabase } from "../lib/supabaseClient";

type ForecastItem = {
  provider: string;
  region: string;
  status: "available" | "unavailable";
  current?: number;
  cleaner_at?: string | null;
  cleaner_value?: number | null;
  message?: string;
};

type ForecastResponse = {
  forecast: ForecastItem[];
  generated_at: string;
};

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function ForecastGrid({ forecast }: { forecast: ForecastItem[] }) {
  if (!forecast.length) {
    return (
      <p className="rounded-xl border border-emerald-500/10 bg-[#0d1f18] p-6 text-emerald-50/60">
        No forecasts are configured yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {forecast.map((item) => (
        <article
          key={`${item.provider}-${item.region}`}
          className="rounded-2xl border border-emerald-500/15 bg-[#0d1f18] p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/65">
                {item.provider}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">{item.region}</h2>
            </div>
            <Leaf
              size={19}
              className="text-emerald-300"
              aria-hidden="true"
            />
          </div>

          {item.status === "available" && typeof item.current === "number" ? (
            <>
              <p className="mt-6 text-sm text-emerald-50/55">
                Current grid intensity
              </p>
              <p className="mt-1 text-3xl font-semibold text-white">
                {Math.round(item.current)}
                <span className="ml-2 text-sm font-normal text-emerald-50/55">
                  gCO₂/kWh
                </span>
              </p>
              {item.cleaner_at && typeof item.cleaner_value === "number" ? (
                <div className="mt-5 flex items-start gap-3 rounded-xl bg-emerald-400/10 p-3">
                  <TrendingDown
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-300"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-emerald-100">
                      Cleaner at{" "}
                      {new Date(item.cleaner_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-1 text-xs text-emerald-50/55">
                      Forecast: {Math.round(item.cleaner_value)} gCO₂/kWh
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-emerald-50/55">
                  <Clock3
                    size={17}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  No cleaner window in the available forecast horizon.
                </p>
              )}
            </>
          ) : (
            <p className="mt-6 text-sm leading-6 text-amber-200/75">
              {item.message ?? "Forecast data is currently unavailable."}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

export default function ProDashboard() {
  const router = useRouter();
  const [result, setResult] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadForecast = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
          await router.replace("/login");
          return;
        }

        const response = await fetch(`${apiUrl}/api/v1/home/pro/forecast`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (response.status === 401) {
          await supabase.auth.signOut();
          await router.replace("/login");
          return;
        }
        if (!response.ok) {
          throw new Error(`Forecast service returned HTTP ${response.status}`);
        }

        const data: ForecastResponse = await response.json();
        if (active) setResult(data);
      } catch {
        if (active) {
          setError("Unable to load the forecast. Please try again shortly.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadForecast();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-7">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/65">
            GreenNeural Pro
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Time-to-Clean Forecast
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/55">
            Find the next available forecast interval with lower grid emissions
            for selected cloud regions.
          </p>
          {result && (
            <p className="mt-3 text-xs text-emerald-50/40">
              Updated at{" "}
              {new Date(result.generated_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </header>

        {error && (
          <p
            className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-emerald-50/55" role="status">
            Loading regional forecasts…
          </p>
        ) : result ? (
          <ForecastGrid forecast={result.forecast} />
        ) : !error ? (
          <p className="text-sm text-emerald-50/55">No forecast available yet.</p>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
