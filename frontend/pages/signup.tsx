import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import {
  Leaf, User, Mail, Lock, Globe, Cloud, MapPin, Heart,
  AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Check,
} from "lucide-react";

/* ── Data ──────────────────────────────────────────────────── */
const COUNTRIES = [
  { value: "au", label: "Australia" },
  { value: "be", label: "Belgium" },
  { value: "br", label: "Brazil" },
  { value: "ca", label: "Canada" },
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "in", label: "India" },
  { value: "ie", label: "Ireland" },
  { value: "it", label: "Italy" },
  { value: "jp", label: "Japan" },
  { value: "kr", label: "South Korea" },
  { value: "es", label: "Spain" },
  { value: "se", label: "Sweden" },
  { value: "ch", label: "Switzerland" },
  { value: "ae", label: "United Arab Emirates" },
  { value: "gb", label: "United Kingdom" },
  { value: "us", label: "United States" },
];

const REGIONS_BY_COUNTRY: Record<string, Record<string, string[]>> = {
  au: { aws: ["ap-southeast-2"], azure: ["australiaeast", "australiasoutheast"], gcp: ["australia-southeast1", "australia-southeast2"] },
  be: { aws: [], azure: ["westeurope"], gcp: ["europe-west1"] },
  br: { aws: ["sa-east-1"], azure: [], gcp: ["southamerica-east1", "southamerica-west1"] },
  ca: { aws: ["ca-central-1", "ca-west-1"], azure: ["canadacentral", "canadaeast"], gcp: ["northamerica-northeast1", "northamerica-northeast2"] },
  fr: { aws: ["eu-west-3"], azure: ["francecentral", "francesouth"], gcp: ["europe-west9"] },
  de: { aws: ["eu-central-1"], azure: ["germanynorth", "germanywestcentral"], gcp: ["europe-west3"] },
  in: { aws: ["ap-south-1", "ap-south-2"], azure: ["indiacentral", "indiasouth", "indiawest"], gcp: ["asia-south1", "asia-south2"] },
  ie: { aws: ["eu-west-1"], azure: ["northeurope"], gcp: [] },
  it: { aws: ["eu-south-1"], azure: ["italynorth"], gcp: [] },
  jp: { aws: ["ap-northeast-1"], azure: ["japaneast", "japanwest"], gcp: ["asia-northeast1", "asia-northeast2"] },
  kr: { aws: ["ap-northeast-2"], azure: ["koreacentral", "koreasouth"], gcp: ["asia-northeast3"] },
  es: { aws: ["eu-south-2"], azure: ["spaincentral"], gcp: [] },
  se: { aws: ["eu-north-1"], azure: ["swedencentral", "swedensouth"], gcp: ["europe-north1"] },
  ch: { aws: ["eu-central-2"], azure: ["switzerlandnorth", "switzerlandwest"], gcp: ["europe-west6"] },
  ae: { aws: ["me-central-1"], azure: ["uaenorth", "uaecentral"], gcp: ["me-central1"] },
  gb: { aws: ["eu-west-2"], azure: ["uksouth", "ukwest"], gcp: ["europe-west2"] },
  us: { aws: ["us-east-1", "us-east-2", "us-west-1", "us-west-2"], azure: ["eastus", "eastus2", "westus", "westus2", "westus3", "centralus"], gcp: ["us-central1", "us-east1", "us-east4", "us-west1", "us-west2", "us-west3", "us-west4"] },
};

const STEPS = ["Account", "Location & Cloud", "Preferences"];

/* ── Component ─────────────────────────────────────────────── */
export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    country: "",
    cloud: "",
    region: "",
    city: "",
    interest: "",
  });

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const availableRegions = REGIONS_BY_COUNTRY[form.country]?.[form.cloud] ?? [];

  const canNext = () => {
    if (step === 0) return form.name.trim() && form.email.trim() && form.password.length >= 6;
    if (step === 1) return form.country && form.cloud;
    return true;
  };

  const handleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: "https://greenneural.vercel.app/login" },
      });

      if (authError) { setError(authError.message); setLoading(false); return; }
      const user = authData.user;
      if (!user) { setError("Signup failed: no user returned."); setLoading(false); return; }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        name: form.name,
        email: form.email,
        country: form.country,
        cloud_provider: form.cloud,
        region: form.region,
        city: form.city,
        interest: form.interest,
        plan: "free",
      });

      if (profileError) { setError(profileError.message); setLoading(false); return; }

      setSuccess("Account created! Check your email to verify, then sign in.");
      setTimeout(() => router.push("/auth"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── Left Hero ───────────────────────────────────── */}
      <div className="gn-mesh-bg flex flex-col justify-between p-8 md:p-12 md:w-[42%]">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Leaf size={20} className="text-emerald-400" />
          <span className="font-bold text-base gn-gradient-text">GreenNeural</span>
        </Link>

        <div className="py-12 md:py-0">
          <h1 className="text-3xl md:text-4xl font-bold leading-snug mb-4">
            Start building<br />
            <span className="gn-gradient-text">greener software</span>
          </h1>
          <p className="text-emerald-100/60 text-sm leading-relaxed mb-8 max-w-xs">
            Free forever for individual developers. Get real-time carbon data,
            climate risk scores, and SCI calculations in minutes.
          </p>

          {/* Floating stat cards */}
          <div className="space-y-3">
            {[
              { label: "Free plan", detail: "No credit card needed" },
              { label: "17 countries", detail: "Covered out of the box" },
              { label: "60+ regions", detail: "AWS · Azure · GCP" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}
              >
                <Check size={15} className="text-emerald-400 shrink-0" />
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-xs ml-auto" style={{ color: "rgba(110,231,183,0.5)" }}>{s.detail}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-emerald-200/30">© {new Date().getFullYear()} GreenNeural</p>
      </div>

      {/* ── Right Form ──────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-8 md:p-12" style={{ background: "#080F0D" }}>
        <div className="w-full max-w-md">

          {/* Step progress */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300"
                  style={{
                    background: i < step ? "var(--gn-accent)" : i === step ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.07)",
                    border: i === step ? "1px solid var(--gn-accent)" : "1px solid rgba(16,185,129,0.2)",
                    color: i <= step ? "var(--gn-accent-2)" : "rgba(110,231,183,0.35)",
                  }}
                >
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: i === step ? "var(--gn-accent-2)" : "rgba(110,231,183,0.35)" }}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-px mx-1 hidden sm:block transition-all duration-500"
                    style={{ background: i < step ? "var(--gn-accent)" : "rgba(16,185,129,0.15)" }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Heading */}
          <div className="mb-6 animate-fade-up">
            <h2 className="text-xl font-bold">{STEPS[step]}</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(110,231,183,0.5)" }}>
              {step === 0 && "Create your credentials"}
              {step === 1 && "Tell us where you work"}
              {step === 2 && "Personalise your experience"}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="gn-error mb-4 animate-fade-in">
              <AlertCircle size={15} />{error}
            </div>
          )}
          {success && (
            <div className="gn-success mb-4 animate-fade-in">
              <CheckCircle size={15} />{success}
            </div>
          )}

          {/* ── Step 0: Account ── */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-up">
              <div>
                <label className="gn-label" htmlFor="su-name">Full name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 pointer-events-none" />
                  <input id="su-name" name="name" placeholder="Alex Johnson" className="gn-input pl-10" onChange={update} value={form.name} required />
                </div>
              </div>
              <div>
                <label className="gn-label" htmlFor="su-email">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 pointer-events-none" />
                  <input id="su-email" name="email" type="email" placeholder="you@example.com" className="gn-input pl-10" onChange={update} value={form.email} required />
                </div>
              </div>
              <div>
                <label className="gn-label" htmlFor="su-password">Password <span style={{ color: "rgba(110,231,183,0.4)" }}>(min 6 chars)</span></label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 pointer-events-none" />
                  <input id="su-password" name="password" type="password" placeholder="••••••••" className="gn-input pl-10" onChange={update} value={form.password} required />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Location & Cloud ── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-up">
              <div>
                <label className="gn-label" htmlFor="su-country">Country</label>
                <div className="relative">
                  <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 pointer-events-none" />
                  <select
                    id="su-country" name="country"
                    className="gn-input gn-select pl-10"
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value, region: "" }))}
                  >
                    <option value="">Select country…</option>
                    {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="gn-label" htmlFor="su-cloud">Cloud provider</label>
                <div className="relative">
                  <Cloud size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 pointer-events-none" />
                  <select
                    id="su-cloud" name="cloud"
                    className="gn-input gn-select pl-10"
                    value={form.cloud}
                    onChange={(e) => setForm((f) => ({ ...f, cloud: e.target.value, region: "" }))}
                  >
                    <option value="">Select provider…</option>
                    <option value="aws">AWS</option>
                    <option value="azure">Azure</option>
                    <option value="gcp">GCP</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="gn-label" htmlFor="su-region">Cloud region</label>
                <select
                  id="su-region" name="region"
                  className="gn-input gn-select"
                  value={form.region}
                  onChange={update}
                  disabled={!form.country || !form.cloud || availableRegions.length === 0}
                >
                  <option value="">
                    {!form.country || !form.cloud
                      ? "Select country & provider first"
                      : availableRegions.length === 0
                      ? "No regions for this selection"
                      : "Select region…"}
                  </option>
                  {availableRegions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="gn-label" htmlFor="su-city">City <span style={{ color: "rgba(110,231,183,0.4)" }}>(optional)</span></label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 pointer-events-none" />
                  <input id="su-city" name="city" type="text" placeholder="London" className="gn-input pl-10" onChange={update} value={form.city} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Preferences ── */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-up">
              <div>
                <label className="gn-label" htmlFor="su-interest">Primary sustainability interest</label>
                <div className="relative">
                  <Heart size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 pointer-events-none" />
                  <select id="su-interest" name="interest" className="gn-input gn-select pl-10" onChange={update} value={form.interest}>
                    <option value="">Choose an area…</option>
                    <option value="heat">Heat Risk</option>
                    <option value="flood">Flood Risk</option>
                    <option value="air">Air Quality</option>
                    <option value="carbon">Carbon Optimisation</option>
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Account summary</p>
                {[
                  { label: "Name", value: form.name },
                  { label: "Email", value: form.email },
                  { label: "Country", value: COUNTRIES.find((c) => c.value === form.country)?.label ?? "—" },
                  { label: "Cloud", value: form.cloud.toUpperCase() || "—" },
                  { label: "Region", value: form.region || "—" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span style={{ color: "rgba(110,231,183,0.5)" }}>{row.label}</span>
                    <span className="font-medium truncate ml-4 max-w-[55%] text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="gn-btn-ghost flex-1"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={!canNext()}
                onClick={() => setStep((s) => s + 1)}
                className="gn-btn-primary flex-1"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading || !!success}
                onClick={handleSignup}
                className="gn-btn-primary flex-1"
              >
                {loading ? "Creating account…" : "Create Account"}
                {!loading && <ArrowRight size={16} />}
              </button>
            )}
          </div>

          <p className="mt-6 text-center text-sm" style={{ color: "rgba(110,231,183,0.45)" }}>
            Already have an account?{" "}
            <Link href="/auth" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
