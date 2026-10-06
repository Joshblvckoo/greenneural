import { Wind } from "lucide-react";
import DataSourceTag from "./DataSourceTag";
import SignalValue from "./SignalValue";
import type { LiveHomeResponse } from "./liveHomeTypes";

export default function LiveGenerationMix({
  generationMix,
}: {
  generationMix: LiveHomeResponse["generation_mix"] | null;
}) {
  const fuelMix = generationMix?.mix ?? {};

  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-white p-6 dark:border-white/10 dark:bg-[#0d1d18] sm:p-8">
      <div className="flex items-center gap-2">
        <Wind
          size={19}
          className="text-emerald-700 dark:text-emerald-300"
          aria-hidden="true"
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            Generation mix
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
            {generationMix?.region ?? "Grid"} generation
          </h2>
        </div>
      </div>
      {Object.keys(fuelMix).length ? (
        <div key={generationMix?.updated_at ?? "unavailable"} className="mt-5 grid grid-cols-2 gap-2 animate-[fade-neutral_600ms_ease-out] motion-reduce:animate-none sm:grid-cols-3">
          {Object.entries(fuelMix)
            .sort(([, left], [, right]) => right - left)
            .map(([fuel, percent]) => (
              <div
                key={fuel}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <p className="truncate text-xs capitalize text-slate-500 dark:text-white/45">
                  {fuel.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  <SignalValue
                    value={percent}
                    trend="steady"
                    updatedAt={generationMix?.updated_at ?? null}
                  />
                  %
                </p>
              </div>
            ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-500 dark:text-white/45">
          Generation mix is unavailable from the configured providers.
        </p>
      )}
      {generationMix && (
        <DataSourceTag
          source={generationMix.source}
          latencyMs={generationMix.latency_ms}
          status={generationMix.status}
          updatedAt={generationMix.updated_at}
        />
      )}
    </section>
  );
}
