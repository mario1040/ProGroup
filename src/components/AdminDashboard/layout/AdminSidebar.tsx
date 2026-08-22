import { Activity, ArrowLeft, CircleHelp, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { getAdminNavigation } from "../config/navigation";
import type { AdminTab } from "../config/navigation";

type AdminSidebarProps = {
  activeTab: AdminTab;
  pendingApprovalCount: number;
  onTabChange: (tab: AdminTab) => void;
  isOpen: boolean;
  onClose: () => void;
};

const primaryTabs: AdminTab[] = ["overview", "tasks", "approvals", "kpis"];
const operationsTabs: AdminTab[] = ["sop", "operational", "inventory"];
const managementTabs: AdminTab[] = ["employees", "reports", "switch_labels"];

function NavigationGroup({
  title,
  tabs,
  items,
  activeTab,
  onTabChange,
}: {
  title: string;
  tabs: AdminTab[];
  items: ReturnType<typeof getAdminNavigation>;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{title}</div>
      <div className="space-y-1">
        {items.filter((item) => tabs.includes(item.id)).map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`admin-nav-item group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl px-3 py-3 text-right text-[11px] font-extrabold transition-all duration-200 ${
                isSelected ? "admin-nav-item-active" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span className="admin-nav-glow" />
              <span className="relative z-10 flex min-w-0 items-center gap-3">
                <span className={`admin-nav-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${isSelected ? "bg-white/15 text-white" : "bg-white/[0.045] text-slate-500 group-hover:bg-white/[0.08] group-hover:text-slate-200"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{item.label}</span>
              </span>
              <span className="relative z-10 flex items-center gap-1.5">
                {item.id === "approvals" && <ShieldCheck className={`h-3.5 w-3.5 ${isSelected ? "text-indigo-200" : "text-slate-600"}`} />}
                {item.badge && item.badge > 0 ? (
                  <span className="admin-nav-badge inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-lg shadow-rose-900/30">
                    {item.badge}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminSidebar({ activeTab, pendingApprovalCount, onTabChange, isOpen, onClose }: AdminSidebarProps) {
  const navigation = getAdminNavigation(pendingApprovalCount);

  return (
    <aside className={`admin-sidebar no-print ${isOpen ? "is-open" : ""}`} aria-label="القائمة الجانبية للإدارة">
      <div className="admin-sidebar-inner flex min-h-full flex-col">
        <div className="mb-7 flex items-center justify-between px-2 md:hidden">
          <div className="flex items-center gap-2 text-white">
            <Activity className="h-4 w-4 text-indigo-300" />
            <span className="text-xs font-black">قائمة الإدارة</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="إغلاق القائمة">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="admin-sidebar-scroll flex-1 overflow-y-auto px-3 py-5 sm:px-4 md:px-0 md:py-6">
          <div className="admin-sidebar-intro mb-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-[10px] font-black text-indigo-200"><Sparkles className="h-3.5 w-3.5" /> مساحة التحكم</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
            </div>
            <p className="text-[11px] font-extrabold leading-6 text-white">كل تفاصيل التشغيل،<br /><span className="text-indigo-200">في مكان واحد.</span></p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-gradient-to-l from-indigo-400 to-cyan-300" /></div>
          </div>

          <NavigationGroup title="نظرة تشغيلية" tabs={primaryTabs} items={navigation} activeTab={activeTab} onTabChange={onTabChange} />
          <NavigationGroup title="التشغيل والجودة" tabs={operationsTabs} items={navigation} activeTab={activeTab} onTabChange={onTabChange} />
          <NavigationGroup title="الإدارة والتقارير" tabs={managementTabs} items={navigation} activeTab={activeTab} onTabChange={onTabChange} />
        </div>

        <div className="border-t border-white/[0.08] p-3 sm:p-4">
          <div className="admin-sidebar-footer flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-sm shadow-lg shadow-orange-950/25">👑</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] font-black text-white">مدير العمليات</div>
              <div className="mt-0.5 truncate text-[9px] font-semibold text-slate-500">Naris Clean Ops v1.4</div>
            </div>
            <CircleHelp className="h-4 w-4 shrink-0 text-slate-600" />
          </div>
        </div>
      </div>
    </aside>
  );
}
