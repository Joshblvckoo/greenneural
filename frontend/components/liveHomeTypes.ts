export type SignalStatus =
  | "live"
  | "delayed"
  | "stale"
  | "forecast"
  | "fallback"
  | "unavailable";
export type SignalTrend = "up" | "down" | "steady" | "unknown";

export type LiveSignal = {
  provider: string;
  region: string;
  intensity: number;
  source: string;
  updated_at: string | null;
  status: SignalStatus;
  latency_ms?: number | null;
  delta_10m?: number | null;
  trend?: SignalTrend;
};

export type LiveHomeResponse = {
  global_signal: {
    intensity: number | null;
    delta_10m: number | null;
    trend: SignalTrend;
    sources: string[];
    updated_at: string | null;
    status: SignalStatus;
    latency_ms: number | null;
    regions_included: number;
    methodology: string;
  };
  cleanest_regions: LiveSignal[];
  provider_health: Record<string, {
    average_intensity: number | null;
    trend: SignalTrend;
    delta_10m: number | null;
    cleanest_region: LiveSignal | null;
    updated_at: string | null;
    status: SignalStatus;
    sources: string[];
    latency_ms: number | null;
    regions_available: number;
    regions_checked: number;
  }>;
  generation_mix: {
    region: string | null;
    mix: Record<string, number>;
    source: string | null;
    updated_at: string | null;
    status: SignalStatus;
    latency_ms: number | null;
  };
  generated_at: string;
};
