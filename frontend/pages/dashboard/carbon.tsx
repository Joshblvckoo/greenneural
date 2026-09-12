import DashboardLayout from "../../components/DashboardLayout";
import CarbonTab from "../../components/CarbonTab";
import CarbonMethodAccordion from "../../components/CarbonMethodAccordion";
import Link from "next/link";
import RiskInfoPanel from "../../components/RiskInfoPanel";

export default function CarbonPage() {
  return (
    <DashboardLayout>
      <>
        <div className="flex justify-end mb-4">
          <Link href="/profile" className="text-gray-700 hover:text-green-600 font-medium">
            My Profile
          </Link>
        </div>
        <div className="flex flex-col gap-6 md:flex-row">
          <RiskInfoPanel showRiskDetails={false}>
            <CarbonMethodAccordion />
          </RiskInfoPanel>

          <div className="flex-1">
            <CarbonTab />
          </div>
        </div>
      </>
    </DashboardLayout>
  );
}
