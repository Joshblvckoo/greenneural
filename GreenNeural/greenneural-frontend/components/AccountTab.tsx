import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { getCurrentUserProfile } from "../lib/userProfile";
import { supabase } from "../lib/supabaseClient";

type Profile = {
  email: string;
  plan: string;
  companyName: string | null;
};

export default function AccountTab() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    getCurrentUserProfile().then((p) => setProfile(p));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Account & Billing</h1>
      {profile ? (
        <>
          <p>Email: {profile.email}</p>
          <p>Plan: {profile.plan}</p>
          {profile.companyName && <p>Company: {profile.companyName}</p>}
        </>
      ) : (
        <p>Loading profile…</p>
      )}
      <button
        onClick={handleLogout}
        className="px-4 py-2 rounded-md bg-emerald-500 text-slate-950 font-semibold"
      >
        Log out
      </button>
      <Link href="/profile" className="text-emerald-400 underline">
      View full profile
      </Link>
    </div>
    
  );
}
