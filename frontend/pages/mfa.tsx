import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { Leaf, ShieldCheck, QrCode, KeyRound, CheckCircle, AlertCircle } from "lucide-react";

export default function MFASetup() {
  const [qr, setQr] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const generateMFA = async () => {
    setError("");
    setLoading(true);
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setLoading(false);
    if (enrollError || !data) {
      setError(enrollError?.message ?? "No enrollment data returned.");
      return;
    }
    setQr(data.totp.qr_code);
    setFactorId(data.id);
  };

  const verifyMFA = async () => {
    if (!factorId) { setError("Generate a QR code first."); return; }
    setError("");
    setLoading(true);

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challengeData) {
      setError(challengeError?.message ?? "Challenge failed.");
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });
    setLoading(false);
    if (verifyError) { setError(verifyError.message); return; }
    setSuccess("MFA enabled successfully! Your account is now extra secure.");
  };

  return (
    <div className="min-h-screen gn-mesh-bg flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <Leaf size={20} className="text-emerald-400" />
          <span className="font-bold text-base gn-gradient-text">GreenNeural</span>
        </Link>
        <Link href="/dashboard" className="gn-btn-ghost text-sm px-4 py-2">
          Back to Dashboard
        </Link>
      </nav>

      {/* Card */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="gn-card p-8 w-full max-w-md animate-fade-up">

          {/* Icon header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-pulse-glow"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <ShieldCheck size={32} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
            <p className="text-sm mt-2" style={{ color: "rgba(110,231,183,0.55)" }}>
              Add an extra layer of security to your account using an authenticator app.
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

          {/* Step 1 — Generate */}
          {!qr && !success && (
            <div className="space-y-4">
              <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <p className="font-medium mb-2 text-emerald-300">How it works</p>
                <ol className="space-y-1.5 text-emerald-200/60 list-decimal list-inside">
                  <li>Click below to generate your unique QR code</li>
                  <li>Scan it with Google Authenticator or Authy</li>
                  <li>Enter the 6-digit code to verify and activate</li>
                </ol>
              </div>
              <button
                type="button"
                onClick={generateMFA}
                disabled={loading}
                className="gn-btn-primary w-full"
              >
                <QrCode size={17} />
                {loading ? "Generating…" : "Generate QR Code"}
              </button>
            </div>
          )}

          {/* Step 2 — Scan & Verify */}
          {qr && !success && (
            <div className="space-y-5 animate-fade-up">
              <div className="flex justify-center">
                <div className="p-3 rounded-xl bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/svg+xml;utf-8,${qr}`}
                    alt="MFA QR Code — scan with your authenticator app"
                    className="w-40 h-40"
                  />
                </div>
              </div>
              <p className="text-xs text-center" style={{ color: "rgba(110,231,183,0.5)" }}>
                Scan this QR code with your authenticator app, then enter the 6-digit code below.
              </p>
              <div>
                <label className="gn-label" htmlFor="mfa-code">6-digit code</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 pointer-events-none" />
                  <input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="gn-input pl-10 tracking-widest text-center text-lg font-semibold"
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={verifyMFA}
                disabled={loading || code.length < 6}
                className="gn-btn-primary w-full"
              >
                <ShieldCheck size={17} />
                {loading ? "Verifying…" : "Verify & Enable MFA"}
              </button>
            </div>
          )}

          {/* Completed */}
          {success && (
            <div className="text-center animate-fade-up">
              <Link href="/dashboard" className="gn-btn-primary w-full mt-2">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
