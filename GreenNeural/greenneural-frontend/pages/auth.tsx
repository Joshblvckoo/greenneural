import { supabase } from "../lib/supabaseClient";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("ERROR:", error);
      setErrorMsg(error.message);
      return;
    }

    // Ensure a profile row exists for this user (covers users who signed up before profile creation was added)
    const { data: existingProfile } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (!existingProfile) {
      await supabase
        .from("users")
        .insert({ email, plan: "free", company_name: null });
    }

    console.log("SIGNED IN:", data);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <form onSubmit={signIn} className="space-y-4 bg-slate-900 p-6 rounded-md w-80">
        <h1 className="text-xl font-semibold">Sign In</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full px-3 py-2 bg-slate-800 rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full px-3 py-2 bg-slate-800 rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMsg && (
          <p className="text-red-400 text-sm">{errorMsg}</p>
        )}

        <button
          type="submit"
          className="w-full px-4 py-2 bg-emerald-500 text-slate-950 rounded-md font-semibold"
        >
          Sign In
        </button>

        <Link href="/signup" className="block text-center text-blue-400 hover:text-blue-300">
          Create an account
        </Link>
      </form>
    </main>
  );
}
