import { useState } from "react";

export type SelectedCity = {
  city: string;
  lat: number;
  lng: number;
  heat: number;
  flood: number;
  air: number;
  total_risk: number;
  color: "red" | "yellow" | "green";
  risk?: number;
};

type CitySearchBarProps = {
  setSelectedCity: (city: SelectedCity) => void;
};

export default function CitySearchBar({ setSelectedCity }: CitySearchBarProps) {
  const [query, setQuery] = useState("");

  async function searchCity() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/risk/realtime?city=${encodeURIComponent(query)}`);
    if (!response.ok) return;
    setSelectedCity(await response.json());
  }

  return (
    <div className="mb-4 flex gap-2">
      <input type="text" placeholder="Search a city..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded border p-2 text-slate-900" />
      <button type="button" onClick={searchCity} className="rounded bg-green-600 px-4 py-2 text-white">Search</button>
    </div>
  );
}
