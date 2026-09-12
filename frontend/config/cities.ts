export const CITY_GROUPS: Record<string, string[]> = {
  Europe: [
    "London", "Manchester", "Birmingham", "Paris", "Berlin", "Frankfurt", "Madrid", "Barcelona", "Rome", "Milan", "Warsaw", "Stockholm", "Oslo", "Zurich", "Vienna",
  ],
  "North America": [
    "New York", "Los Angeles", "Chicago", "Houston", "Toronto", "Vancouver", "Montreal", "Mexico City",
  ],
  "South America": ["São Paulo", "Rio de Janeiro", "Buenos Aires", "Santiago"],
  Asia: [
    "Tokyo", "Osaka", "Seoul", "Singapore", "Hong Kong", "Shanghai", "Beijing", "Mumbai", "Delhi", "Jakarta", "Bangkok",
  ],
  "Middle East": ["Dubai", "Abu Dhabi", "Riyadh", "Doha", "Tel Aviv"],
  Africa: ["Lagos", "Nairobi", "Cairo", "Johannesburg", "Cape Town"],
  Oceania: ["Sydney", "Melbourne", "Brisbane", "Auckland"],
};

export const cityValue = (city: string) => city.toLowerCase().replace(/\s+/g, "-");
