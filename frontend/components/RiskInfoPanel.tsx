import { useState } from "react";
import type { ReactNode } from "react";
import RiskMethodAccordion from "./RiskMethodAccordion";
import RiskDataSourcesAccordion from "./RiskDataSourcesAccordion";

type RiskInfoPanelProps = {
  children: ReactNode;
  showRiskDetails?: boolean;
};

export default function RiskInfoPanel({ children, showRiskDetails = true }: RiskInfoPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:w-80 md:block">
      
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden bg-[#0F1E2E] text-white px-4 py-2 rounded-lg mb-4"
      >
        {open ? "Close Info Panel" : "Open Info Panel"}
      </button>

      {/* Panel Content */}
      <div
        className={`transition-all duration-300 ${
          open ? "block" : "hidden md:block"
        }`}
      >
        {children}

        {showRiskDetails && <RiskMethodAccordion />}
        {showRiskDetails && <RiskDataSourcesAccordion />}
      </div>
    </div>
  );
}
