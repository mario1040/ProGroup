import type { LucideIcon } from "lucide-react";
import {
  BarChart2,
  BookOpen,
  Box,
  Calendar,
  Grid,
  Lightbulb,
  List,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export type AdminTab =
  | "overview"
  | "tasks"
  | "approvals"
  | "kpis"
  | "sop"
  | "operational"
  | "employees"
  | "reports"
  | "inventory"
  | "switch_labels";

export type NavigationItem = {
  id: AdminTab;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

export function getAdminNavigation(pendingApprovalCount: number): NavigationItem[] {
  return [
    { id: "overview", label: "اللوحة العامة والتحليلات", icon: Grid },
    { id: "tasks", label: "لوحة إدارة المهام اليومية", icon: List },
    { id: "approvals", label: "طابور الاعتماد والتدقيق", icon: ShieldCheck, badge: pendingApprovalCount },
    { id: "kpis", label: "تحليلات الأداء ومؤشرات KPI", icon: BarChart2 },
    { id: "sop", label: "أدلة الجودة وبنود SOP المعيارية", icon: Settings },
    { id: "operational", label: "تشغيل الإضاءة والأجهزة", icon: Lightbulb },
    { id: "inventory", label: "إدارة المخزون والمعدات", icon: Box },
    { id: "employees", label: "إدارة الموظفين وكلمات المرور", icon: Users },
    { id: "reports", label: "التقارير الشهرية والأرشيف", icon: Calendar },
    { id: "switch_labels", label: "دليل مفاتيح الإضاءة 💡", icon: BookOpen },
  ];
}
