import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      window.alert(error.message);
      return;
    }

    await router.push("/dashboard");
  };

  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-3xl font-bold">Login</h1>

      <input
        type="email"
        placeholder="Email"
        className="mb-4 w-full rounded bg-gray-100 p-3"
        onChange={(event) => setForm({ ...form, email: event.target.value })}
      />

      <input
        type="password"
        placeholder="Password"
        className="mb-4 w-full rounded bg-gray-100 p-3"
        onChange={(event) => setForm({ ...form, password: event.target.value })}
      />

      <button
        type="button"
        onClick={handleLogin}
        className="rounded-lg bg-green-600 px-4 py-2 text-white"
      >
        Login
      </button>
    </div>
  );
}
