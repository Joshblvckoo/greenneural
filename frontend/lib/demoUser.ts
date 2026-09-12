// Demo mode never touches Supabase — this is the placeholder identity shown
// in the UI so the dashboard doesn't look broken or half-logged-in.
export const DEMO_USER = {
  name: "Guest Explorer",
  companyName: "Sample Org",
  plan: "demo",
  region: "eu-west-2",
  provider: "aws",
  city: "London",
} as const;
