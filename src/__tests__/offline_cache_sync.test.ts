import { describe, it, expect, beforeEach } from "vitest";
import {
  queuePendingMutation,
  getPendingMutations,
  getPendingMutationsCount,
  clearAllPendingMutations,
  executePendingSync
} from "../lib/offlineManager";
import { setFirestoreQuotaExceeded } from "../lib/quotaManager";

describe("Naris Ops Resilient Cache & Offline Deduplication Suite", () => {
  beforeEach(() => {
    clearAllPendingMutations();
    setFirestoreQuotaExceeded(false);
  });

  it("TEST 1: Queueing a mutation adds it safely to the pending queue", () => {
    expect(getPendingMutationsCount()).toBe(0);

    const mutation = queuePendingMutation(
      "task_instances",
      "ti_101",
      "set",
      { id: "ti_101", title: "تنظيف الصالة", status: "in_progress" }
    );

    expect(mutation.id).toBe("mut_task_instances_ti_101");
    expect(getPendingMutationsCount()).toBe(1);
    expect(getPendingMutations()[0].data.title).toBe("تنظيف الصالة");
  });

  it("TEST 2: Updating the same document multiple times merges into 1 mutation without duplication", () => {
    // 1. Cleaner starts task
    queuePendingMutation(
      "task_instances",
      "ti_101",
      "set",
      { id: "ti_101", title: "تنظيف الصالة", status: "in_progress", photo_before_url: "url1" }
    );
    expect(getPendingMutationsCount()).toBe(1);

    // 2. Cleaner checks a box or takes after photo
    queuePendingMutation(
      "task_instances",
      "ti_101",
      "update",
      { photo_after_url: "url2", employee_notes: "تم الانتهاء بنجاح" }
    );
    // Count MUST remain 1!
    expect(getPendingMutationsCount()).toBe(1);

    // 3. Cleaner marks task completed
    queuePendingMutation(
      "task_instances",
      "ti_101",
      "update",
      { status: "completed", completed_at: "2026-09-27T10:00:00Z" }
    );
    expect(getPendingMutationsCount()).toBe(1);

    const merged = getPendingMutations()[0];
    expect(merged.data.id).toBe("ti_101");
    expect(merged.data.photo_before_url).toBe("url1");
    expect(merged.data.photo_after_url).toBe("url2");
    expect(merged.data.employee_notes).toBe("تم الانتهاء بنجاح");
    expect(merged.data.status).toBe("completed");
  });

  it("TEST 3: Different documents create distinct pending queue entries", () => {
    queuePendingMutation("task_instances", "ti_1", "set", { id: "ti_1" });
    queuePendingMutation("task_instances", "ti_2", "set", { id: "ti_2" });
    queuePendingMutation("zones", "z_1", "set", { id: "z_1" });

    expect(getPendingMutationsCount()).toBe(3);
  });

  it("TEST 4: executePendingSync successfully commits mutations and cleans queue", async () => {
    queuePendingMutation("task_instances", "ti_1", "set", { id: "ti_1" });
    queuePendingMutation("task_instances", "ti_2", "set", { id: "ti_2" });
    expect(getPendingMutationsCount()).toBe(2);

    const syncedDocs: string[] = [];
    const result = await executePendingSync(async (mut) => {
      syncedDocs.push(mut.docId);
      return true; // Simulate successful cloud commit
    });

    expect(result.successCount).toBe(2);
    expect(result.remainingCount).toBe(0);
    expect(getPendingMutationsCount()).toBe(0);
    expect(syncedDocs).toEqual(["ti_1", "ti_2"]);
  });

  it("TEST 5: executePendingSync stops and preserves queue if cloud returns quota/network error", async () => {
    queuePendingMutation("task_instances", "ti_1", "set", { id: "ti_1" });
    queuePendingMutation("task_instances", "ti_2", "set", { id: "ti_2" });

    let callCount = 0;
    const result = await executePendingSync(async () => {
      callCount++;
      if (callCount === 1) return true; // first succeeds
      return false; // second fails (e.g. quota exhausted)
    });

    expect(result.successCount).toBe(1);
    expect(result.remainingCount).toBe(1);
    expect(getPendingMutationsCount()).toBe(1);
    expect(getPendingMutations()[0].docId).toBe("ti_2");
  });

  it("TEST 6: Offline photo payload caching maintains task integrity without dropping updates", () => {
    // Cleaner captures before photo offline as compressed base64
    queuePendingMutation("task_instances", "ti_300", "update", {
      photo_before_url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQE...",
      status: "in_progress"
    });

    // Cleaner checks checklist and adds after photo offline
    queuePendingMutation("task_instances", "ti_300", "update", {
      photo_after_url: "data:image/jpeg;base64,/9j/4AFTER...",
      status: "completed",
      completed_at: "2026-09-27T12:00:00Z"
    });

    expect(getPendingMutationsCount()).toBe(1);
    const item = getPendingMutations()[0];
    expect(item.data.photo_before_url).toBe("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQE...");
    expect(item.data.photo_after_url).toBe("data:image/jpeg;base64,/9j/4AFTER...");
    expect(item.data.status).toBe("completed");
  });

  it("TEST 7: Deterministic ID prevents duplicate tasks and duplicate mutations", () => {
    // Rapid duplicate submission (e.g. double-tapping or multiple offline triggers)
    queuePendingMutation("task_instances", "ti_deterministic_1", "set", { id: "ti_deterministic_1", step: 1 });
    queuePendingMutation("task_instances", "ti_deterministic_1", "set", { id: "ti_deterministic_1", step: 2 });
    queuePendingMutation("task_instances", "ti_deterministic_1", "update", { step: 3 });

    // Should only have 1 entry in the queue
    expect(getPendingMutationsCount()).toBe(1);
    expect(getPendingMutations()[0].id).toBe("mut_task_instances_ti_deterministic_1");
    expect(getPendingMutations()[0].data.step).toBe(3);
  });
});
