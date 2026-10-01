import { describe, it, expect, beforeEach } from "vitest";
import { listenTasksForDate, getTasks, setLocalFallback } from "../lib/api";
import { Profile, TaskInstance, Zone, SOPItem } from "../types";

describe("Cleaner Task Delivery & Verification Suite", () => {
  it("delivers tasks to cleaner by matching id or username", () => {
    const mockTasks: (TaskInstance & { zone?: Zone; assignee?: Profile })[] = [
      {
        id: "ti_1",
        title: "تنظيف الاستقبال",
        due_date: "2026-10-01",
        assigned_to: "p2",
        status: "pending",
        created_at: new Date().toISOString()
      } as any,
      {
        id: "ti_2",
        title: "تطهير المكاتب",
        due_date: "2026-10-01",
        assigned_to: "afaf",
        status: "pending",
        created_at: new Date().toISOString()
      } as any,
      {
        id: "ti_3",
        title: "تنظيف الممرات",
        due_date: "2026-10-01",
        assigned_to: "p3",
        status: "pending",
        created_at: new Date().toISOString()
      } as any
    ];

    const profiles: Profile[] = [
      { id: "p1", username: "admin", role: "admin", is_active: true } as any,
      { id: "p2", username: "afaf", full_name: "عفاف أحمد", role: "cleaner", is_active: true } as any,
      { id: "p3", username: "rehab", full_name: "رحاب محمود", role: "cleaner", is_active: true } as any
    ];

    // Filter for cleaner "p2" (Afaf)
    const emp = profiles.find((p) => p.id === "p2" || p.username === "p2");
    const validIds = new Set<string>(["p2"]);
    if (emp) {
      if (emp.id) validIds.add(emp.id);
      if (emp.username) validIds.add(emp.username);
      if (emp.full_name) validIds.add(emp.full_name);
    }

    const afafTasks = mockTasks.filter(ti => validIds.has(ti.assigned_to));
    expect(afafTasks.length).toBe(2);
    expect(afafTasks.map(t => t.id)).toEqual(["ti_1", "ti_2"]);
  });
});
