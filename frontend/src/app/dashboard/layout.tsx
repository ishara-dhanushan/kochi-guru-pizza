// src/app/dashboard/layout.tsx
import DashboardGuard from "./components/DashboardGuard";
import DashboardSidebar from "./components/DashboardSidebar";

export const metadata = {
  title: "Dashboard - Kochi Guru Pizza",
  description: "Admin & Staff Dashboard"
};

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardGuard>
      <div className="flex min-h-screen bg-surface">
        <DashboardSidebar />
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 lg:pt-0 pt-14">
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardGuard>
  );
}
