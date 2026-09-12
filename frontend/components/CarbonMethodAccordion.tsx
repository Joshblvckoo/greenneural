import { useState } from "react";

export default function CarbonMethodAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left font-semibold text-gray-900 dark:text-gray-100"
        aria-expanded={open}
      >
        <span>How GreenNeural Computes Carbon Intensity</span>
        <span className="text-xl" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[600px] p-4" : "max-h-0 p-0"}`}>
        <p className="mb-3 text-gray-700 dark:text-gray-300">
          GreenNeural retrieves real-time carbon intensity values using the Electricity Maps API. Each region provides a live estimate of grams of CO₂ emitted per kilowatt-hour of electricity produced.
        </p>

        <ul className="ml-5 list-disc space-y-2 text-gray-700 dark:text-gray-300">
          <li>Live carbon intensity (gCO₂/kWh)</li>
          <li>Energy mix (renewables vs fossil)</li>
          <li>Regional grid emissions</li>
        </ul>

        <p className="mt-3 text-gray-700 dark:text-gray-300">
          If a region does not return live data, GreenNeural displays a fallback message instead of intensity values.
        </p>
      </div>
    </div>
  );
}
