import { type ReactNode, useState } from "react";
import CollapsibleSidebar from "./CollapsibleSidebar";
import Footer from "./Footer";
import { Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--gn-bg)" }}>
      <CollapsibleSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <main
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out`}
      >
        <div className="flex-1 p-6 md:p-8">
          {/* Hamburger for mobile */}
          <div className="md:hidden mb-4">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setIsMobileOpen(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "var(--gn-surface)",
                border: "1px solid var(--gn-border)",
              }}
            >
              <Menu size={19} className="text-emerald-400" />
            </button>
          </div>
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}