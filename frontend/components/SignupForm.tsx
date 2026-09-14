import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertCircle, ArrowRight, Check, Globe, Lock, Mail, User } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const PROVIDERS = ["AWS", "Azure", "GCP"];

export default function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", country: "", provider: "", region: "", city: "", interest: "" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [success, setSuccess] = useState("");
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (authError) { setError(authError.message); setLoading(false); return; }
    const user = authData.user;
    if (!user) { setError("Signup failed: no user returned."); setLoading(false); return; }

    const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        name: form.name,
        email: form.email,
        country: form.country,
        cloud_provider: form.provider.toLowerCase(),
        region: form.region,
        city: form.city,
        interest: form.interest || "carbon",
        plan: "free",
    });
    if (profileError) { setError(profileError.message); setLoading(false); return; }
    setSuccess("Account created. Check your email to verify your address."); setTimeout(() => router.push("/login"), 2500);
    setLoading(false);
  }

  return <form onSubmit={handleSubmit} className="space-y-4">
    {error && <div className="gn-error"><AlertCircle size={15} />{error}</div>}
    {success && <div className="gn-success"><Check size={15} />{success}</div>}
    <div><label className="gn-label" htmlFor="signup-name">Full name</label><div className="relative"><User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50" /><input id="signup-name" value={form.name} onChange={(event) => update("name", event.target.value)} className="gn-input pl-10" placeholder="Alex Johnson" autoComplete="name" required /></div></div>
    <div><label className="gn-label" htmlFor="signup-email">Work email</label><div className="relative"><Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50" /><input id="signup-email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className="gn-input pl-10" placeholder="you@company.com" autoComplete="email" required /></div></div>
    <div><label className="gn-label" htmlFor="signup-password">Password</label><div className="relative"><Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50" /><input id="signup-password" type="password" minLength={6} value={form.password} onChange={(event) => update("password", event.target.value)} className="gn-input pl-10" placeholder="At least 6 characters" autoComplete="new-password" required /></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label className="gn-label" htmlFor="signup-country">Country</label><input id="signup-country" value={form.country} onChange={(event) => update("country", event.target.value)} className="gn-input" placeholder="United Kingdom" required /></div><div><label className="gn-label" htmlFor="signup-city">City</label><input id="signup-city" value={form.city} onChange={(event) => update("city", event.target.value)} className="gn-input" placeholder="London" /></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label className="gn-label" htmlFor="signup-provider">Cloud provider</label><div className="relative"><Globe size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50" /><select id="signup-provider" value={form.provider} onChange={(event) => update("provider", event.target.value)} className="gn-input gn-select pl-10" required><option value="">Choose one</option>{PROVIDERS.map((provider) => <option key={provider}>{provider}</option>)}</select></div></div><div><label className="gn-label" htmlFor="signup-region">Cloud region</label><input id="signup-region" value={form.region} onChange={(event) => update("region", event.target.value)} className="gn-input" placeholder="eu-west-2" required /></div></div>
    <div><label className="gn-label" htmlFor="signup-interest">Focus area</label><select id="signup-interest" value={form.interest} onChange={(event) => update("interest", event.target.value)} className="gn-input gn-select"><option value="">Choose one</option><option value="carbon">Carbon</option><option value="risk">Climate risk</option><option value="sci">SCI score</option></select></div>
    <button type="submit" disabled={loading || Boolean(success)} className="gn-btn-primary mt-2 inline-flex w-full items-center justify-center gap-2">{loading ? "Creating account…" : "Create free account"}{!loading && <ArrowRight size={17} />}</button>
    <p className="pt-2 text-center text-sm text-emerald-100/50">Already have an account? <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">Sign in</Link></p>
  </form>;
}
