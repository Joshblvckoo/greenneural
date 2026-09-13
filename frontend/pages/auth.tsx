import { supabase } from "../lib/supabaseClient";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Mail, Lock, AlertCircle, ArrowRight, Zap, Map, Calculator } from "lucide-react";
import BrandLogo from "../components/BrandLogo";

const perks = [
  { icon: Zap, text: "Real-time carbon intensity across 60+ cloud regions" },
  { icon: Map, text: "Live climate risk maps for heat, flood & air quality" },
  { icon: Calculator, text: "Green Software Foundation SCI score calculator" },
];

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Ensure a profile row exists (covers legacy users)
    const { data: existingProfile } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from("users").insert({ email, plan: "free", company_name: null });
    }

    console.log("SIGNED IN:", data);
    void router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── Left Hero Panel ─────────────────────────────── */}
      <div className="gn-mesh-bg flex flex-col justify-between p-8 md:p-12 md:w-[45%] xl:w-[42%]">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 w-fit">
          <BrandLogo className="h-8 w-auto" />
        </Link>

        {/* Central copy */}
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
            Track carbon intensity, assess climate risk, and measure your software's
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
          © {new Date().getFullYear()} GreenNeural. Encrypted & secure.
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

          <form onSubmit={signIn} className="space-y-4">

            {/* Error */}
            {errorMsg && (
              <div className="gn-error animate-fade-in">
                <AlertCircle size={15} />
                {errorMsg}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="gn-label" htmlFor="auth-email">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  className="gn-input pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="gn-label" htmlFor="auth-password">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 pointer-events-none" />
                <input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  className="gn-input pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gn-btn-primary w-full mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

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
