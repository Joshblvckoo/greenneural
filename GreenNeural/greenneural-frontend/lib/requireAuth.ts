import { supabase } from "./supabaseClient";

export async function requireAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}
