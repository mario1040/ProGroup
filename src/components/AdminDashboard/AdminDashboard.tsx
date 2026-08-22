import type { Profile } from "../../types";
import "./styles/AdminDashboard.css";
import AdminLayout from "./layout/AdminLayout";
import AdminModals from "./components/modals/AdminModals";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import OverviewPage from "./pages/OverviewPage";
import TasksPage from "./pages/TasksPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import KpisPage from "./pages/KpisPage";
import SopPage from "./pages/SopPage";
import OperationalPage from "./pages/OperationalPage";
import EmployeesPage from "./pages/EmployeesPage";
import ReportsPage from "./pages/ReportsPage";
import InventoryPage from "./pages/InventoryPage";
import SwitchLabelsPage from "./pages/SwitchLabelsPage";

export interface AdminDashboardProps {
  user: Profile;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const dashboard = useAdminDashboard({ user });

  return (
    <AdminLayout
      user={user}
      onLogout={onLogout}
      dashboard={dashboard}
      overlays={<AdminModals dashboard={dashboard} />}
    >
      {dashboard.activeTab === "overview" && <OverviewPage dashboard={dashboard} />}
      {dashboard.activeTab === "tasks" && <TasksPage dashboard={dashboard} />}
      {dashboard.activeTab === "approvals" && <ApprovalsPage dashboard={dashboard} />}
      {dashboard.activeTab === "kpis" && <KpisPage dashboard={dashboard} />}
      {dashboard.activeTab === "sop" && <SopPage dashboard={dashboard} />}
      {dashboard.activeTab === "operational" && <OperationalPage dashboard={dashboard} />}
      {dashboard.activeTab === "employees" && <EmployeesPage dashboard={dashboard} />}
      {dashboard.activeTab === "inventory" && <InventoryPage dashboard={dashboard} />}
      {dashboard.activeTab === "reports" && <ReportsPage dashboard={dashboard} />}
      {dashboard.activeTab === "switch_labels" && <SwitchLabelsPage dashboard={dashboard} />}
    </AdminLayout>
  );
}
