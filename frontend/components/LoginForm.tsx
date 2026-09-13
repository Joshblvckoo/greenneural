import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) { setError(loginError.message); setLoading(false); return; }
    await router.push("/dashboard");
  }

  return <form onSubmit={handleSubmit} className="space-y-5">
    {error && <div className="gn-error"><AlertCircle size={15} />{error}</div>}
    <div><label className="gn-label" htmlFor="login-email">Email address</label><div className="relative"><Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50" /><input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="gn-input pl-10" placeholder="you@example.com" autoComplete="email" required /></div></div>
    <div><div className="flex items-center justify-between"><label className="gn-label" htmlFor="login-password">Password</label><Link href="/auth" className="text-xs text-emerald-400 hover:text-emerald-300">Need help?</Link></div><div className="relative"><Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50" /><input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="gn-input pl-10" placeholder="Your password" autoComplete="current-password" required /></div></div>
    <button type="submit" disabled={loading} className="gn-btn-primary inline-flex w-full items-center justify-center gap-2">{loading ? "Signing in…" : "Sign in"}{!loading && <ArrowRight size={17} />}</button>
  </form>;
}
