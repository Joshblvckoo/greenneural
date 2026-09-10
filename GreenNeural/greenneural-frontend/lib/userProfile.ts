import { supabase } from "./supabaseClient";

export async function getCurrentUserProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data, error } = await supabase
    .from("users")
    .select("plan, company_name")
    .eq("email", user.email)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  // No profile row yet — return a default profile
  if (!data) {
    return { email: user.email, plan: "free", companyName: null };
  }

  return { email: user.email, plan: data.plan, companyName: data.company_name };
}
