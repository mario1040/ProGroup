import { useState } from "react";
import type { ReactNode } from "react";
import type { Profile } from "../../../types";
import type { AdminDashboardModel } from "../hooks/useAdminDashboard";
import FirestoreQuotaBanner from "../../FirestoreQuotaBanner";
import AdminTopbar from "./AdminTopbar";
import AdminSidebar from "./AdminSidebar";
import ToastContainer from "../components/common/ToastContainer";

type AdminLayoutProps = {
  user: Profile;
  onLogout: () => void;
  dashboard: AdminDashboardModel;
  children: ReactNode;
  overlays?: ReactNode;
};

export default function AdminLayout({ user, onLogout, dashboard, children, overlays }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tab: Parameters<typeof dashboard.setActiveTab>[0]) => {
    dashboard.setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-shell min-h-screen bg-slate-50 flex flex-col font-sans text-right">
      <div className="admin-shell-orb admin-shell-orb-one" />
      <div className="admin-shell-orb admin-shell-orb-two" />
      <FirestoreQuotaBanner onRetry={dashboard.loadAllData} />
      <ToastContainer toast={dashboard.toast} />
      <AdminTopbar
        user={user}
        selectedDate={dashboard.selectedDate}
        onDateChange={dashboard.setSelectedDate}
        onLogout={onLogout}
        onMenuToggle={() => setSidebarOpen((isOpen) => !isOpen)}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col md:flex-row">
        <button
          type="button"
          aria-label="إغلاق القائمة الجانبية"
          aria-hidden={!sidebarOpen}
          onClick={() => setSidebarOpen(false)}
          className={`admin-sidebar-backdrop no-print md:hidden ${sidebarOpen ? "is-visible" : "pointer-events-none opacity-0"}`}
        />
        <AdminSidebar
          activeTab={dashboard.activeTab}
          pendingApprovalCount={dashboard.statsPendingApproval}
          onTabChange={handleTabChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="relative min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-7">
          <div className="admin-content-frame">
            {dashboard.loading ? (
              <div className="flex min-h-[28rem] flex-col items-center justify-center gap-4 text-slate-400">
                <div className="admin-loading-ring" />
                <span className="text-sm font-semibold">جاري جلب البيانات من الخادم وتحديث الأداء...</span>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
      {overlays}
    </div>
  );
}
