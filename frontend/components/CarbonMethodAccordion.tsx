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
          GreenNeural combines regional carbon signals from the enabled grid-data providers. Availability and methodology vary by region; some regions use a static fallback estimate.
        </p>

        <ul className="ml-5 list-disc space-y-2 text-gray-700 dark:text-gray-300">
          <li>UK grid intensity from the UK Carbon Intensity API</li>
          <li>US marginal emissions signals from WattTime</li>
          <li>EU generation mix estimates from ENTSO-E</li>
          <li>Static regional estimates where live data is unavailable</li>
        </ul>

        <p className="mt-3 text-gray-700 dark:text-gray-300">
          Values are reported in gCO₂/kWh where available. Marginal emissions signals and static estimates use different methodologies and should be compared with that context in mind.
        </p>
      </div>
    </div>
  );
}
