import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { supabase } from "../lib/supabaseClient";
import DashboardLayout from "../components/DashboardLayout";

interface Profile {
  name: string;
  email: string;
  avatar_url?: string;
  cloud_provider: string;
  region: string;
  city: string;
  risk_type: string;
  unit: string;
  last_sci?: number | null;
  last_intensity?: number | null;
  last_risk_city?: string | null;
  plan: string;
}

const defaultProfile: Profile = {
  name: "",
  email: "",
  avatar_url: "",
  cloud_provider: "aws",
  region: "eu-west-2",
  city: "London",
  risk_type: "heat",
  unit: "gco2",
  last_sci: null,
  last_intensity: null,
  last_risk_city: null,
  plan: "free",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile({ ...defaultProfile, ...data });
      }
    };

    void loadProfile();
  }, []);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const lines = [
      "GreenNeural Sustainability Profile",
      `Name: ${profile.name}`,
      `Email: ${profile.email}`,
      `Cloud Provider: ${profile.cloud_provider}`,
      `Region: ${profile.region}`,
      `City: ${profile.city}`,
      `Risk Type: ${profile.risk_type}`,
      `Units: ${profile.unit}`,
      `Last SCI: ${profile.last_sci ?? "N/A"}`,
      `Last Carbon Intensity: ${profile.last_intensity ?? "N/A"}`,
      `Last Climate Risk City: ${profile.last_risk_city ?? "N/A"}`,
      `Plan: ${profile.plan}`,
    ];

    lines.forEach((line, index) => doc.text(line, 10, 10 + index * 10));
    doc.save("GreenNeural_Profile.pdf");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Account Profile</h1>
          <p className="text-gray-600">
            Manage your personal information and sustainability preferences.
          </p>
        </div>
        <button
          onClick={downloadPDF}
          className="bg-green-600 text-white px-4 py-2 rounded shadow-sm hover:bg-green-700"
        >
          Download PDF Profile
        </button>
      </div>

      <section className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <h2 className="text-lg font-semibold">Personal information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="name">
              Full name
            </label>
            <input id="name" required className="w-full border rounded px-3 py-2" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" required className="w-full border rounded px-3 py-2" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <h2 className="text-lg font-semibold">Sustainability preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="cloud-provider">Cloud provider</label>
            <select id="cloud-provider" required className="w-full border rounded px-3 py-2" value={profile.cloud_provider} onChange={(e) => setProfile((p) => ({ ...p, cloud_provider: e.target.value }))}>
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="gcp">GCP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="region">Region</label>
            <input id="region" required className="w-full border rounded px-3 py-2" value={profile.region} onChange={(e) => setProfile((p) => ({ ...p, region: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="city">City</label>
            <input id="city" required className="w-full border rounded px-3 py-2" value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="risk-type">Default risk type</label>
            <select id="risk-type" required className="w-full border rounded px-3 py-2" value={profile.risk_type} onChange={(e) => setProfile((p) => ({ ...p, risk_type: e.target.value }))}>
              <option value="heat">Heat</option>
              <option value="flood">Flood</option>
              <option value="airquality">Air Quality</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="unit">Units</label>
            <select id="unit" required className="w-full border rounded px-3 py-2" value={profile.unit} onChange={(e) => setProfile((p) => ({ ...p, unit: e.target.value }))}>
              <option value="gco2">gCO₂</option>
              <option value="kgco2">kgCO₂</option>
              <option value="tco2">tCO₂</option>
            </select>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <h2 className="text-lg font-semibold">Sustainability activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div><span className="font-semibold">Last SCI score</span><p>{profile.last_sci ?? "No calculations yet"}</p></div>
          <div><span className="font-semibold">Last carbon intensity</span><p>{profile.last_intensity ?? "No checks yet"}</p></div>
          <div><span className="font-semibold">Last climate risk city</span><p>{profile.last_risk_city ?? "No searches yet"}</p></div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t">
          <div><span className="text-sm text-gray-600">Plan</span><p className="font-semibold capitalize">{profile.plan}</p></div>
          <button className="text-sm bg-gray-900 text-white px-3 py-2 rounded">Upgrade (coming soon)</button>
        </div>
      </section>
      </div>
    </DashboardLayout>
  );
}
