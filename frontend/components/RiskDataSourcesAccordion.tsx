import { useState } from "react";

export default function RiskDataSourcesAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mt-4">
      
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center p-4 text-left text-gray-900 dark:text-gray-100 font-semibold"
      >
        <span>Data Sources Used for Real‑Time Risk</span>
        <span className="text-xl">{open ? "−" : "+"}</span>
      </button>

      {/* Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-[600px] p-4" : "max-h-0 p-0"
        }`}
      >
        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
          <li>
            <strong>OpenWeather (Weather API):</strong>  
            Provides temperature, humidity, rainfall, storm indicators, and city geolocation.
          </li>

          <li>
            <strong>OpenWeather Air Pollution API:</strong>  
            Supplies PM2.5, PM10, NO₂, O₃, and AQI values for air‑quality risk scoring.
          </li>

          <li>
            <strong>Electricity Maps (Optional):</strong>  
            Used for carbon intensity and energy‑related environmental metrics.
          </li>

          <li>
            <strong>GreenNeural Risk Engine:</strong>  
            Converts raw environmental data into Heat, Flood, and Air Quality risk scores (0–100).
          </li>
        </ul>

        <p className="mt-3 text-gray-700 dark:text-gray-300">
          These sources allow GreenNeural to deliver fast, reliable, and globally available climate risk insights.
        </p>
      </div>
    </div>
  );
}
