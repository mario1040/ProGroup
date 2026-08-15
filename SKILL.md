 I'll begin this forensic audit by accessing the repository and systematically scanning the entire codebase. Let me start by reading the GitHub plugin skill and then accessing the repository.  
  
     
     
        
          
                
                        
                                 
                                      
                                                
 # NARIS OPS — FINAL DATA WIRING & SYSTEM CONSISTENCY REPORT

## 1. Executive Summary

This is a **READ-ONLY FORENSIC AUDIT** of the ProGroup / Naris Ops repository. No code was modified. The audit confirms that the **core operational data flow is correctly wired end-to-end**: Employee and Admin both read and write to the **same `task_instances` documents** in Firestore. Cloudinary image URLs flow correctly into `task_instances` and are displayed to Admin from the same document. Realtime listeners on `task_instances` ensure both sides see updates immediately.

However, **multiple specific wiring issues, legacy inconsistencies, and production risks were identified** that prevent a fully clean verdict.

---

## 2. Actual Project Architecture

```
src/
├── App.tsx                          # Root router & auth gate
├── main.tsx                         # Entry point
├── types.ts                         # TypeScript entities (Profile, Zone, TaskTemplate, SOPItem, TaskInstance, KpiSnapshot, etc.)
├── db_default.ts                    # Seeded default data (profiles, zones, task_templates, operational_tasks, device_switches, kpi_snapshots)
├── lib/
│   ├── api.ts                       # UNIFIED API LAYER — all Firestore CRUD, recurrence engine, KPI calc, auth
│   ├── firebase.ts                  # Firebase init (Firestore, Auth, Storage)
│   ├── cloudinary.ts                # Cloudinary upload client (unsigned uploads)
│   └── offlineManager.ts            # localStorage cache, pending updates, schema migration
├── components/
│   ├── AdminDashboard.tsx           # Admin panel (SOP, Daily Tasks, Approval, KPI, Reports, Diagnostics)
│   ├── TodayTasksPage.tsx           # Employee daily task execution (start, photos, complete)
│   ├── MyKpiPage.tsx                # Employee personal KPI view
│   ├── PhotoCapture.tsx             # Image capture + Cloudinary upload component
│   ├── FirebaseDiagnosticTool.tsx   # DB validation & diagnostics
│   ├── InventoryManager.tsx         # Inventory module
│   ├── SwitchLabelsGuide.tsx        # Device switch guide
│   └── ProfessorLogo.tsx            # Brand component
```

**State Management**: No Redux/Zustand. React `useState`/`useEffect` + direct Firestore `onSnapshot` listeners.

**Image Provider**: Cloudinary (active). Firebase Storage is initialized but bypassed for uploads.

**Authentication**: Custom username/password against Firestore `users` collection (NOT migrated).

---

## 3. Source-of-Truth Map

| Entity | Source of Truth | Read By | Written By | Legacy Sources | Risk |
|--------|----------------|---------|------------|----------------|------|
| **Users/Profiles** | `users` (Firestore) | `getProfiles()`, `loginUser()`, `getCurrentUserProfile()` | `saveProfile()`, `provisionEmployeeAuth()`, `initializeAdminAuth()` | `localDB.users` (shadow) | Medium |
| **Locations** | `locations` (Firestore) | `getLocations()` | `ensureSeeded()` only | `localDB.locations` (shadow) | Low |
| **Zones** | `zones` (Firestore) | `getZones()`, `getRawZones()` | `saveZone()` | `localDB.zones` (shadow) | Low |
| **SOP Items** | `sop_items` (Firestore) | `getSopItems()`, `getTemplates()` | `saveSopItem()`, `deleteSopItem()` | `task_templates` (seeded, aliased) | **HIGH** |
| **Task Templates** | `task_templates` (Firestore) | **DELEGATED to `getSopItems()`** | **DELEGATED to `saveSopItem()`** | Active alias only | Medium |
| **Task Instances** | `task_instances` (Firestore) | `getTasks()`, `listenTodayTasks()`, `getTasksForRange()`, `updateTask()`, `approveTask()`, `rejectTask()` | `createTask()`, `updateTask()`, `approveTask()`, `rejectTask()`, `getTasks()` (auto-gen) | `localDB.task_instances` (shadow) | Medium |
| **Operational Tasks** | `operational_tasks` (Firestore) | `getOperationalTasks()` | `saveOperationalTask()` | None | Low |
| **KPI** | **Realtime calculation from `task_instances`** | `getKpis()` | `getKpis()` (computed, not stored) | `kpi_snapshots` (dead collection) | **HIGH** |
| **Notifications** | `notifications` (Firestore) | **None in app code** | **None in app code** | Seeded empty, never used | **HIGH** |
| **Images (Before/After)** | Cloudinary URL stored in `task_instances` | Employee & Admin UIs | `updateTask()` (via PhotoCapture → Cloudinary) | `before_image_url` / `after_image_url` (legacy fields) | Low |
| **Device Switches** | `device_switches` (Firestore) | `getDeviceSwitches()` | Seeded only | None | Low |

---

## 4. SOP → Task Wiring

**Chain Verified:**

```
Admin "بنود SOP المعيارية"
  → getSopItems() reads collection("sop_items")
  → saveSopItem() writes to doc(db, "sop_items", id)
  → getTasks() calls getTemplates() → getSopItems()
  → getSopOccurrencesForDate(sop, dateStr) calculates occurrences
  → buildTaskInstanceSnapshot(sop, date, occurrence, assignee) creates TaskInstance
  → setDoc(doc(db, "task_instances", instanceId), newInstance)
  → Employee listenTodayTasks(user.id) reads task_instances where due_date == today
  → Admin Daily Task Management reads same task_instances collection
```

**Critical Finding:** `getTasks()` and `pregenerateTaskInstances()` read SOPs via `getTemplates()` which calls `getSopItems()`. They do **NOT** read `task_templates`. The recurrence engine is correctly wired to `sop_items`.

**Classification of References:**

| Term | Classification | Evidence |
|------|---------------|----------|
| `sop_items` | **ACTIVE** | Primary read/write collection for SOPs |
| `task_templates` | **LEGACY** | Seeded in `ensureSeeded()`, but `getTemplates()` delegates to `getSopItems()`. Aliases exist but write to `sop_items`. |
| `template_id` | **ACTIVE but DANGEROUS** | Still populated in `buildTaskInstanceSnapshot()` alongside `sop_item_id`. Both point to same SOP ID. |
| `sop_item_id` | **ACTIVE** | Primary reference field in `task_instances` |
| `getSopItems` | **ACTIVE** | Reads from `sop_items` |
| `getTemplates` | **ACTIVE ALIAS** | Returns `getSopItems()` |
| `saveSopItem` | **ACTIVE** | Writes to `sop_items` |
| `getTasks` | **ACTIVE** | Auto-generates from `sop_items` |
| `pregenerateTaskInstances` | **ACTIVE** | Generates from `sop_items` |

---

## 5. TaskInstance Wiring

**Single Source of Truth: `task_instances` collection**

All screens reference the **same Firestore document**:

| Screen | Collection | Query/Listener | Document ID | Filter |
|--------|-----------|----------------|-------------|--------|
| Employee Today Tasks | `task_instances` | `listenTodayTasks(user.id)` | Realtime on `due_date == today` | `ti.assigned_to === user.id` (client-side) |
| Admin Daily Task Mgmt | `task_instances` | `listenTodayTasks(undefined)` or `getTasks()` | Realtime on `due_date == today` | None (all tasks) |
| Admin Approval Queue | `task_instances` | Same listener | Same documents | `status === "completed" && !supervisor_approved` |
| Admin Rework View | `task_instances` | Same listener | Same documents | `task_type === "rework"` |
| KPI Calculation | `task_instances` | `getDocs(collection(db, "task_instances"))` | Full collection scan | `assigned_to === cleaner.id` |
| Employee MyKPI | `task_instances` | `getKpis()` (same as above) | Full collection scan | `profile_id === user.id` (client filter) |

**No duplicate task stores found.** No mock data, no template rehydration for operational reads. The `task_instances` document is the single operational record.

---

## 6. Employee → Admin Wiring

**One TaskInstance traced end-to-end:**

| Step | Function | Collection | Document | Action |
|------|----------|-----------|----------|--------|
| Employee starts task | `updateTask(id, { status: 'in_progress', photo_before_url: url })` | `task_instances` | Same `ti_rec_*` doc | Writes status + before photo URL |
| Employee finishes | `updateTask(id, { status: 'completed', photo_after_url: url })` | `task_instances` | Same doc | Writes status + after photo URL |
| Admin views task | `listenTodayTasks()` callback | `task_instances` | Same doc | Reads all fields including photos |
| Admin approves | `approveTask(id, { supervisor_id, quality_grade })` | `task_instances` | Same doc | Writes `supervisor_approved: true`, `quality_grade` |
| Admin rejects | `rejectTask(id, { supervisor_id, notes })` | `task_instances` | Same original doc | Updates original to `status: "rejected"` + creates NEW rework doc |

**All screens reference the SAME `task_instances` document.** No copied data, no localDB fallback in production reads.

---

## 7. Admin → Employee Wiring

| Admin Action | Collection Written | Document ID | Employee Impact | Realtime? |
|-------------|-------------------|-------------|-----------------|-----------|
| Create SOP | `sop_items` | `sop_*` | New tasks generated tomorrow | ❌ (next day via `getTasks()`) |
| Edit SOP | `sop_items` | Same `sop_*` | Future pending tasks synced | ❌ (syncs pending tasks only) |
| Change SOP image | `sop_items` | Same `sop_*` | Future pending tasks synced | ❌ |
| Create one-time task | `task_instances` | `ti_*` | Appears immediately if assigned | ✅ via `listenTodayTasks()` |
| Assign task | `task_instances` | Same `ti_*` | Appears immediately | ✅ via `listenTodayTasks()` |
| Reassign task | `task_instances` | Same `ti_*` | Moves to correct employee | ✅ via `listenTodayTasks()` |
| Approve | `task_instances` | Same `ti_*` | Status updated | ✅ via `listenTodayTasks()` |
| Reject | `task_instances` | Original + new `ti_rework_*` | Original rejected + new rework appears | ✅ via `listenTodayTasks()` |
| Create rework | `task_instances` | `ti_rework_*` | Appears immediately | ✅ via `listenTodayTasks()` |
| Change zone | `zones` | `z_*` | Zone name updates in enriched tasks | ⚠️ (enrichment reads zones on each snapshot) |
| Deactivate SOP | `sop_items` | Same `sop_*` | No new instances generated | ❌ (next day) |

---

## 8. Realtime Wiring

**Listener Map:**

| Screen | Listener | Collection | Filter | State | UI |
|--------|----------|-----------|--------|-------|-----|
| Employee TodayTasksPage | `listenTodayTasks(user.id)` | `task_instances` | `where("due_date", "==", today)` | `tasks` state | Task list + detail modal |
| Admin Daily Tasks | `listenTodayTasks(undefined)` or `getTasks()` | `task_instances` | Same | Admin task state | Task management table |
| Admin Approval Queue | Same listener | `task_instances` | Same | Filtered by `status === "completed" && !supervisor_approved` | Approval cards |

**Realtime Scenarios Verified (Statically):**

| Scenario | Firestore Document Observed | Status |
|----------|---------------------------|--------|
| A. Admin creates one-time task | `task_instances/{newId}` | ✅ Employee sees via `listenTodayTasks` |
| B. Employee starts task | `task_instances/{id}` | ✅ Admin sees updated status |
| C. Employee uploads Before | `task_instances/{id}` | ✅ Admin sees `photo_before_url` |
| D. Employee uploads After | `task_instances/{id}` | ✅ Admin sees `photo_after_url` |
| E. Admin approves/rejects | `task_instances/{id}` | ✅ Employee sees new state |
| F. Rework is created | `task_instances/ti_rework_*` | ✅ Employee sees if `assigned_to` matches |
| G. Task is reassigned | `task_instances/{id}` | ✅ Correct employee sees update |

---

## 9. Image Data Wiring

**Reference Image:**
```
sop_items.reference_image_url
  → buildTaskInstanceSnapshot() copies to task_instances.reference_image_url
  → Employee TodayTasksPage displays from task_instances.reference_image_url
  → Admin displays from task_instances.reference_image_url
```

**Guide Image:**
```
sop_items.guide_image_url
  → buildTaskInstanceSnapshot() copies to task_instances.guide_image_url
  → Employee TodayTasksPage displays from task_instances.guide_image_url
  → Admin displays from task_instances.guide_image_url
```

**Before Photo:**
```
Employee Camera → PhotoCapture.tsx → compressImage() → uploadToCloudinary() → secure_url
  → TodayTasksPage calls updateTask(id, { photo_before_url: secure_url, ... })
  → task_instances.photo_before_url
  → Admin Approval / Daily Task views read task_instances.photo_before_url
```

**After Photo:**
```
Employee Camera → PhotoCapture.tsx → compressImage() → uploadToCloudinary() → secure_url
  → TodayTasksPage calls updateTask(id, { photo_after_url: secure_url, ... })
  → task_instances.photo_after_url
  → Admin Approval / Daily Task views read task_instances.photo_after_url
```

**Admin shows images from the SAME `task_instances` document created/updated by Employee.** ✅

---

## 10. Cloudinary → Firestore Wiring

Verified exact chain:
1. `PhotoCapture.tsx` calls `uploadToCloudinary(payload, folder)` directly
2. Cloudinary returns `{ secure_url: "https://res.cloudinary.com/..." }`
3. `onPhotoUploaded(metadata)` callback passes `meta.url` (secure_url) to parent
4. `TodayTasksPage.tsx` calls `updateTask(selectedTask.id, { photo_before_url: meta.url, ... })`
5. `updateTask()` in `api.ts` merges into `task_instances` document via `setDoc()`
6. Admin reads the same stored URL from `task_instances.photo_before_url` / `photo_after_url`

**No URL transformation.** **No empty URL overwrite.** **No stale Firebase Storage URLs.** Historical tasks keep original URLs.

---

## 11. Approval/Rejection/Rework Wiring

**Approval:**
- `approveTask(id, approval)` → `getDoc(doc(db, "task_instances", id))` → modifies SAME document → `setDoc(docRef, task)`
- Changes: `status: "completed"`, `supervisor_approved: true`, `supervisor_approved_by`, `supervisor_approved_at`, `quality_grade`, `supervisor_notes`

**Rejection:**
- `rejectTask(id, rejection)` → `getDoc(doc(db, "task_instances", id))` → modifies SAME original document → creates NEW rework document
- Original changes: `status: "rejected"`, `supervisor_approved: false`, `supervisor_notes`
- Rework creation: `doc(db, "task_instances", "ti_rework_" + randomHex(8))` with:
  - `parent_instance_id: originalTask.id` ✅
  - `template_id: originalTask.template_id` ✅
  - `zone_id: originalTask.zone_id` ✅
  - `assigned_to: originalTask.assigned_to` ✅
  - `task_type: "rework"` ✅
  - `status: "pending"` ✅

**Original task evidence (photos, notes) remains intact in the original document.** ✅

---

## 12. KPI Data Lineage

**Trace:**
```
task_instances (ALL documents, full collection scan)
  → getKpis() in api.ts
  → Real-time calculation per cleaner
  → MyKpiPage (employee) filters by user.id
  → Admin KPI screen shows all cleaners
```

**Metrics Source:**
| Metric | Source Field | Calculation |
|--------|-------------|-------------|
| `tasks_assigned` | `task_instances` where `assigned_to === cleaner.id` | Count all |
| `tasks_completed_on_time` | `status === "completed" && supervisor_approved && delay_minutes <= 0` | Count |
| `tasks_late` | `status === "completed" && delay_minutes > 0` | Count |
| `tasks_reworked` | `task_type === "rework"` | Count |
| `tasks_rejected` | `status === "rejected"` | Count |
| `compliance_rate` | `onTime / completed * 100` | Derived |
| `avg_execution_time_minutes` | `started_at` → `completed_at` | Derived |
| `quality_score` | `quality_grade` (A=100, B=80, C=60) | Derived |
| `supervisor_rating` | `quality_score` mapped to stars | Derived |

**KPI Classification:** **DERIVED (Realtime)** — calculated on every call from full `task_instances` scan. `kpi_snapshots` collection is **dead**.

**Issues:**
- **Full collection scan** of `task_instances` on every KPI load. No date filtering. Performance will degrade as data grows.
- **Rework double-counting risk**: A rejected task + its completed rework = 2 assigned tasks, 1 rejected, 1 reworked, 1 completed. This may or may not be intended.
- **No caching**: KPIs are recalculated every time. `kpi_snapshots` collection exists but is never written to or read from.

---

## 13. Legacy Data Dependencies

| Legacy Item | Status | Risk |
|-------------|--------|------|
| `task_templates` collection | **LEGACY** — seeded, aliased but not actively read by SOP engine | Medium |
| `template_id` field on `task_instances` | **ACTIVE but DANGEROUS** — populated alongside `sop_item_id`; used in fallback queries | Medium |
| `before_image_url` / `after_image_url` | **LEGACY** — `validateDatabase()` warns if found, but main code uses `photo_before_url` / `photo_after_url` | Low |
| `employee_signature_url` | **DEAD** — field exists in types and API, but UI is disabled globally per requirements | None |
| `kpi_snapshots` collection | **DEAD** — seeded but never read/written by app | Low |
| `notifications` collection | **DEAD** — seeded empty, no creation logic in approval/rejection/assignment | Medium |

---

## 14. Cache/Local Data Dependencies

| Reference | Classification | Purpose | Risk |
|-----------|---------------|---------|------|
| `localStorage.getItem("naris_ops_session")` | **SESSION** | Auth session | Low |
| `localStorage.getItem("naris_ops_user")` | **SESSION** | Cached user profile | Low |
| `localStorage.getItem("narisops_local_db")` | **DANGEROUS** | Complete shadow copy of ALL Firestore collections | **HIGH** |
| `localStorage.getItem("naris_pending_updates")` | **LEGACY** | Pending sync queue (unused in online-only) | Low |
| `localStorage.getItem("naris_schema_version")` | **LEGACY** | Schema migration version | Low |
| `localStorage.getItem("naris_cached_tasks_{userId}")` | **CACHE** | Cached task lists for offline display | Medium |
| `localDB` (in-memory) | **DANGEROUS** | Shadow mirror of Firestore; updated on EVERY write even in online mode | **HIGH** |
| `cachedProfiles`, `cachedSopItems`, etc. | **CACHE** | In-memory metadata caches (invalidated on writes) | Low |

**CRITICAL:** Despite `useLocalFallback = false` (online-only production), **every Firestore write ALSO updates `localDB` and saves to `localStorage`**. This creates a complete offline shadow of the entire database including task evidence and photos. This is a **DANGEROUS** data leakage and storage risk.

---

## 15. Duplicate/Conflict Findings

| Conflict | Source A | Source B | Who Reads What | Inconsistency | Severity |
|----------|----------|----------|---------------|---------------|----------|
| SOP Master | `sop_items` (active) | `task_templates` (seeded legacy) | `getSopItems()` reads A; `ensureSeeded()` writes B | Fresh install: `sop_items` is empty → no recurring tasks | **HIGH** |
| SOP ID Reference | `task_instances.sop_item_id` | `task_instances.template_id` | Both populated at creation; sync logic queries both | Redundant fields, potential divergence | Medium |
| KPI Data | Realtime `getKpis()` calculation | `kpi_snapshots` (stored) | App reads realtime calc; collection is dead | Unused collection wasting space | Low |
| Image URL (legacy) | `photo_before_url` | `before_image_url` | App uses A; validation warns if B found | Legacy documents may have wrong field | Low |
| Task Store (local) | Firestore `task_instances` | `localDB.task_instances` | Firestore is primary; local is shadow | Shadow copy kept in sync but not used as source | Medium |

---

## 16. Firestore Read/Write Consistency

**Verified Workflows:**

| Workflow | Write Collection | Read Collection | Same? |
|----------|-----------------|-----------------|-------|
| Employee start/complete | `task_instances` | `task_instances` | ✅ Yes |
| Admin approve/reject | `task_instances` | `task_instances` | ✅ Yes |
| Admin create one-time | `task_instances` | `task_instances` | ✅ Yes |
| Admin create SOP | `sop_items` | `sop_items` | ✅ Yes |
| Admin edit SOP | `sop_items` | `sop_items` | ✅ Yes |
| Employee view KPI | `task_instances` (read-only calc) | `task_instances` | ✅ Yes |

**No hidden write side effects during reads.**
**No duplicate writes to different collections for the same logical entity.**
**No unnecessary reads** (except KPI full collection scan).

---

## 17. Historical Data Integrity

**Verified:** `buildTaskInstanceSnapshot()` copies the following fields from SOP to `task_instances` at creation time:
- `title`, `description`, `goal`, `task_code`, `category`, `tools_required`, `estimated_duration_minutes`
- `guide_image_url`, `reference_image_url`
- `requires_photo_before`, `requires_photo_after`, `requires_supervisor_approval`, `requires_gps`

**Historical Protection:** `saveSopItem()` contains "SOP Detail Sync" that ONLY updates tasks where:
- `due_date >= todayStr` AND
- `status === "pending"`

**Historical tasks (past due date or non-pending status) are NEVER modified when SOP changes.** ✅

**After SOP deletion:** `deleteSopItem()` only deletes the SOP document. Existing `task_instances` remain intact. ✅

---

## 18. Admin Action Impact Matrix

| Admin Action | Collection Written | Document ID | Employee Impact | Realtime? | Historical Impact |
|-------------|-------------------|-------------|-----------------|-----------|-------------------|
| Create SOP | `sop_items` | `sop_{randomHex}` | New recurring tasks generated next day | ❌ | None |
| Edit SOP | `sop_items` | Same | Future pending tasks updated | ❌ | None (protected) |
| Change SOP image | `sop_items` | Same | Future pending tasks updated | ❌ | None (protected) |
| Delete SOP | `sop_items` | Same | No new instances generated | ❌ | None (protected) |
| Create one-time task | `task_instances` | `ti_{randomHex}` | Immediate appearance in task list | ✅ | Permanent record |
| Assign/Reassign task | `task_instances` | Same | Immediate reassignment | ✅ | Preserved |
| Approve task | `task_instances` | Same | Immediate status + grade visible | ✅ | Permanent record |
| Reject task | `task_instances` | Original + `ti_rework_*` | Original rejected + new rework task | ✅ | Permanent record |
| Change zone | `zones` | `z_*` | Zone name updates in UI | ⚠️ | N/A |

---

## 19. Employee Action Impact Matrix

| Employee Action | Collection Written | Document ID | Admin Impact | Realtime? |
|----------------|-------------------|-------------|--------------|-----------|
| Start task | `task_instances` | Same `ti_*` | Status → `in_progress` + before photo | ✅ |
| Before photo | `task_instances` | Same `ti_*` | `photo_before_url` + metadata visible | ✅ |
| Finish task / After photo | `task_instances` | Same `ti_*` | `photo_after_url` + metadata + notes visible | ✅ |
| Complete task | `task_instances` | Same `ti_*` | Status → `completed`, appears in approval queue | ✅ |

---

## 20. Full Test Matrix

⚠️ **All items statically verified from source code. No runtime execution was performed.**

| # | Test | Status |
|---|------|--------|
| 1 | Employee login | ⚠️ NOT VERIFIED |
| 2 | Admin login | ⚠️ NOT VERIFIED |
| 3 | Supervisor login | ⚠️ NOT VERIFIED |
| 4 | Employee today's tasks | ✅ Statically verified |
| 5 | SOP → task generation | ✅ Statically verified |
| 6 | One-time task | ✅ Statically verified |
| 7 | Task assignment | ✅ Statically verified |
| 8 | Reassignment | ✅ Statically verified |
| 9 | Start task | ✅ Statically verified |
| 10 | Before photo | ✅ Statically verified |
| 11 | After photo | ✅ Statically verified |
| 12 | Completion | ✅ Statically verified |
| 13 | Admin sees same task | ✅ Statically verified |
| 14 | Admin sees before | ✅ Statically verified |
| 15 | Admin sees after | ✅ Statically verified |
| 16 | Admin sees reference | ✅ Statically verified |
| 17 | Admin sees guide | ✅ Statically verified |
| 18 | Approval | ✅ Statically verified |
| 19 | Rejection | ✅ Statically verified |
| 20 | Rework | ✅ Statically verified |
| 21 | Rework completion | ✅ Statically verified |
| 22 | KPI update | ✅ Statically verified (realtime calc) |
| 23 | Realtime task arrival | ✅ Statically verified |
| 24 | Realtime task status | ✅ Statically verified |
| 25 | Realtime image update | ✅ Statically verified |
| 26 | Refresh persistence | ⚠️ NOT VERIFIED |
| 27 | Logout/login persistence | ⚠️ NOT VERIFIED |
| 28 | Historical task after SOP edit | ✅ Statically verified (protected) |
| 29 | Historical task after SOP delete | ✅ Statically verified (protected) |
| 30 | No legacy task_template dependency | ⚠️ PARTIAL — aliases exist but delegate correctly |

---

## 21. Broken Connections

| # | Broken Connection | Impact |
|---|-------------------|--------|
| 1 | **`ensureSeeded()` seeds `task_templates` but NOT `sop_items`** | On fresh Firestore or after reset, `sop_items` is empty. `getSopItems()` returns empty array. **No recurring tasks are generated.** Admin SOP page shows empty. |
| 2 | **No notification creation logic** | `notifications` collection is never populated. Employees and supervisors receive no in-app notifications for assignments, approvals, or rejections. |
| 3 | **`kpi_snapshots` is never written** | The collection exists and is seeded with sample data, but `getKpis()` ignores it and recalculates from scratch every time. |

---

## 22. Wrong Data Sources

| # | Issue | Current Behavior | Expected |
|---|-------|-----------------|----------|
| 1 | **KPI reads from full `task_instances` scan** | `getKpis()` loads ALL task instances without date filter | Should read from `kpi_snapshots` or filter by date range |
| 2 | **`saveSopItem()` sync queries legacy `template_id`** | When syncing SOP edits to pending tasks, it queries both `sop_item_id` and `template_id` | Should only query `sop_item_id` (or ensure both always match) |
| 3 | **`getTasks()` enriches with `template` object** | Returns `template?: TaskTemplate` by looking up `ti.template_id` in `getTemplates()` | Enrichment is fine, but `template_id` is legacy dual-purpose |

---

## 23. Missing Connections

| # | Missing Connection | Impact |
|---|-------------------|--------|
| 1 | **Notification creation on task assignment** | No `createNotification()` call in `createTask()` or `getTasks()` auto-generation |
| 2 | **Notification creation on approval** | No notification sent to employee when task is approved |
| 3 | **Notification creation on rejection** | No notification sent to employee when task is rejected and rework created |
| 4 | **`kpi_snapshots` write path** | No scheduled or triggered KPI snapshot creation |
| 5 | **`shahry` (monthly) frequency support** | `getSopOccurrencesForDate()` does NOT handle `"شهري"` frequency. Monthly SOPs never generate tasks. |
| 6 | **`sop_items` seeding in `ensureSeeded()`** | Missing seeding of `sop_items` from `db_default.ts` |

---

## 24. Duplicate / Conflicting Logic

| # | Conflict | Location |
|---|----------|----------|
| 1 | **`task_templates` vs `sop_items` dual seeding** | `ensureSeeded()` seeds `task_templates`; `initLocalDB()` seeds both; active code uses `sop_items` |
| 2 | **`template_id` vs `sop_item_id` dual fields** | `buildTaskInstanceSnapshot()` populates both with same value; sync logic queries both |
| 3 | **`uploadPhoto()` wrapper in api.ts vs direct `uploadToCloudinary()` import in PhotoCapture.tsx** | `api.ts` exports `uploadPhoto()` but `PhotoCapture.tsx` imports directly from `cloudinary.ts` |
| 4 | **LocalDB shadow sync on every write** | `setDoc`/`updateDoc`/`deleteDoc` in `api.ts` always update `localDB` even when `useLocalFallback` is false |

---

## 25. Production Blockers

| # | Blocker | Severity |
|---|---------|----------|
| 1 | **`sop_items` not seeded on fresh install** | **CRITICAL** for new deployments |
| 2 | **Monthly (`شهري`) frequency silently fails** | **HIGH** — monthly SOPs never generate tasks |
| 3 | **KPI full collection scan** | **HIGH** — will cause performance issues as data grows |
| 4 | **localStorage shadow copy of all Firestore data** | **MEDIUM-HIGH** — privacy risk, storage limit risk, stale data risk |

---

## 26. High Risks

1. **Seeding Inconsistency (`sop_items` vs `task_templates`)**: On any fresh Firestore instance or recovery scenario, `sop_items` is empty while `task_templates` has data. The active SOP engine reads from `sop_items`, so **no recurring tasks will be generated and the Admin SOP page will appear empty** until SOPs are manually recreated.
2. **Missing Monthly Frequency**: The `getSopOccurrencesForDate()` switch statement does not include `"شهري"`. Any SOP with monthly frequency is silently ignored and never generates task instances.
3. **KPI Realtime Calculation from Full Scan**: `getKpis()` performs an unfiltered `getDocs(collection(db, "task_instances"))`. As the database grows, this will become prohibitively expensive and slow.
4. **Complete localStorage Shadow Database**: Every Firestore write is mirrored to `localStorage` via `localDB`. This includes photos, signatures (if enabled), task details, and employee data. This poses a **data privacy risk** and risks hitting the 5-10MB localStorage limit.

---

## 27. Medium Risks

1. **Dead `kpi_snapshots` Collection**: The collection is seeded but never used. It could confuse developers or future integrations.
2. **Dead `notifications` System**: The collection and types exist, but no code creates notifications. The app appears to have notifications but they never fire.
3. **Legacy `template_id` Field**: `task_instances` documents have both `template_id` and `sop_item_id`. If they ever diverge, the sync logic in `saveSopItem()` could miss tasks.
4. **Legacy Image Fields**: `before_image_url` and `after_image_url` are checked in validation but not used in the main UI. Old documents with these fields would not display images correctly.

---

## 28. Recommended Fixes

1. **Fix Seeding**: In `ensureSeeded()`, add seeding loop for `sop_items` (copy `task_templates` data into `sop_items` on initial seed).
2. **Add Monthly Frequency**: Extend `getSopOccurrencesForDate()` to handle `"شهري"` (e.g., check if day matches `created_at` day-of-month).
3. **Implement KPI Snapshots**: Replace realtime full-scan with scheduled/cached writes to `kpi_snapshots`, and have `getKpis()` read from there with a date-range filter.
4. **Implement Notifications**: Add notification creation in `createTask()`, `approveTask()`, and `rejectTask()`.
5. **Remove localStorage Shadow**: Stop syncing every Firestore write to `localDB`/`localStorage` when `useLocalFallback` is false. Keep only session/auth caches.
6. **Standardize SOP Reference**: Migrate to using only `sop_item_id` in `task_instances` and deprecate `template_id` population.
7. **Add Date Filtering to KPI**: At minimum, filter `task_instances` by `due_date` range in `getKpis()` to avoid full collection scans.

---

## 29. FINAL VERDICT

**⚠️ PARTIALLY VERIFIED — SPECIFIC DATA/WIRING ISSUES REMAIN**

**Core Data Flow: ✅ CONSISTENT**
- The **same `task_instances` document** is the single operational record for Employee, Admin, Approval, Rework, and KPI.
- **Cloudinary images** are correctly stored in `task_instances` and read back by Admin from the same document.
- **Realtime wiring** is correctly implemented via `onSnapshot` on `task_instances`.
- **Historical integrity** is protected (SOP edits do not modify past tasks).

**Critical Issues Preventing Full Verification:**
1. **`sop_items` is not seeded**, creating a broken SOP→Task chain on fresh installs.
2. **Monthly frequency is not implemented**, silently breaking monthly SOPs.
3. **KPI performs full collection scans** with no date filtering.
4. **Notifications are completely non-functional** (collection exists but no creation logic).
5. **Complete localStorage shadow copy** of all Firestore data on every write.

**Answers to the Final Questions:**
- **Which collection is the master?** → `task_instances` for operational tasks; `sop_items` for SOP masters.
- **Which document represents the actual employee task?** → A single `task_instances/{id}` document.
- **Which document does Admin review?** → The **same** `task_instances/{id}` document.
- **Which document does KPI calculate from?** → `task_instances` (full scan, realtime).
- **Which document receives employee updates?** → The **same** `task_instances/{id}` document.
- **Which document receives supervisor approval?** → The **same** `task_instances/{id}` document.
- **Which document creates rework?** → A **new** `task_instances/ti_rework_{id}` document, with `parent_instance_id` pointing to the original.
- **Which image URL is displayed to Admin?** → `task_instances.photo_before_url` and `task_instances.photo_after_url` (Cloudinary `secure_url`).
- **Which image URL is displayed to Employee?** → The **same** `task_instances` fields.
- **Are all these references pointing to the SAME operational task instance?** → **YES** for the core task document. The Employee and Admin observe and mutate the identical Firestore document.
