import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
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
  const [mapReady, setMapReady] = useState(false);

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
    map.on("load", () => {
      map.setFog({});
      setMapReady(true);
    });
    map.on("error", (event) => {
      console.error("Mapbox failed to load the climate-risk globe", event.error);
    });
    mapRef.current = map;

    return () => {
      riskMarkersRef.current.forEach((marker) => marker.remove());
      selectedMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const activeMap = map;
    const controller = new AbortController();
    let disposed = false;

    async function updateRiskMarkers() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/risk/live-map?type=${riskType}`,
          { signal: controller.signal },
        );
        if (!response.ok || disposed) return;
        const cities: CityRisk[] = await response.json();
        if (disposed) return;
        riskMarkersRef.current.forEach((marker) => marker.remove());
        riskMarkersRef.current = cities.map((city) => new mapboxgl.Marker({ color: city.color })
          .setLngLat([city.lng, city.lat])
          .setPopup(new mapboxgl.Popup().setText(`${city.city} — Risk score: ${city.risk}`))
          .addTo(activeMap));
      } catch (error) {
        if (!disposed && error instanceof Error && error.name !== "AbortError") {
          console.error("Unable to load climate risk markers", error);
        }
      }
    }

    void updateRiskMarkers();
    return () => {
      disposed = true;
      controller.abort();
    };
  }, [mapReady, riskType]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedCity) return;
    selectedMarkerRef.current?.remove();
    map.flyTo({ center: [selectedCity.lng, selectedCity.lat], zoom: 4, speed: 1.2 });
    selectedMarkerRef.current = new mapboxgl.Marker({ color: selectedCity.color })
      .setLngLat([selectedCity.lng, selectedCity.lat])
      .setPopup(new mapboxgl.Popup().setText(`${selectedCity.city}\nHeat: ${selectedCity.heat}\nFlood: ${selectedCity.flood}\nAir Quality: ${selectedCity.air}\nTotal Risk: ${selectedCity.total_risk}`))
      .addTo(map);
  }, [mapReady, selectedCity]);

  if (!accessToken) {
    return <div className="flex h-[600px] w-full items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
      Map preview unavailable. Configure NEXT_PUBLIC_MAPBOX_TOKEN to show the climate-risk globe.
    </div>;
  }

  return <div ref={mapContainer} className="h-[600px] min-h-[320px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-lg dark:border-slate-700" />;
}
