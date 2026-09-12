import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import type { SelectedCity } from "@/components/CitySearchBar";

type RiskType = "heat" | "flood" | "airquality";
type CityRisk = Pick<SelectedCity, "city" | "lat" | "lng" | "risk" | "color">;

type ClimateRiskMapProps = {
  riskType: RiskType;
  selectedCity: SelectedCity | null;
};

const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function ClimateRiskMap({ riskType, selectedCity }: ClimateRiskMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const riskMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !accessToken || mapRef.current) return;
    mapboxgl.accessToken = accessToken;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [0, 20],
      zoom: 1.5,
      projection: "globe",
    });
    map.on("style.load", () => map.setFog({}));
    mapRef.current = map;

    return () => {
      riskMarkersRef.current.forEach((marker) => marker.remove());
      selectedMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const controller = new AbortController();

    async function updateRiskMarkers() {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/risk/live-map?type=${riskType}`,
        { signal: controller.signal },
      );
      if (!response.ok) return;
      const cities: CityRisk[] = await response.json();
      riskMarkersRef.current.forEach((marker) => marker.remove());
      riskMarkersRef.current = cities.map((city) => new mapboxgl.Marker({ color: city.color })
        .setLngLat([city.lng, city.lat])
        .setPopup(new mapboxgl.Popup().setText(`${city.city} — Risk score: ${city.risk}`))
        .addTo(map!));
    }

    void updateRiskMarkers();
    return () => controller.abort();
  }, [riskType]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedCity) return;
    selectedMarkerRef.current?.remove();
    map.flyTo({ center: [selectedCity.lng, selectedCity.lat], zoom: 4, speed: 1.2 });
    selectedMarkerRef.current = new mapboxgl.Marker({ color: selectedCity.color })
      .setLngLat([selectedCity.lng, selectedCity.lat])
      .setPopup(new mapboxgl.Popup().setText(`${selectedCity.city}\nHeat: ${selectedCity.heat}\nFlood: ${selectedCity.flood}\nAir Quality: ${selectedCity.air}\nTotal Risk: ${selectedCity.total_risk}`))
      .addTo(map);
  }, [selectedCity]);

  return <div ref={mapContainer} className="h-[600px] w-full rounded-lg shadow-lg" />;
}
