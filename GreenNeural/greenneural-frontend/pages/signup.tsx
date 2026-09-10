import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

const COUNTRIES = [
  { value: "au", label: "Australia" },
  { value: "be", label: "Belgium" },
  { value: "br", label: "Brazil" },
  { value: "ca", label: "Canada" },
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "in", label: "India" },
  { value: "ie", label: "Ireland" },
  { value: "it", label: "Italy" },
  { value: "jp", label: "Japan" },
  { value: "kr", label: "South Korea" },
  { value: "es", label: "Spain" },
  { value: "se", label: "Sweden" },
  { value: "ch", label: "Switzerland" },
  { value: "ae", label: "United Arab Emirates" },
  { value: "gb", label: "United Kingdom" },
  { value: "us", label: "United States" },
];

const REGIONS_BY_COUNTRY: Record<string, Record<string, string[]>> = {
  au: { aws: ["ap-southeast-2"], azure: ["australiaeast", "australiasoutheast"], gcp: ["australia-southeast1", "australia-southeast2"] },
  be: { aws: [], azure: ["westeurope"], gcp: ["europe-west1"] },
  br: { aws: ["sa-east-1"], azure: [], gcp: ["southamerica-east1", "southamerica-west1"] },
  ca: { aws: ["ca-central-1", "ca-west-1"], azure: ["canadacentral", "canadaeast"], gcp: ["northamerica-northeast1", "northamerica-northeast2"] },
  fr: { aws: ["eu-west-3"], azure: ["francecentral", "francesouth"], gcp: ["europe-west9"] },
  de: { aws: ["eu-central-1"], azure: ["germanynorth", "germanywestcentral"], gcp: ["europe-west3"] },
  in: { aws: ["ap-south-1", "ap-south-2"], azure: ["indiacentral", "indiasouth", "indiawest"], gcp: ["asia-south1", "asia-south2"] },
  ie: { aws: ["eu-west-1"], azure: ["northeurope"], gcp: [] },
  it: { aws: ["eu-south-1"], azure: ["italynorth"], gcp: [] },
  jp: { aws: ["ap-northeast-1"], azure: ["japaneast", "japanwest"], gcp: ["asia-northeast1", "asia-northeast2"] },
  kr: { aws: ["ap-northeast-2"], azure: ["koreacentral", "koreasouth"], gcp: ["asia-northeast3"] },
  es: { aws: ["eu-south-2"], azure: ["spaincentral"], gcp: [] },
  se: { aws: ["eu-north-1"], azure: ["swedencentral", "swedensouth"], gcp: ["europe-north1"] },
  ch: { aws: ["eu-central-2"], azure: ["switzerlandnorth", "switzerlandwest"], gcp: ["europe-west6"] },
  ae: { aws: ["me-central-1"], azure: ["uaenorth", "uaecentral"], gcp: ["me-central1"] },
  gb: { aws: ["eu-west-2"], azure: ["uksouth", "ukwest"], gcp: ["europe-west2"] },
  us: { aws: ["us-east-1", "us-east-2", "us-west-1", "us-west-2"], azure: ["eastus", "eastus2", "westus", "westus2", "westus3", "centralus"], gcp: ["us-central1", "us-east1", "us-east4", "us-west1", "us-west2", "us-west3", "us-west4"] },
};

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    country: "",
    cloud: "",
    region: "",
    city: "",
    interest: "",
  });

  const update = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const availableRegions = REGIONS_BY_COUNTRY[form.country]?.[form.cloud] ?? [];

  const handleSignup = async () => {
    const { name, email, password, country, cloud, region, city, interest } = form;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://greenneural.vercel.app/login",
        },
      });

      if (authError) {
        window.alert(`Signup failed: ${authError.message}`);
        return;
      }

      const user = authData.user;

      if (!user) {
        window.alert("Signup failed: Supabase did not return a user.");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        name,
        email,
        country,
        cloud_provider: cloud,
        region,
        city,
        interest,
        plan: "free",
      });

      if (profileError) {
        window.alert(`Profile creation failed: ${profileError.message}`);
        return;
      }

      window.alert("Account created! Please check your email to verify your account.");
      await router.push("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      window.alert(`Signup failed: ${message}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">

      {/* Left Panel */}
      <div className="w-1/2 p-12 bg-[#0F1E2E] text-white flex flex-col justify-center">
        <h1 className="text-4xl font-bold mb-4">GreenNeural v1</h1>
        <p className="text-lg mb-6">
          Your climate intelligence companion. Real‑time carbon intensity,
          live climate risk maps, and SCI calculations — all in one place.
        </p>

        <p className="text-sm opacity-80 mb-6">
          Start free and explore sustainability insights built for developers,
          engineers, and climate‑focused teams.
        </p>

        <Link
          href="#signup-form"
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg w-fit"
        >
          Start Free
        </Link>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 p-12 flex flex-col justify-center" id="signup-form">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Create Your Account
        </h2>

        <div className="space-y-4">

          <input name="name" placeholder="Full Name"
            onChange={update}
            className="w-full p-3 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />

          <input name="email" placeholder="Email Address"
            onChange={update}
            className="w-full p-3 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />

          <input name="password" type="password" placeholder="Password"
            onChange={update}
            className="w-full p-3 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />

          <select name="country" value={form.country}
            onChange={(event) => setForm((current) => ({ ...current, country: event.target.value, region: "" }))}
            className="w-full p-3 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">Country</option>
            {COUNTRIES.map((country) => (
              <option key={country.value} value={country.value}>{country.label}</option>
            ))}
          </select>

          <select name="cloud" value={form.cloud}
            onChange={(event) => setForm((current) => ({ ...current, cloud: event.target.value, region: "" }))}
            className="w-full p-3 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">Preferred Cloud Provider</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">GCP</option>
          </select>

          <select name="region" value={form.region} onChange={update}
            disabled={!form.country || !form.cloud || availableRegions.length === 0}
            className="w-full p-3 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">
              {!form.country || !form.cloud
                ? "Select country and provider first"
                : availableRegions.length === 0
                  ? "No regions available for this selection"
                  : "Preferred Cloud Region"}
            </option>
            {availableRegions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          <input name="city" type="text" placeholder="City (optional)"
            onChange={update}
            className="w-full p-3 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />

          <select name="interest" onChange={update}
            className="w-full p-3 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">Sustainability Interest</option>
            <option value="heat">Heat Risk</option>
            <option value="flood">Flood Risk</option>
            <option value="air">Air Quality</option>
            <option value="carbon">Carbon Optimization</option>
          </select>

        </div>

        <button
          type="button"
          onClick={handleSignup}
          className="mt-6 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg"
        >
          Start Free
        </button>

        <Link href="/auth" className="mt-4 text-blue-600 dark:text-blue-400">
          Already have an account? Login
        </Link>
      </div>
    </div>
  );
}
