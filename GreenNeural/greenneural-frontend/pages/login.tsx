import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { Leaf, Mail, Lock, AlertCircle, ArrowRight, Zap, Map, Calculator } from "lucide-react";

const perks = [
  { icon: Zap, text: "Real-time carbon intensity across 60+ cloud regions" },
  { icon: Map, text: "Live climate risk maps for heat, flood & air quality" },
  { icon: Calculator, text: "Green Software Foundation SCI score calculator" },
];

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }
    await router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ── Left Hero Panel ─────────────────────────────── */}
      <div className="gn-mesh-bg flex flex-col justify-between p-8 md:p-12 md:w-[45%] xl:w-[42%]">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Leaf size={20} className="text-emerald-400" />
          <span className="font-bold text-base tracking-tight gn-gradient-text">GreenNeural</span>
        </Link>

        <div className="py-12 md:py-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            v1 · Now live
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-snug mb-4">
            Your climate<br />
            <span className="gn-gradient-text">intelligence hub</span>
          </h1>
          <p className="text-emerald-100/60 text-sm leading-relaxed mb-8 max-w-xs">
            Track carbon intensity, assess climate risk, and measure your software&apos;s
            environmental score — all in one dashboard.
          </p>
          <ul className="space-y-3">
            {perks.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.text} className="flex items-start gap-3 text-sm text-emerald-200/70">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={13} className="text-emerald-400" />
                  </span>
                  {p.text}
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs text-emerald-200/30">
          © {new Date().getFullYear()} GreenNeural. Encrypted &amp; secure.
        </p>
      </div>

      {/* ── Right Form Panel ────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-8 md:p-12" style={{ background: "#080F0D" }}>
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
            <p className="text-sm" style={{ color: "rgba(110,231,183,0.55)" }}>
              Sign in to your GreenNeural account
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="gn-error animate-fade-in">
                <AlertCircle size={15} />{error}
              </div>
            )}

            <div>
              <label className="gn-label" htmlFor="login-email">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  className="gn-input pl-10"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="gn-label" htmlFor="login-password">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  className="gn-input pl-10"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="gn-btn-primary w-full"
            >
              {loading ? "Signing in…" : "Sign In"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </div>

          <p className="mt-6 text-center text-sm" style={{ color: "rgba(110,231,183,0.5)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
