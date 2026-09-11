import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Calculator, Cloud, LogOut, Map, Menu, Moon, Sun, User, X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export type DashboardTab = "carbon" | "climate" | "sci" | "account";

type SidebarProps = {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
};

const tabs = [
  { key: "carbon", label: "Carbon Intensity", icon: Cloud },
  { key: "climate", label: "Climate Risk Map", icon: Map },
  { key: "sci", label: "SCI Calculator", icon: Calculator },
  { key: "account", label: "My Profile", icon: User },
] as const;

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [openMobile, setOpenMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(document.documentElement.classList.contains("dark"));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await router.push("/signup");
  };

  return (
    <>
      <button type="button" className="fixed left-4 top-4 z-50 rounded-md bg-slate-900 px-4 py-2 text-white md:hidden" onClick={() => setOpenMobile(true)} aria-label="Open navigation menu">
        <Menu size={20} />
      </button>

      {openMobile && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpenMobile(false)} aria-hidden="true" />}

      <aside className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-slate-900 p-4 text-white transition-all duration-300 ${openMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${collapsed ? "md:w-20" : "md:w-64"} md:static`}>
        <button type="button" className="mb-6 hidden rounded-md bg-slate-800 px-3 py-2 text-sm md:flex" onClick={() => setCollapsed((current) => !current)}>
          {collapsed ? "Expand" : "Collapse"}
        </button>

        <button type="button" className="mb-4 text-left text-sm text-gray-300 md:hidden" onClick={() => setOpenMobile(false)} aria-label="Close navigation menu">
          <X size={20} />
        </button>

        <h2 className={`mb-4 text-xl font-semibold ${collapsed ? "md:hidden" : ""}`}>Explorer</h2>

        <nav className="space-y-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button type="button" key={key} onClick={() => { onTabChange(key); setOpenMobile(false); }} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${activeTab === key ? "bg-emerald-500 text-slate-950" : "bg-slate-800"}`} title={collapsed ? label : undefined}>
              <Icon size={20} aria-hidden="true" />
              <span className={collapsed ? "md:hidden" : ""}>{label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-2">
          <button type="button" onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-md bg-slate-800 px-3 py-2" title={collapsed ? "Toggle dark mode" : undefined}>
            {darkMode ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
            <span className={collapsed ? "md:hidden" : ""}>{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-md bg-red-600 px-3 py-2" title={collapsed ? "Logout" : undefined}>
            <LogOut size={20} aria-hidden="true" />
            <span className={collapsed ? "md:hidden" : ""}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
