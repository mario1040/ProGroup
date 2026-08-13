---
name: naris-ops-progroup
description: Working knowledge of the ProGroup repo (github.com/mario1040/ProGroup) — the Naris Ops / "Professor" cleaning-operations management system. Use whenever editing code in this repo, discussing its Firestore schema, task lifecycle, RBAC roles, or photo-upload pipeline, or when asked to add features to Naris Ops / Professor / ProGroup. Covers collection shapes, the task_instance state machine, the CORS/Base64 photo fallback, and the api.ts data-access layer so changes stay consistent with the existing architecture.
---

# ProGroup / Naris Ops

Repo: `mario1040/ProGroup` (deployed at `pro-group-beta.vercel.app`). Scaffolded from
`google-gemini/aistudio-repository-template`, so it also runs inside Google AI Studio /
Cloud Run (hence `GEMINI_API_KEY` and `APP_URL` in `.env.example`).

This is the **Naris Ops** system (brand name "Professor"): a Firebase-backed app for
managing daily cleaning/operations tasks, supervisor quality review, and staff KPIs.
Three roles use it — `admin`, `supervisor`, `cleaner` — each with a different view of
the same Firestore data.

The full data model lives in `DATABASE_DOCUMENTATION.md` at the repo root (written in
Arabic) — read it before making schema changes; this file summarizes it in English for
quick reference. If the two ever disagree, trust `DATABASE_DOCUMENTATION.md` and update
this file to match.

## Stack

- React 19 + TypeScript, built with Vite 6
- Tailwind CSS 4 (`@tailwindcss/vite`)
- Firebase 12 (Firestore + Storage) as the backend — no separate API server for data
- `express` present as a devDependency, used for local/Cloud Run hosting glue, not a REST API layer
- `recharts` for KPI dashboards, `jspdf` + `jspdf-autotable` + `html2canvas` for exporting reports, `lucide-react` for icons, `motion` for animation
- Scripts: `npm run dev` (Vite on port 3000), `npm run build`, `npm run lint` (`tsc --noEmit` — no test suite)
- All Firestore reads/writes are centralized in **`/src/lib/api.ts`** — don't call `firestore` directly from components; add/extend functions there instead

## Firestore collections

9 top-level collections. Key fields only — see `DATABASE_DOCUMENTATION.md` for the full field tables.

| Collection | Purpose | Key fields |
|---|---|---|
| `users` | Staff accounts (`p_` prefixed ids) | `role` (`admin`\|`supervisor`\|`cleaner`), `shift_start/end`, `work_days`, `is_active` |
| `locations` | Physical branches/HQs | `name`, `address` |
| `zones` | Sub-areas of a location (`z_` prefixed) | `location_id`, `responsible_employee_id`, `sort_order` |
| `task_templates` | Reusable SOP definitions (`t_` prefixed) | `zone_id`, `frequency`, `recurrence_days`, `requires_photo_before/after`, `requires_supervisor_approval`, `default_assignee_id` |
| `task_instances` | The live, per-day task documents (`ti_` prefixed) | `template_id`, `zone_id`, `assigned_to`, `assigned_by`, `task_type` (`recurring`\|`one_time`\|`rework`), `status`, `parent_instance_id` (for rework chains), `photo_before_url`, `photo_after_url`, `supervisor_approved`, `quality_grade` |
| `operational_tasks` | Recurring equipment schedules (A/C, lighting, etc.) | `zone_id`, `schedule_windows`, `switch_codes` |
| `notifications` | Per-user alerts | `recipient_id`, `type`, `related_task_instance_id`, `is_read` |
| `device_switches` | Electrical panel switch registry | `code`, `zone_id`, `panel_location` |
| `kpi_snapshots` | Precomputed performance rollups | `profile_id`, `period_type` (`daily`\|`weekly`\|`monthly`), `compliance_rate`, `quality_score`, `supervisor_rating` |

### Relationships worth remembering
- `zones.location_id → locations` (one-to-many)
- `task_templates.zone_id → zones`, `task_instances.template_id → task_templates`
- `task_instances.zone_id → zones`, `.assigned_to → users`, `.assigned_by → users`, `.supervisor_approved_by → users`
- `task_instances.parent_instance_id → task_instances` (self-reference, used only for `rework` tasks pointing back at the rejected original)
- `kpi_snapshots.profile_id → users`, `notifications.recipient_id → users`

## Task lifecycle (`task_instances.status`)

```
pending → in_progress → completed → (supervisor reviews)
                                        ├─ approve → supervisor_approved: true, feeds kpi_snapshots
                                        └─ reject  → status: rejected → auto-creates a new
                                                       task_instance (task_type: 'rework',
                                                       id prefixed ti_rework_, parent_instance_id
                                                       set to the rejected task) → back to pending
```

Also: `late` (due_time passed without completion, computed client/server-side, feeds
compliance metrics) and `escalated` (long overdue, triggers a manager notification) —
these are set automatically, not by a user action.

State transitions and who's allowed to trigger them:
- `pending → in_progress`: the assigned cleaner, on "Start" — captures `photo_before_url` if `requires_photo_before`, sets `started_at`
- `in_progress → completed`: the assigned cleaner, on "Submit" — captures `photo_after_url` + `photo_after_taken_at`, optional `employee_signature_url`, sets `completed_at` and computes `delay_minutes` against `due_time`
- `completed → (approved|rejected)`: a supervisor only — approve sets `quality_grade` (`A`/`B`/`C`) and `supervisor_notes`; reject spawns the rework task described above

When adding a new status or transition, update both the `task_instances` write path in
`api.ts` (`updateTask`/`approveTask`/`rejectTask`) and the state table in
`DATABASE_DOCUMENTATION.md`.

## Photo upload pipeline

Photos are compressed client-side before upload: resized to max 800×800px, JPEG quality
~60%, target under ~30KB.

Two storage paths, chosen automatically:
1. **Normal path**: upload to Firebase Storage at `task-photos/{zone_id}/{task_instance_id}/before.jpg` (or `after.jpg`), then store the resulting `downloadUrl` in `photo_before_url`/`photo_after_url`.
2. **CORS self-healing fallback**: if Storage upload fails or errors out (common in `ai.studio` / `localhost` preview environments due to CORS), the compressed image is stored **inline as a Base64 data URL** directly in the same Firestore field instead. This is intentional, not a bug — the aggressive compression keeps it well under Firestore's 1MB document cap.

When touching upload code, preserve this fallback — don't assume `photo_*_url` is always
a real URL; it may be a `data:image/jpeg;base64,...` string, and UI code that displays
these fields needs to handle both.

## RBAC (enforced via Firestore rules + `role` field, not a separate auth service)

- **`admin`**: full CRUD on everything — users, locations, zones, templates, all task instances, switches, notifications, KPIs, and database reset/reseed tooling
- **`supervisor`**: read/write scoped to their branch — can review/approve/reject task instances for staff under them, create one-off tasks, read their team's KPIs; cannot manage `users`/`locations` globally
- **`cleaner`**: read-only on their own profile, assigned zone's templates/switches; read/write only their own `task_instances` (status updates, photos, notes, signature); can mark their own `notifications` read; read only their own `kpi_snapshots`

Any new feature should map to one of these three roles — there's no fourth tier.

## Known context

- The relevant scripts (`check_instances_templates.ts`, `compare_bak_with_main.ts`,
  `compare_with_seed.ts`, `forensic_check.ts`, `forensic_summary.ts`,
  `list_bak_templates.ts`, `list_firestore_templates.ts`,
  `reconstruct_custom_templates.ts`, `print_doc_details.ts`) at the repo root are
  one-off data-recovery/forensic tools — evidence this project went through a
  data-integrity incident. Treat them as diagnostic references, not part of the app's
  runtime path.
- The project previously went through a credential-exposure/auth incident with account
  recovery and admin provisioning work; be conservative about touching
  `provisionEmployeeAuth()` / `initializeAdminAuth()` in `api.ts` and Firestore
  security rules (`firestore.rules`) without confirming the current auth state first.
- `firebase.json`, `firestore.rules`, `storage.rules`, `cors.json` at the repo root
  govern deploy config, Firestore/Storage access rules, and CORS — check these when
  debugging permission or upload errors rather than only looking at client code.