import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertCircle, ArrowRight, Check, Globe, Lock, Mail, User } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const PROVIDERS = ["AWS", "Azure", "GCP"];

export default function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", provider: "", interest: "" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [success, setSuccess] = useState("");
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const { data, error: signupError } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { name: form.name, cloud_provider: form.provider, interest: form.interest }, emailRedirectTo: `${window.location.origin}/login` } });
    if (signupError) { setError(signupError.message); setLoading(false); return; }
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        name: form.name,
        email: form.email,
        cloud_provider: form.provider.toLowerCase(),
        interest: form.interest || "carbon",
        plan: "free",
      });
      if (profileError) console.warn("Profile row was not created; metadata fallback will be used.", profileError.message);
      setSuccess("Account created. Check your email to verify your address."); setTimeout(() => router.push("/login"), 2500);
    }
    setLoading(false);
  }

  return <form onSubmit={handleSubmit} className="space-y-4">
    {error && <div className="gn-error"><AlertCircle size={15} />{error}</div>}
    {success && <div className="gn-success"><Check size={15} />{success}</div>}
    <div><label className="gn-label" htmlFor="signup-name">Full name</label><div className="relative"><User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50" /><input id="signup-name" value={form.name} onChange={(event) => update("name", event.target.value)} className="gn-input pl-10" placeholder="Alex Johnson" autoComplete="name" required /></div></div>
    <div><label className="gn-label" htmlFor="signup-email">Work email</label><div className="relative"><Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50" /><input id="signup-email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className="gn-input pl-10" placeholder="you@company.com" autoComplete="email" required /></div></div>
    <div><label className="gn-label" htmlFor="signup-password">Password</label><div className="relative"><Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50" /><input id="signup-password" type="password" minLength={6} value={form.password} onChange={(event) => update("password", event.target.value)} className="gn-input pl-10" placeholder="At least 6 characters" autoComplete="new-password" required /></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label className="gn-label" htmlFor="signup-provider">Cloud provider</label><div className="relative"><Globe size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50" /><select id="signup-provider" value={form.provider} onChange={(event) => update("provider", event.target.value)} className="gn-input gn-select pl-10" required><option value="">Choose one</option>{PROVIDERS.map((provider) => <option key={provider}>{provider}</option>)}</select></div></div><div><label className="gn-label" htmlFor="signup-interest">Focus area</label><select id="signup-interest" value={form.interest} onChange={(event) => update("interest", event.target.value)} className="gn-input gn-select"><option value="">Choose one</option><option value="carbon">Carbon</option><option value="risk">Climate risk</option><option value="sci">SCI score</option></select></div></div>
    <button type="submit" disabled={loading || Boolean(success)} className="gn-btn-primary mt-2 inline-flex w-full items-center justify-center gap-2">{loading ? "Creating account…" : "Create free account"}{!loading && <ArrowRight size={17} />}</button>
    <p className="pt-2 text-center text-sm text-emerald-100/50">Already have an account? <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">Sign in</Link></p>
  </form>;
}
