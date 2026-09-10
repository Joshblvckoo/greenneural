import type { ReactNode } from "react";
import CollapsibleSidebar from "./CollapsibleSidebar";
import Footer from "./Footer";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <CollapsibleSidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 transition-all duration-300 md:ml-64">
        {children}
        <Footer />
      </main>
    </div>
  );
}
