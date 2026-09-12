import DemoTopBar from "@/components/DemoTopBar";
import DemoSidebar from "@/components/DemoSidebar";
import RegionExplorer from "@/components/RegionExplorer";

type DemoLayoutProps = {
  embed?: boolean;
};

export default function DemoLayout({ embed = false }: DemoLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DemoTopBar embed={embed} />

      <div className="flex flex-col md:flex-row">
        <DemoSidebar />

        <main className="flex-1 bg-slate-950 px-4 py-4 md:px-6 md:py-6">
          <div className="mx-auto max-w-5xl space-y-4">
            <div className="rounded-lg bg-slate-900 p-4 border border-slate-800">
              <h1 className="text-xl font-semibold text-white">
                Cloud Region Carbon Intensity (Demo)
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Explore live carbon intensity across cloud regions. Sign up to unlock
                full carbon, climate risk, and SCI insights.
              </p>
            </div>

            <div className="rounded-lg bg-slate-900 p-4 border border-slate-800">
              <RegionExplorer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}