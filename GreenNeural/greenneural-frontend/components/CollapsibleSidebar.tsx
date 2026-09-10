import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function CollapsibleSidebar() {
  const [open, setOpen] = useState(true);
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
    <div className="relative">
      {/* Toggle Button (always visible on mobile) */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-[#0F1E2E] px-3 py-2 text-white shadow-lg dark:bg-[#0A1624] md:hidden"
      >
        {open ? "Close" : "Menu"}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-[#0F1E2E] p-6 text-white shadow-xl transition-all duration-300 dark:bg-[#0A1624]
          ${open ? "w-64" : "w-0 overflow-hidden"}
          md:static md:block md:h-auto md:w-64`}
      >
        {open && (
          <nav className="space-y-4 text-sm">
            <Link href="/dashboard" className="block hover:text-green-300">
              Dashboard
            </Link>

            <Link href="/dashboard/carbon" className="block hover:text-green-300">
              Carbon Intensity
            </Link>

            <Link href="/dashboard/risk" className="block hover:text-green-300">
              Climate Risk Map
            </Link>

            <Link href="/dashboard/sci" className="block hover:text-green-300">
              SCI Calculator
            </Link>

            <Link href="/profile" className="block hover:text-green-300">
              My Profile
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="block w-full rounded bg-gray-700 px-3 py-2 text-left text-white hover:bg-gray-600"
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>

            <button
              type="button"
              onClick={logout}
              className="block w-full pt-4 text-left text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </nav>
        )}
      </aside>
    </div>
  );
}
