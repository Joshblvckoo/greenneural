import DashboardLayout from "../../components/DashboardLayout";
import SciTab from "../../components/SciTab";
import Link from "next/link";

export default function SciPage() {
  return (
    <DashboardLayout>
      <>
        <div className="flex justify-end mb-4">
          <Link href="/profile" className="text-gray-700 hover:text-green-600 font-medium">
            My Profile
          </Link>
        </div>
        <SciTab />
      </>
    </DashboardLayout>
  );
}
