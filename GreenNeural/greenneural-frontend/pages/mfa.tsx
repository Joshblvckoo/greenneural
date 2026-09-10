import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function MFASetup() {
  const [qr, setQr] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const generateMFA = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });

    if (error || !data) {
      alert(`Unable to generate MFA setup: ${error?.message ?? "No enrollment data returned."}`);
      return;
    }

    setQr(data.totp.qr_code);
    setFactorId(data.id);
  };

  const verifyMFA = async () => {
    if (!factorId) {
      alert("Generate an MFA QR code before verifying it.");
      return;
    }

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });

    if (challengeError || !challengeData) {
      alert(`Unable to create MFA challenge: ${challengeError?.message ?? "No challenge data returned."}`);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      alert(`MFA verification failed: ${verifyError.message}`);
      return;
    }

    alert("MFA enabled successfully!");
  };

  return (
    <div className="p-8 max-w-xl mx-auto text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Enable MFA</h1>

      {!qr && (
        <button
          onClick={generateMFA}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Generate MFA QR Code
        </button>
      )}

      {qr && (
        <>
          <img src={`data:image/svg+xml;utf-8,${qr}`} alt="MFA QR Code" className="my-6" />
          <input
            type="text"
            placeholder="Enter 6-digit code"
            className="p-3 rounded bg-white dark:bg-gray-800"
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            onClick={verifyMFA}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Verify MFA
          </button>
        </>
      )}
    </div>
  );
}
