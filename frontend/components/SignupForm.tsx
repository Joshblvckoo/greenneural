import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertCircle, ArrowRight, Check, ChevronDown, Globe, Lock, Mail, MapPin, User } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import {
  CITIES_BY_COUNTRY,
  CLOUD_PROVIDERS,
  COUNTRIES,
  REGIONS_BY_COUNTRY,
  type SignupCountry,
  type SignupProvider,
} from "../config/signupOptions";

type SignupFormState = {
  name: string;
  email: string;
  password: string;
  country: SignupCountry | "";
  city: string;
  provider: SignupProvider | "";
  region: string;
  interest: string;
};

const initialForm: SignupFormState = {
  name: "",
  email: "",
  password: "",
  country: "",
  city: "",
  provider: "",
  region: "",
  interest: "",
};

export default function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState<SignupFormState>(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const cities = form.country ? [...CITIES_BY_COUNTRY[form.country]] : [];
  const regions = useMemo(
    () => form.country && form.provider ? [...(REGIONS_BY_COUNTRY[form.country]?.[form.provider] ?? [])] : [],
    [form.country, form.provider],
  );

  const update = <Key extends keyof SignupFormState>(key: Key, value: SignupFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleCountryChange = (country: SignupCountry | "") => {
    update("country", country);
    setForm((current) => ({ ...current, country, city: "", region: "" }));
  };

  const handleProviderChange = (provider: SignupProvider | "") => {
    setForm((current) => ({ ...current, provider, region: "" }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const user = authData.user;
    if (!user) {
      setError("Signup failed: no user returned.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      name: form.name,
      email: form.email,
      country: form.country,
      cloud_provider: form.provider,
      region: form.region,
      city: form.city,
      interest: form.interest || "carbon",
      plan: "free",
    });
    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setSuccess("Account created. Check your email to verify your address.");
    setTimeout(() => router.push("/login"), 2500);
    setLoading(false);
  }

  const selectClass = "gn-input gn-select";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="gn-error"><AlertCircle size={15} />{error}</div>}
      {success && <div className="gn-success"><Check size={15} />{success}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="signup-name" icon={<User size={16} />}>
          <input id="signup-name" value={form.name} onChange={(event) => update("name", event.target.value)} className="gn-input pl-10" placeholder="Alex Johnson" autoComplete="name" required />
        </Field>
        <Field label="Work email" htmlFor="signup-email" icon={<Mail size={16} />}>
          <input id="signup-email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className="gn-input pl-10" placeholder="you@company.com" autoComplete="email" required />
        </Field>
      </div>

      <Field label="Password" htmlFor="signup-password" icon={<Lock size={16} />} hint="At least 6 characters">
        <input id="signup-password" type="password" minLength={6} value={form.password} onChange={(event) => update("password", event.target.value)} className="gn-input pl-10" placeholder="Create a secure password" autoComplete="new-password" required />
      </Field>

      <div className="border-t border-slate-200 pt-6 dark:border-white/10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Personalize your signal</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-emerald-100/50">We use these choices to tailor your climate intelligence.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Country" id="signup-country" icon={<Globe size={16} />} value={form.country} onChange={(value) => handleCountryChange(value as SignupCountry | "")}>
          <option value="">Choose a country</option>
          {COUNTRIES.map((country) => <option key={country.value} value={country.value}>{country.label}</option>)}
        </SelectField>
        <SelectField label="City" id="signup-city" icon={<MapPin size={16} />} value={form.city} onChange={(value) => update("city", value)} disabled={!form.country || cities.length === 0}>
          <option value="">{form.country ? "Choose a city" : "Select country first"}</option>
          {cities.map((city) => <option key={city} value={city}>{city}</option>)}
        </SelectField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Cloud provider" id="signup-provider" icon={<Globe size={16} />} value={form.provider} onChange={(value) => handleProviderChange(value as SignupProvider | "")}>
          <option value="">Choose a provider</option>
          {CLOUD_PROVIDERS.map((provider) => <option key={provider.value} value={provider.value}>{provider.label}</option>)}
        </SelectField>
        <SelectField label="Cloud region" id="signup-region" icon={<MapPin size={16} />} value={form.region} onChange={(value) => update("region", value)} disabled={!form.country || !form.provider || regions.length === 0}>
          <option value="">{!form.country || !form.provider ? "Choose country and provider" : "Choose a region"}</option>
          {regions.map((region) => <option key={region} value={region}>{region}</option>)}
        </SelectField>
      </div>

      <SelectField label="Primary focus area" id="signup-interest" value={form.interest} onChange={(value) => update("interest", value)}>
        <option value="">Choose an area</option>
        <option value="carbon">Carbon intensity</option>
        <option value="risk">Climate risk</option>
        <option value="sci">SCI score</option>
      </SelectField>

      <button type="submit" disabled={loading || Boolean(success)} className="gn-btn-primary inline-flex w-full items-center justify-center gap-2">
        {loading ? "Creating account…" : "Create free account"}{!loading && <ArrowRight size={17} />}
      </button>
      <p className="text-center text-sm text-slate-500 dark:text-emerald-100/50">Already have an account? <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300">Sign in</Link></p>
    </form>
  );
}

function Field({ label, htmlFor, icon, hint, children }: { label: string; htmlFor: string; icon?: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return <div><label className="gn-label" htmlFor={htmlFor}>{label}{hint && <span className="ml-1 text-slate-400 dark:text-emerald-100/40">({hint})</span>}</label><div className={icon ? "relative" : undefined}>{icon && <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-emerald-500/60">{icon}</span>}{children}</div></div>;
}

function SelectField({ label, id, icon, value, onChange, disabled, children }: { label: string; id: string; icon?: React.ReactNode; value: string; onChange: (value: string) => void; disabled?: boolean; children: React.ReactNode }) {
  return <Field label={label} htmlFor={id} icon={icon}><div className="relative"><select id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={`${"gn-input gn-select"}${icon ? " pl-10" : ""} disabled:cursor-not-allowed disabled:opacity-50`}>{children}</select><ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500/60" /></div></Field>;
}
