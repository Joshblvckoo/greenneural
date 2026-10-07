export type SignalStatus =
  | "live"
  | "delayed"
  | "limited"
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

export type RegionLiveSignal = {
  provider: string;
  region: string;
  intensity: number | null;
  source: string | null;
  updated_at: string | null;
  status: SignalStatus | "unsupported";
  latency_ms: number | null;
  error?: string;
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
    regions_expected: number;
    partial: boolean;
    methodology: string;
  };
  region_signals: RegionLiveSignal[];
  cleanest_global: {
    provider: string;
    region: string;
    intensity: number;
    updated_at: string | null;
  } | null;
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
  source_health: Record<string, {
    status: SignalStatus;
    configured: boolean;
    missing_configuration: string[];
    regions_available: number;
    regions_checked: number;
    updated_at: string | null;
    latency_ms: number | null;
    errors: string[];
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
