import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

// Safe resolution of __filename and __dirname for both ESM (development) and CJS (production)
const resolvedFilename = typeof __filename !== "undefined"
  ? __filename
  : (typeof import.meta !== "undefined" && import.meta.url ? fileURLToPath(import.meta.url) : "");

const resolvedDirname = typeof __dirname !== "undefined"
  ? __dirname
  : (resolvedFilename ? path.dirname(resolvedFilename) : process.cwd());

import { getSeededDB } from "./src/db_default";

const PORT = 3000;
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

import { initFirestoreDB, readFirestoreDB, writeFirestoreDB } from "./src/db_firestore";

// Helper to read and write db using Firestore cloud storage
function readDB() {
  return readFirestoreDB();
}

function writeDB(data: any) {
  writeFirestoreDB(data);
}

// Date helper
function getLocalDateString() {
  const date = new Date();
  // Adjust to local timezone if needed or standard YYYY-MM-DD
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString();
  return localISOTime.split("T")[0];
}

// Dynamic task generator helper
function ensureDailyTasksGenerated() {
  const db = readDB();
  const todayStr = getLocalDateString();
  
  // Find task instances generated for today
  const hasTodayInstances = db.task_instances.some((ti: any) => ti.due_date === todayStr && ti.task_type === "recurring");
  
  if (!hasTodayInstances && db.task_templates) {
    console.log(`Generating daily recurring tasks for ${todayStr}...`);
    const todayDayNameAr = getArabicDayName();
    
    db.task_templates.forEach((tpl: any) => {
      if (!tpl.is_active) return;
      
      // Check if template runs today
      const runsToday = tpl.frequency === "يومي" || 
                        (tpl.recurrence_days && tpl.recurrence_days.includes(todayDayNameAr));
      
      if (runsToday) {
        const id = "ti_" + Math.random().toString(36).substr(2, 9);
        const newInstance = {
          id,
          template_id: tpl.id,
          zone_id: tpl.zone_id,
          assigned_to: tpl.default_assignee_id || "p2",
          assigned_by: "p1", // Assigned by Admin
          task_type: "recurring",
          title: tpl.title,
          description: tpl.description || "",
          due_date: todayStr,
          due_time: tpl.scheduled_time || "09:00",
          status: "pending",
          supervisor_approved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.task_instances.push(newInstance);
        
        // Add assigned notification
        const notifId = "n_" + Math.random().toString(36).substr(2, 9);
        db.notifications.push({
          id: notifId,
          recipient_id: newInstance.assigned_to,
          type: "task_assigned",
          title: "مهمة مجدولة جديدة 📋",
          body: `تم إسناد مهمة "${tpl.title}" إليك لتنفيذها اليوم قبل الساعة ${tpl.scheduled_time}`,
          related_task_instance_id: id,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    });
    
    writeDB(db);
  }
}

function getArabicDayName() {
  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const dayIndex = new Date().getDay();
  return days[dayIndex];
}

async function startServer() {
  // Await Firestore initialization and seeding before accepting requests
  await initFirestoreDB();

  const app = express();
  
  // Configure express limit to handle base64 image uploads comfortably
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));
  
  // Serve uploaded files statically
  app.use("/uploads", express.static(UPLOADS_DIR));

  // --- API Routes ---

  // Auth endpoint
  app.post("/api/auth/login", (req, res) => {
    const { username } = req.body;
    console.log("Login attempt received:", username);
    
    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "اسم المستخدم مطلوب" });
    }

    const cleanInput = username.trim().toLowerCase();
    const db = readDB();

    // Log available profiles for diagnostics on the container
    console.log("Available profiles in DB:", (db.profiles || []).map((p: any) => ({
      username: p.username,
      full_name: p.full_name,
      is_active: p.is_active
    })));

    // Match by:
    // 1. Username (exact case-insensitive match)
    // 2. Full Name (exact case-insensitive match)
    // 3. Phone (exact match)
    let profile = (db.profiles || []).find((p: any) => {
      const active = p.is_active !== false; // Active by default if not explicitly false
      if (!active) return false;

      const pUsername = (p.username || "").trim().toLowerCase();
      const pFullName = (p.full_name || "").trim().toLowerCase();
      const pPhone = (p.phone || "").trim();

      return pUsername === cleanInput || 
             pFullName === cleanInput || 
             pPhone === cleanInput;
    });

    // Substring fallback for names/usernames if no exact match is found
    if (!profile) {
      profile = (db.profiles || []).find((p: any) => {
        const active = p.is_active !== false;
        if (!active) return false;

        const pUsername = (p.username || "").trim().toLowerCase();
        const pFullName = (p.full_name || "").trim().toLowerCase();

        return pUsername.includes(cleanInput) || 
               cleanInput.includes(pUsername) ||
               pFullName.includes(cleanInput) ||
               cleanInput.includes(pFullName);
      });
    }

    // Safety fallback: if they type something resembling admin/مدير/أحمد and still not found, return the first admin
    if (!profile && (cleanInput.includes("admin") || cleanInput.includes("مدير") || cleanInput.includes("أحمد") || cleanInput.includes("احمد"))) {
      profile = (db.profiles || []).find((p: any) => p.role === "admin" && p.is_active !== false);
    }

    if (!profile) {
      return res.status(404).json({ error: "الموظف غير مسجل أو غير نشط في النظام" });
    }

    console.log("Login success for profile:", profile.username, "(Role:", profile.role, ")");
    res.json({ user: profile });
  });

  // Get profiles
  app.get("/api/profiles", (req, res) => {
    const db = readDB();
    res.json(db.profiles);
  });

  // Create or Update Profile
  app.post("/api/profiles", (req, res) => {
    const db = readDB();
    const profileData = req.body;
    
    // Ensure is_active is explicitly true if not set
    if (profileData.is_active === undefined) {
      profileData.is_active = true;
    }
    
    if (!profileData.id) {
      profileData.id = "p_" + Math.random().toString(36).substr(2, 9);
      profileData.created_at = new Date().toISOString();
      db.profiles.push(profileData);
    } else {
      const idx = db.profiles.findIndex((p: any) => p.id === profileData.id);
      if (idx !== -1) {
        db.profiles[idx] = { ...db.profiles[idx], ...profileData };
      } else {
        db.profiles.push(profileData);
      }
    }
    writeDB(db);
    res.json(profileData);
  });

  // Get zones
  app.get("/api/zones", (req, res) => {
    const db = readDB();
    // Attach employee info
    const zonesWithEmployees = db.zones.map((zone: any) => {
      const emp = db.profiles.find((p: any) => p.id === zone.responsible_employee_id);
      return { ...zone, responsible_employee: emp };
    });
    res.json(zonesWithEmployees);
  });

  // Create or Update Zone
  app.post("/api/zones", (req, res) => {
    const db = readDB();
    const zoneData = req.body;
    
    if (!zoneData.id) {
      zoneData.id = "z_" + Math.random().toString(36).substr(2, 9);
      zoneData.created_at = new Date().toISOString();
      db.zones.push(zoneData);
    } else {
      const idx = db.zones.findIndex((z: any) => z.id === zoneData.id);
      if (idx !== -1) {
        db.zones[idx] = { ...db.zones[idx], ...zoneData };
      } else {
        db.zones.push(zoneData);
      }
    }
    writeDB(db);
    res.json(zoneData);
  });

  // Get templates
  app.get("/api/templates", (req, res) => {
    const db = readDB();
    res.json(db.task_templates);
  });

  // Create or Update Template
  app.post("/api/templates", (req, res) => {
    const db = readDB();
    const templateData = req.body;
    
    if (!templateData.id) {
      templateData.id = "t_" + Math.random().toString(36).substr(2, 9);
      templateData.created_at = new Date().toISOString();
      db.task_templates.push(templateData);
    } else {
      const idx = db.task_templates.findIndex((t: any) => t.id === templateData.id);
      if (idx !== -1) {
        db.task_templates[idx] = { ...db.task_templates[idx], ...templateData, updated_at: new Date().toISOString() };
      } else {
        db.task_templates.push(templateData);
      }
    }
    writeDB(db);
    res.json(templateData);
  });

  // Delete Template
  app.delete("/api/templates/:id", (req, res) => {
    const db = readDB();
    db.task_templates = db.task_templates.filter((t: any) => t.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  });

  // Get operational tasks
  app.get("/api/operational-tasks", (req, res) => {
    const db = readDB();
    const opsWithEmps = db.operational_tasks.map((ot: any) => {
      const emp = db.profiles.find((p: any) => p.id === ot.responsible_employee_id);
      return { ...ot, responsible_employee: emp };
    });
    res.json(opsWithEmps);
  });

  // Get Task Instances (daily execution + triggers automatic generation)
  app.get("/api/tasks", (req, res) => {
    // Ensure today's tasks are generated first
    ensureDailyTasksGenerated();
    
    const db = readDB();
    const dateQuery = req.query.date as string || getLocalDateString();
    
    // Filter by date
    let filtered = db.task_instances.filter((ti: any) => ti.due_date === dateQuery);
    
    // Attach zone and employee and template details
    const fullyAttached = filtered.map((ti: any) => {
      const zone = db.zones.find((z: any) => z.id === ti.zone_id);
      const assignee = db.profiles.find((p: any) => p.id === ti.assigned_to);
      const template = db.task_templates.find((tpl: any) => tpl.id === ti.template_id);
      return {
        ...ti,
        zone,
        assignee,
        template
      };
    });
    
    res.json(fullyAttached);
  });

  // Create manual/one-time task
  app.post("/api/tasks", (req, res) => {
    const db = readDB();
    const taskData = req.body;
    
    const id = "ti_" + Math.random().toString(36).substr(2, 9);
    const newInstance = {
      id,
      ...taskData,
      status: taskData.status || "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.task_instances.push(newInstance);
    
    // Notification to assignee
    const notifId = "n_" + Math.random().toString(36).substr(2, 9);
    db.notifications.push({
      id: notifId,
      recipient_id: newInstance.assigned_to,
      type: "task_assigned",
      title: "تكليف بمهمة جديدة 📌",
      body: `تم تكليفك بمهمة فورية: "${newInstance.title}" للتسليم اليوم.`,
      related_task_instance_id: id,
      is_read: false,
      created_at: new Date().toISOString()
    });
    
    writeDB(db);
    res.json(newInstance);
  });

  // Get single task instance
  app.get("/api/tasks/:id", (req, res) => {
    const db = readDB();
    const ti = db.task_instances.find((t: any) => t.id === req.params.id);
    if (!ti) {
      return res.status(404).json({ error: "المهمة غير موجودة" });
    }
    
    const zone = db.zones.find((z: any) => z.id === ti.zone_id);
    const assignee = db.profiles.find((p: any) => p.id === ti.assigned_to);
    const template = db.task_templates.find((tpl: any) => tpl.id === ti.template_id);
    
    res.json({
      ...ti,
      zone,
      assignee,
      template
    });
  });

  // Update task progress or submit details (photos, notes, signature)
  app.put("/api/tasks/:id", (req, res) => {
    const db = readDB();
    const id = req.params.id;
    const updates = req.body;
    
    const idx = db.task_instances.findIndex((t: any) => t.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "المهمة غير موجودة" });
    }
    
    const currentTask = db.task_instances[idx];
    const template = db.task_templates.find((tpl: any) => tpl.id === currentTask.template_id);
    const merged = { ...currentTask, ...updates, updated_at: new Date().toISOString() };
    
    // Status workflows:
    if (updates.status === "in_progress" && !currentTask.started_at) {
      merged.started_at = new Date().toISOString();
    }
    
    if (updates.status === "completed" && !currentTask.completed_at) {
      merged.completed_at = new Date().toISOString();
      merged.photo_after_taken_at = new Date().toISOString();
      
      // Calculate delay minutes
      if (currentTask.due_time && currentTask.due_date) {
        try {
          const dueDateTime = new Date(`${currentTask.due_date}T${currentTask.due_time}:00`);
          const completedTime = new Date(merged.completed_at);
          const diffMs = completedTime.getTime() - dueDateTime.getTime();
          merged.delay_minutes = diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
          
          if (merged.delay_minutes > 0) {
            merged.status = "completed"; // It's completed but late. Let's keep status completed
          }
        } catch (e) {
          console.error("Error parsing date for delay calc", e);
        }
      }
      
      // Supervisor approval logic:
      const requiresApproval = template ? template.requires_supervisor_approval : true;
      if (!requiresApproval) {
        merged.supervisor_approved = true;
        merged.supervisor_approved_at = new Date().toISOString();
        merged.quality_grade = "A"; // Auto approved gets default high grade
      }
    }
    
    db.task_instances[idx] = merged;
    writeDB(db);
    res.json(merged);
  });

  // Approve a task
  app.post("/api/tasks/:id/approve", (req, res) => {
    const db = readDB();
    const id = req.params.id;
    const { supervisor_id, quality_grade, supervisor_notes } = req.body;
    
    const idx = db.task_instances.findIndex((t: any) => t.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "المهمة غير موجودة" });
    }
    
    db.task_instances[idx].status = "completed";
    db.task_instances[idx].supervisor_approved = true;
    db.task_instances[idx].supervisor_approved_by = supervisor_id || "p1";
    db.task_instances[idx].supervisor_approved_at = new Date().toISOString();
    db.task_instances[idx].quality_grade = quality_grade || "A";
    db.task_instances[idx].supervisor_notes = supervisor_notes || "";
    db.task_instances[idx].updated_at = new Date().toISOString();
    
    // Add approved notification
    const notifId = "n_" + Math.random().toString(36).substr(2, 9);
    db.notifications.push({
      id: notifId,
      recipient_id: db.task_instances[idx].assigned_to,
      type: "task_approved",
      title: "اعتماد المهمة بنجاح 🎉",
      body: `تم اعتماد مهمتك "${db.task_instances[idx].title}" بتقدير (${quality_grade || "A"}) من قبل المشرف.`,
      related_task_instance_id: id,
      is_read: false,
      created_at: new Date().toISOString()
    });
    
    writeDB(db);
    res.json(db.task_instances[idx]);
  });

  // Reject a task and create a rework task instance!
  app.post("/api/tasks/:id/reject", (req, res) => {
    const db = readDB();
    const id = req.params.id;
    const { supervisor_id, supervisor_notes } = req.body;
    
    const idx = db.task_instances.findIndex((t: any) => t.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "المهمة غير موجودة" });
    }
    
    const originalTask = db.task_instances[idx];
    
    // Update original task
    originalTask.status = "rejected";
    originalTask.supervisor_approved = false;
    originalTask.supervisor_approved_by = supervisor_id || "p1";
    originalTask.supervisor_approved_at = new Date().toISOString();
    originalTask.supervisor_notes = supervisor_notes || "مرفوضة وتحتاج لإعادة التنظيف";
    originalTask.updated_at = new Date().toISOString();
    
    // Create REWORK instance
    const reworkId = "ti_rework_" + Math.random().toString(36).substr(2, 9);
    const reworkTask = {
      id: reworkId,
      template_id: originalTask.template_id,
      zone_id: originalTask.zone_id,
      assigned_to: originalTask.assigned_to,
      assigned_by: supervisor_id || "p1",
      task_type: "rework",
      parent_instance_id: originalTask.id,
      title: `إعادة تنظيف: ${originalTask.title} ⚠️`,
      description: `سبب الرفض: ${supervisor_notes || "ملاحظات المشرف"}. يرجى إعادة التنظيف بالكامل والتقاط صور واضحة بعد الانتهاء.`,
      due_date: getLocalDateString(),
      due_time: "17:00", // Reworks due before end of shift
      status: "pending",
      supervisor_approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.task_instances.push(reworkTask);
    
    // Add reject & rework notifications
    const notifId = "n_" + Math.random().toString(36).substr(2, 9);
    db.notifications.push({
      id: notifId,
      recipient_id: originalTask.assigned_to,
      type: "rework_requested",
      title: "إعادة تنفيذ مهمة مطلوبة ⚠️",
      body: `تم رفض مهمتك "${originalTask.title}". السبب: ${supervisor_notes}. يرجى إعادتها فوراً.`,
      related_task_instance_id: reworkId,
      is_read: false,
      created_at: new Date().toISOString()
    });
    
    writeDB(db);
    res.json({ original: originalTask, rework: reworkTask });
  });

  // Base64 Photo Upload Handler (simulates cloud storage by saving files locally)
  app.post("/api/upload", (req, res) => {
    const { base64Image, fileName } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: "لا توجد صورة مرفوعة" });
    }
    
    try {
      // Decode base64
      const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "ترميز الصورة غير صالح" });
      }
      
      const buffer = Buffer.from(matches[2], "base64");
      const ext = fileName ? path.extname(fileName) : ".jpg";
      const uniqueName = `photo_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
      const filePath = path.join(UPLOADS_DIR, uniqueName);
      
      fs.writeFileSync(filePath, buffer);
      
      // Return public URL path
      res.json({ url: `/uploads/${uniqueName}` });
    } catch (e) {
      console.error("Upload error", e);
      res.status(500).json({ error: "فشل حفظ الملف" });
    }
  });

  // Calculate live dynamic KPIs for employees
  app.get("/api/kpi", (req, res) => {
    const db = readDB();
    
    // Calculate live KPIs for cleaners (afaf and rehab)
    const cleaners = db.profiles.filter((p: any) => p.role === "cleaner");
    const kpis = cleaners.map((cleaner: any) => {
      // Find all completed/late/rejected/all tasks for this cleaner
      const tasks = db.task_instances.filter((t: any) => t.assigned_to === cleaner.id);
      
      const total = tasks.length;
      const completed = tasks.filter((t: any) => t.status === "completed" && t.supervisor_approved).length;
      const onTime = tasks.filter((t: any) => t.status === "completed" && t.supervisor_approved && (t.delay_minutes || 0) <= 0).length;
      const late = tasks.filter((t: any) => t.status === "completed" && (t.delay_minutes || 0) > 0).length;
      const reworked = tasks.filter((t: any) => t.task_type === "rework").length;
      const rejected = tasks.filter((t: any) => t.status === "rejected").length;
      
      // Calculate compliance rate (on time completed / total completed)
      const compliance_rate = completed > 0 ? Math.round((onTime / completed) * 100) : 100;
      
      // Average execution time
      let totalDuration = 0;
      let durationCount = 0;
      tasks.forEach((t: any) => {
        if (t.started_at && t.completed_at) {
          const start = new Date(t.started_at);
          const end = new Date(t.completed_at);
          const diffMin = (end.getTime() - start.getTime()) / 60000;
          if (diffMin > 0) {
            totalDuration += diffMin;
            durationCount++;
          }
        }
      });
      const avg_execution_time_minutes = durationCount > 0 ? Math.round((totalDuration / durationCount) * 10) / 10 : 20;
      
      // Quality score based on grades: A=100, B=80, C=60
      let qualitySum = 0;
      let gradedCount = 0;
      tasks.forEach((t: any) => {
        if (t.quality_grade) {
          gradedCount++;
          if (t.quality_grade === "A") qualitySum += 100;
          else if (t.quality_grade === "B") qualitySum += 80;
          else if (t.quality_grade === "C") qualitySum += 60;
        }
      });
      const quality_score = gradedCount > 0 ? Math.round(qualitySum / gradedCount) : 95;
      
      // Supervisor rating
      const supervisor_rating = quality_score >= 90 ? 4.9 : quality_score >= 80 ? 4.5 : 3.8;
      
      return {
        profile_id: cleaner.id,
        cleaner_name: cleaner.full_name,
        username: cleaner.username,
        tasks_assigned: total,
        tasks_completed_on_time: onTime,
        tasks_late: late,
        tasks_reworked: reworked,
        tasks_rejected: rejected,
        compliance_rate,
        avg_execution_time_minutes,
        quality_score,
        supervisor_rating
      };
    });
    
    res.json(kpis);
  });

  // Get notifications
  app.get("/api/notifications", (req, res) => {
    const db = readDB();
    const recipient = req.query.recipient_id as string;
    
    let filtered = db.notifications;
    if (recipient) {
      filtered = db.notifications.filter((n: any) => n.recipient_id === recipient);
    }
    
    // Sort reverse chronological
    filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(filtered);
  });

  // Read notifications
  app.post("/api/notifications/:id/read", (req, res) => {
    const db = readDB();
    const idx = db.notifications.findIndex((n: any) => n.id === req.params.id);
    if (idx !== -1) {
      db.notifications[idx].is_read = true;
      writeDB(db);
    }
    res.json({ success: true });
  });

  // Devices switches
  app.get("/api/device-switches", (req, res) => {
    const db = readDB();
    res.json(db.device_switches);
  });

  // --- End API Routes ---

  // Vite development or static build server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
