export type DashboardTab = "carbon" | "climate" | "sci" | "account";

type SidebarProps = {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
};

const tabs: DashboardTab[] = ["carbon", "climate", "sci", "account"];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-white p-4">
      <h2 className="text-xl font-semibold mb-4">Explorer</h2>
      <nav className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`w-full text-left px-3 py-2 rounded-md ${
              activeTab === tab ? "bg-emerald-500 text-slate-950" : "bg-slate-800"
            }`}
          >
            {tab === "carbon" && "Carbon"}
            {tab === "climate" && "Climate Risk"}
            {tab === "sci" && "SCI Calculator"}
            {tab === "account" && "Account"}
          </button>
        ))}
      </nav>
    </aside>
  );
}
