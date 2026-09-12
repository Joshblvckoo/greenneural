import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "@/lib/Theme";
import { supabase } from "@/lib/supabaseClient";
import {
  LayoutDashboard,
  Zap,
  Map,
  Calculator,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Leaf,
  ChevronLeft,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/carbon", label: "Carbon Intensity", icon: Zap },
  { href: "/dashboard/risk", label: "Climate Risk Map", icon: Map },
  { href: "/dashboard/sci", label: "SCI Calculator", icon: Calculator },
  { href: "/profile", label: "My Profile", icon: User },
];

interface Props {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}

export default function CollapsibleSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: Props) {
  const router = useRouter();
  const { darkMode, toggleTheme } = useTheme();

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  const logout = async () => {
    await supabase.auth.signOut();
    await router.push("/auth");
  };

  const isActive = (href: string) => router.pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div
        className={`flex items-center gap-2.5 mb-8 ${
          isCollapsed ? "justify-center" : ""
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <Leaf size={16} className="text-emerald-400" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="font-bold text-base gn-gradient-text tracking-tight"
            >
              GreenNeural
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="space-y-1 pt-4 border-t border-emerald-500/10 mt-4">
        <ThemeToggle
          isCollapsed={isCollapsed}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />
        <NavButton
          href="#"
          label="Sign Out"
          icon={LogOut}
          active={false}
          isCollapsed={isCollapsed}
          onClick={logout}
          isDanger
        />
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile overlay ────────────────────────────── */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Mobile drawer ─────────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 p-5 md:hidden transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--gn-surface-deep)",
          borderRight: "1px solid var(--gn-border-light)",
        }}
      >
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMobileOpen(false)}
          className="absolute right-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center text-emerald-400/60 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
        >
          <X size={17} />
        </button>
        <SidebarContent />
      </aside>

      {/* ── Desktop sidebar ───────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 flex-shrink-0 p-5 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
        style={{
          background: "var(--gn-surface-deep)",
          borderRight: "1px solid var(--gn-border-light)",
        }}
      >
        <SidebarContent />

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-colors hover:border-emerald-400"
          style={{
            background: "var(--gn-surface-deep)",
            border: "1px solid var(--gn-border)",
          }}
        >
          <ChevronLeft
            size={13}
            className={`text-emerald-400 transition-transform ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </aside>
    </>
  );
}

// Sub-components for clarity

const NavButton = ({
  href,
  label,
  icon: Icon,
  active,
  isCollapsed,
  isDanger,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  isCollapsed: boolean;
  isDanger?: boolean;
  onClick?: () => void;
}) => {
  const commonClasses = `flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${isCollapsed ? "justify-center" : ""}`;

  const activeClasses = "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shadow-sm";
  const inactiveClasses = isDanger
    ? "text-red-400/70 hover:text-red-300 hover:bg-red-500/08"
    : "text-emerald-100/60 hover:text-emerald-100 hover:bg-emerald-500/10";

  const iconClasses = `shrink-0 transition-colors ${active ? "text-emerald-400" : isDanger ? "" : "text-emerald-500/60 group-hover:text-emerald-400"}`;

  const content = (
    <>
      {active && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-r-full"
        />
      )}
      <Icon size={18} className={iconClasses} />
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );

  if (href === "#") {
    return (
      <button
        type="button"
        onClick={onClick}
        title={isCollapsed ? label : undefined}
        className={`${commonClasses} ${inactiveClasses}`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      title={isCollapsed ? label : undefined}
      className={`${commonClasses} ${active ? activeClasses : inactiveClasses}`}
    >
      {content}
    </Link>
  );
};

const ThemeToggle = ({
  isCollapsed,
  darkMode,
  toggleTheme,
}: {
  isCollapsed: boolean;
  darkMode: boolean;
  toggleTheme: () => void;
}) => (
  <button
    type="button"
    onClick={toggleTheme}
    title={isCollapsed ? (darkMode ? "Light Mode" : "Dark Mode") : undefined}
    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-100/60 hover:text-emerald-100 hover:bg-emerald-500/10 transition-all duration-200 ${isCollapsed ? "justify-center" : ""}`}
  >
    <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={darkMode ? "moon" : "sun"}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {darkMode ? (
            <Sun size={17} className="text-emerald-500/60" />
          ) : (
            <Moon size={17} className="text-emerald-500/60" />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
    <AnimatePresence>
      {!isCollapsed && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </motion.span>
      )}
    </AnimatePresence>
  </button>
);