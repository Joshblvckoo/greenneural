import dynamic from "next/dynamic";
import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import CitySearchBar, { type SelectedCity } from "../../components/CitySearchBar";
import RiskInfoPanel from "../../components/RiskInfoPanel";

const ClimateRiskMap = dynamic(() => import("../../components/ClimateRiskMap"), {
  ssr: false,
});

type RiskType = "heat" | "flood" | "airquality";

export default function ClimateRiskPage() {
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);
  const [riskType, setRiskType] = useState<RiskType>("heat");

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 md:flex-row">
        <RiskInfoPanel>
          <CitySearchBar setSelectedCity={setSelectedCity} />

          <select
            value={riskType}
            onChange={(event) => setRiskType(event.target.value as RiskType)}
            className="mt-4 w-full rounded border bg-gray-100 p-2 dark:bg-gray-700 dark:text-gray-100"
            aria-label="Climate risk layer"
          >
            <option value="heat">Heat Risk</option>
            <option value="flood">Flood Risk</option>
            <option value="airquality">Air Quality</option>
          </select>
        </RiskInfoPanel>

        <div className="flex-1">
          <ClimateRiskMap riskType={riskType} selectedCity={selectedCity} />
        </div>
      </div>
    </DashboardLayout>
  );
}
