import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type RiskMapProps = {
  city: string;
};

export default function RiskMap({ city }: RiskMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Simple city → coordinates mapping
  const cityCoords: Record<string, [number, number]> = {
    london: [-0.1276, 51.5072],
    manchester: [-2.2426, 53.4808],
    birmingham: [-1.8998, 52.4862],
    liverpool: [-2.9779, 53.4084],
    glasgow: [-4.2518, 55.8642],
  };

  useEffect(() => {
    if (!mapContainer.current || !accessToken) return;

    const coordinates = cityCoords[city];

    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: coordinates ?? [0, 20],
      zoom: coordinates ? 10 : 1.5,
    });

    map.on("load", () => {
      if (!coordinates) return;

      map.addSource("city-risk-marker", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates },
        },
      });

      map.addLayer({
        id: "city-risk-marker",
        type: "circle",
        source: "city-risk-marker",
        paint: {
          "circle-radius": 14,
          "circle-color": "#f59e0b",
          "circle-opacity": 0.8,
          "circle-stroke-color": "#fef3c7",
          "circle-stroke-width": 2,
        },
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [city]);

  if (!accessToken) {
    return (
      <p role="alert" className="rounded-md bg-red-950 p-3 text-red-200">
        Mapbox is unavailable because NEXT_PUBLIC_MAPBOX_TOKEN is not configured.
      </p>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="w-full h-96 rounded-md border border-slate-800"
    />
  );
}
