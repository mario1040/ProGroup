export interface Profile {
  id: string;
  full_name: string;
  username: string; // e.g. عفاف, رحاب, admin, super
  role: 'admin' | 'cleaner' | 'supervisor';
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  shift_start?: string; // time
  shift_end?: string; // time
  work_days?: string[]; // e.g. ['السبت', 'الأحد', ...]
  created_at?: string;
  password?: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  created_at?: string;
}

export interface Zone {
  id: string;
  location_id: string;
  name: string; // e.g. الاستقبال, Team Office, Proxessory Station
  code?: string; // e.g. SOP_REC01
  floor?: string; // e.g. بدروم, دور 1, دور 2
  responsible_employee_id?: string;
  cover_image_url?: string;
  sort_order?: number;
  created_at?: string;
}

export interface TaskTemplate {
  id: string;
  zone_id: string;
  task_code: string; // e.g. SOP_CLE01
  title: string;
  description?: string;
  goal?: string;
  category: 'تشغيل' | 'نظافة' | 'صيانة' | 'سلامة' | 'جودة' | 'تجهيز';
  tools_required?: string;
  frequency: string; // يومي, أسبوعي, مرتين أسبوعيا, شهري
  recurrence_days?: string[]; // ['السبت', 'الاثنين', ...]
  estimated_duration_minutes?: number;
  scheduled_time?: string; // e.g. "08:30"
  requires_photo_before: boolean;
  requires_photo_after: boolean;
  requires_supervisor_approval: boolean;
  requires_gps: boolean;
  requires_signature: boolean;
  is_reopenable: boolean;
  auto_escalate_if_late: boolean;
  default_assignee_id?: string;
  is_active: boolean;
  guide_image_url?: string; // photo guiding the cleaner on exact location/instructions
  reference_image_url?: string; // reference image for cleaner view
  created_at?: string;
  updated_at?: string;
}

export interface TaskInstance {
  id: string;
  template_id?: string;
  zone_id: string;
  assigned_to: string; // profile_id
  assigned_by?: string; // profile_id
  task_type: 'recurring' | 'one_time' | 'rework';
  parent_instance_id?: string;
  title: string;
  description?: string;
  due_date: string; // YYYY-MM-DD
  due_time?: string; // HH:MM
  status: 'pending' | 'in_progress' | 'completed' | 'late' | 'rejected' | 'escalated';
  requires_photo_before?: boolean;
  requires_photo_after?: boolean;
  requires_supervisor_approval?: boolean;
  requires_gps?: boolean;
  requires_signature?: boolean;
  photo_before_url?: string;
  photo_before_taken_at?: string;
  photo_before_uploaded_at?: string;
  photo_before_size?: number;
  photo_before_mime_type?: string;
  photo_after_url?: string;
  photo_after_taken_at?: string;
  photo_after_uploaded_at?: string;
  photo_after_size?: number;
  photo_after_mime_type?: string;
  photo_capture_status?: 'pending' | 'uploading' | 'uploaded' | 'failed';
  employee_signature_url?: string;
  employee_notes?: string;
  supervisor_approved: boolean;
  supervisor_approved_by?: string;
  supervisor_approved_at?: string;
  supervisor_notes?: string;
  quality_grade?: 'A' | 'B' | 'C';
  started_at?: string;
  completed_at?: string;
  delay_minutes?: number;
  guide_image_url?: string; // copied from template for direct access
  reference_image_url?: string; // reference image for cleaner view
  created_at?: string;
  updated_at?: string;
}

export interface OperationalTask {
  id: string;
  zone_id: string;
  title: string;
  description?: string;
  schedule_windows?: Array<{ from: string; to: string; mode: string }>;
  responsible_employee_id?: string;
  switch_codes?: string[];
  is_active: boolean;
}

export interface KpiSnapshot {
  id: string;
  profile_id: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  tasks_assigned: number;
  tasks_completed_on_time: number;
  tasks_late: number;
  tasks_reworked: number;
  compliance_rate: number;
  avg_execution_time_minutes: number;
  quality_score: number;
  supervisor_rating: number;
  computed_at?: string;
}

export interface DeviceSwitch {
  id: string;
  code: string;
  label: string;
  zone_id: string;
  panel_location?: string;
}
