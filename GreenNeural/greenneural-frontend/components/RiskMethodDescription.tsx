export default function RiskMethodDescription() {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mt-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
        How GreenNeural Computes Real‑Time Climate Risk
      </h2>

      <p className="text-gray-700 dark:text-gray-300 mb-3">
        GreenNeural generates real‑time climate risk scores using live environmental data from trusted global sources. 
        For each selected city, the system performs three steps:
      </p>

      <ol className="list-decimal ml-5 space-y-2 text-gray-700 dark:text-gray-300">
        <li>
          <strong>Live Environmental Data Fetching:</strong> We retrieve real‑time weather and air‑quality measurements 
          using the OpenWeather API, including temperature, humidity, rainfall, and PM2.5 pollution levels.
        </li>

        <li>
          <strong>Risk Scoring Engine:</strong> GreenNeural applies a transparent, rule‑based scoring model to convert 
          raw environmental data into three risk categories: Heat Risk, Flood Risk, and Air Quality Risk. Each category 
          is scored from 0 to 100.
        </li>

        <li>
          <strong>Real‑Time Visualization:</strong> The computed risk scores are rendered instantly on the 3D Climate Map. 
          Cities and regions are color‑coded to help users quickly identify high‑risk zones.
        </li>
      </ol>

      <p className="mt-3 text-gray-700 dark:text-gray-300">
        This v1 system provides fast, reliable, and globally available risk insights using live environmental data.
      </p>
    </div>
  );
}
