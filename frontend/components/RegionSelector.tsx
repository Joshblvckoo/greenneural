import { REGION_OPTIONS } from "@/config/regions";

interface Props {
  provider: string;
  region: string;
  setRegion: (value: string) => void;
}

export default function RegionSelector({ provider, region, setRegion }: Props) {
  const providerRegions = REGION_OPTIONS[provider];

  if (!providerRegions) {
    return <p>Select a cloud provider first.</p>;
  }

  return (
    <select
      value={region}
      onChange={(e) => setRegion(e.target.value)}
      className="border border-green-600 p-2 rounded w-full bg-green-50 text-green-900 focus:ring-2 focus:ring-green-600"
    >
      {Object.entries(providerRegions.groups).map(([groupLabel, regions]) => (
        <optgroup key={groupLabel} label={groupLabel}>
          {regions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label} — {r.value}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
