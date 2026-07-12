import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  MapPin, 
  Grid, 
  List, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  X, 
  Camera, 
  Plus, 
  ChevronLeft, 
  BarChart2, 
  Settings, 
  Lightbulb, 
  Power, 
  ShieldCheck, 
  Bell, 
  Trash2, 
  UserCheck,
  Calendar
} from "lucide-react";
import { 
  getTasks, 
  getProfiles, 
  getZones, 
  getKpis, 
  getTemplates, 
  getOperationalTasks, 
  getDeviceSwitches, 
  createTask, 
  approveTask, 
  rejectTask, 
  saveTemplate, 
  deleteTemplate,
  KpiSummary
} from "../lib/api";
import { Profile, Zone, TaskTemplate, TaskInstance, OperationalTask, DeviceSwitch } from "../types";

// Import Recharts for KPI charts
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend, 
  LineChart, 
  Line,
  CartesianGrid
} from "recharts";

interface AdminDashboardProps {
  user: Profile;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  // Navigation tabs for the Admin Panel
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'approvals' | 'kpis' | 'sop' | 'operational'>('overview');
  
  // App data states
  const [tasks, setTasks] = useState<(TaskInstance & { zone?: Zone; assignee?: Profile; template?: TaskTemplate })[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [zones, setZones] = useState<(Zone & { responsible_employee?: Profile })[]>([]);
  const [kpis, setKpis] = useState<KpiSummary[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [operationalTasks, setOperationalTasks] = useState<(OperationalTask & { responsible_employee?: Profile })[]>([]);
  const [deviceSwitches, setDeviceSwitches] = useState<DeviceSwitch[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  
  // Tasks views states
  const [taskViewMode, setTaskViewMode] = useState<'table' | 'kanban'>('table');
  const [tasksSubFilter, setTasksSubFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");

  // Assign task modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    zone_id: "",
    due_time: "10:00",
    requires_photo_before: true,
    requires_photo_after: true,
    requires_supervisor_approval: true,
    requires_signature: false
  });

  // SOP Template Form modal state
  const [isSopModalOpen, setIsSopModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<TaskTemplate> | null>(null);

  // Quick zone detail view
  const [selectedZoneDetail, setSelectedZoneDetail] = useState<Zone | null>(null);

  // Approval review state
  const [reviewingTask, setReviewingTask] = useState<(TaskInstance & { zone?: Zone; assignee?: Profile; template?: TaskTemplate }) | null>(null);
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [supervisorNotes, setSupervisorNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Slider Before/After preview state
  const [sliderPosition, setSliderPosition] = useState(50);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Main load function
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [allTasks, allProfiles, allZones, allKpis, allTemplates, allOps, allSwitches] = await Promise.all([
        getTasks(selectedDate),
        getProfiles(),
        getZones(),
        getKpis(),
        getTemplates(),
        getOperationalTasks(),
        getDeviceSwitches()
      ]);

      setTasks(allTasks);
      setProfiles(allProfiles);
      setZones(allZones);
      setKpis(allKpis);
      setTemplates(allTemplates);
      setOperationalTasks(allOps);
      setDeviceSwitches(allSwitches);
    } catch (err) {
      console.error(err);
      showToast("خطأ أثناء تحميل بيانات لوحة التحكم", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedDate, activeTab]);

  // Statistics Computations
  const statsCompleted = tasks.filter(t => t.status === "completed").length;
  const statsInProgress = tasks.filter(t => t.status === "in_progress").length;
  const statsLate = tasks.filter(t => {
    // A task is late if status is late OR (completed and delay_minutes > 0)
    return t.status === "late" || (t.status === "completed" && (t.delay_minutes || 0) > 0);
  }).length;
  const statsPendingApproval = tasks.filter(t => t.status === "completed" && !t.supervisor_approved).length;

  const totalTasksCount = tasks.length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((statsCompleted / totalTasksCount) * 100) : 0;

  // Filter Tasks Board
  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      // Search query
      const matchQuery = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (task.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.template?.task_code || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      // Employee filter
      const matchEmployee = employeeFilter === "all" || task.assigned_to === employeeFilter;
      
      // Zone filter
      const matchZone = zoneFilter === "all" || task.zone_id === zoneFilter;
      
      // Tab filter inside Tasks Board
      let matchSubTab = true;
      if (tasksSubFilter === "recurring") matchSubTab = task.task_type === "recurring";
      else if (tasksSubFilter === "one_time") matchSubTab = task.task_type === "one_time";
      else if (tasksSubFilter === "rework") matchSubTab = task.task_type === "rework";
      else if (tasksSubFilter === "late") matchSubTab = task.status === "late" || (task.status === "completed" && (task.delay_minutes || 0) > 0);
      else if (tasksSubFilter === "pending_approval") matchSubTab = task.status === "completed" && !task.supervisor_approved;

      return matchQuery && matchEmployee && matchZone && matchSubTab;
    });
  };

  // Create Task Submission
  const handleAssignTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.title || !newTaskData.assigned_to || !newTaskData.zone_id) {
      showToast("يرجى ملء جميع الحقول الأساسية للتكليف", "warning");
      return;
    }

    try {
      setLoading(true);
      await createTask({
        title: newTaskData.title,
        description: newTaskData.description,
        assigned_to: newTaskData.assigned_to,
        zone_id: newTaskData.zone_id,
        due_date: selectedDate,
        due_time: newTaskData.due_time,
        task_type: "one_time",
        status: "pending",
        supervisor_approved: false
      });

      showToast("تم إسناد المهمة وإرسال إشعار فوري للموظف! 🚀", "success");
      setIsAssignModalOpen(false);
      // Reset form
      setNewTaskData({
        title: "",
        description: "",
        assigned_to: "",
        zone_id: "",
        due_time: "10:00",
        requires_photo_before: true,
        requires_photo_after: true,
        requires_supervisor_approval: true,
        requires_signature: false
      });
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast("حدث خطأ أثناء إسناد المهمة الجديدة", "error");
    } finally {
      setLoading(false);
    }
  };

  // Approve completed task action
  const handleApproveClick = async () => {
    if (!reviewingTask) return;
    try {
      setLoading(true);
      await approveTask(reviewingTask.id, {
        supervisor_id: user.id,
        quality_grade: qualityGrade,
        supervisor_notes: supervisorNotes
      });
      showToast(`تم اعتماد المهمة بنجاح بتقدير (${qualityGrade}) 🎉`, "success");
      setReviewingTask(null);
      setSupervisorNotes("");
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast("فشل في اعتماد المهمة", "error");
    } finally {
      setLoading(false);
    }
  };

  // Reject completed task action
  const handleRejectClick = async () => {
    if (!reviewingTask) return;
    if (!rejectionReason.trim()) {
      showToast("يرجى كتابة سبب الرفض بالتفصيل لتوجيه الموظف", "warning");
      return;
    }
    try {
      setLoading(true);
      await rejectTask(reviewingTask.id, {
        supervisor_id: user.id,
        supervisor_notes: rejectionReason
      });
      showToast("تم رفض المهمة وإنشاء طلب إعادة تنظيف (Rework) تلقائياً ⚠️", "success");
      setReviewingTask(null);
      setRejectionReason("");
      setIsRejecting(false);
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast("فشل في مراجعة ورفض المهمة", "error");
    } finally {
      setLoading(false);
    }
  };

  // Save SOP template action
  const handleSaveSopTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate?.title || !selectedTemplate?.zone_id || !selectedTemplate?.task_code) {
      showToast("يرجى كتابة الكود والعنوان وتحديد المنطقة للمعيار", "warning");
      return;
    }

    try {
      setLoading(true);
      await saveTemplate(selectedTemplate);
      showToast("تم حفظ بند معيار SOP الموحد بنجاح ✅", "success");
      setIsSopModalOpen(false);
      setSelectedTemplate(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast("فشل حفظ البند المعياري", "error");
    } finally {
      setLoading(false);
    }
  };

  // Zone border status determination
  const getZoneBorderClass = (zoneId: string) => {
    const zoneTasks = tasks.filter(t => t.zone_id === zoneId);
    if (zoneTasks.length === 0) return "border-slate-200 hover:border-slate-300";
    
    const hasLate = zoneTasks.some(t => t.status === "late");
    if (hasLate) return "border-red-500 shadow-red-50 ring-1 ring-red-500/10";
    
    const allCompleted = zoneTasks.every(t => t.status === "completed");
    if (allCompleted) return "border-emerald-500 shadow-emerald-50 ring-1 ring-emerald-500/10";
    
    return "border-amber-400 shadow-amber-50 ring-1 ring-amber-400/10";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-right">
      
      {/* Toast Notification Container */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 md:left-auto md:w-96 z-50 p-4 rounded-xl shadow-xl border transition-all duration-300 flex items-center gap-3 ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
          toast.type === "error" ? "bg-rose-50 text-rose-800 border-rose-200" :
          "bg-amber-50 text-amber-800 border-amber-200"
        }`}>
          <div className="shrink-0">
            {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
            {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-600" />}
            {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
          </div>
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Admin Top Navigation Header */}
      <header className="bg-slate-900 text-white shadow-lg border-b border-slate-800 px-6 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white font-black shadow-md tracking-wider flex items-center justify-center w-10 h-10">
            N
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight flex items-center gap-2">
              Naris Ops <span className="text-[10px] bg-indigo-500 text-white py-0.5 px-2 rounded-full font-bold">إدارة التشغيل والجودة</span>
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">متابعة تشغيل النظافة وسير الـ SOP بمقر الشركة اليومي</p>
          </div>
        </div>

        {/* Date Selector and User profile */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-700 text-xs">
            <span className="text-slate-400 font-semibold">تاريخ اليوم:</span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-bold outline-none border-none cursor-pointer"
            />
          </div>

          <div className="h-6 w-px bg-slate-800"></div>

          <div className="flex items-center gap-3 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-800">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-extrabold text-white">
              {user.full_name.slice(0, 2)}
            </div>
            <span className="text-xs font-bold text-slate-200">{user.full_name}</span>
            <button
              onClick={onLogout}
              className="bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-xs py-1 px-2.5 rounded-lg font-bold cursor-pointer transition border border-slate-700"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Layout Sidebar + Content */}
      <div className="flex flex-1 flex-col md:flex-row">
        
        {/* Navigation Sidebar (Dark Slate Theme with Indigo highlights) */}
        <aside className="w-full md:w-64 bg-[#0F172A] text-white border-b md:border-b-0 md:border-l border-slate-800 p-4 shrink-0 flex flex-col justify-between">
          <div className="flex flex-col gap-1.5">
            {[
              { id: 'overview', label: 'اللوحة العامة والتحليلات', icon: Grid },
              { id: 'tasks', label: 'لوحة إدارة المهام اليومية', icon: List },
              { id: 'approvals', label: 'طابور الاعتماد والتدقيق', icon: ShieldCheck, badge: statsPendingApproval },
              { id: 'kpis', label: 'تحليلات الأداء ومؤشرات KPI', icon: BarChart2 },
              { id: 'sop', label: 'أدلة الجودة وبنود SOP المعيارية', icon: Settings },
              { id: 'operational', label: 'تشغيل الإضاءة والأجهزة', icon: Lightbulb }
            ].map((item: any) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between gap-3 w-full p-2.5 rounded-lg text-right text-xs font-bold cursor-pointer transition duration-150 ${
                    isSelected 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20" 
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="bg-rose-500 text-white font-extrabold text-[10px] py-0.5 px-2 rounded-full shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 border-t border-slate-800 pt-4 bg-slate-900/40 p-3 rounded-lg flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
              👑
            </div>
            <div>
              <div className="text-[10px] font-bold text-white">مدير العمليات</div>
              <div className="text-[9px] text-slate-400">Naris Clean Ops v1.4</div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-x-hidden">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <span className="text-sm font-semibold">جاري جلب البيانات من الخادم وتحديث الأداء...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-6">
                  
                  {/* Top Counter Banner */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border-b-4 border-emerald-500 p-4.5 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-slate-500 font-bold">مهام مكتملة اليوم</span>
                        <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800">{statsCompleted}</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 py-0.5 px-2 rounded-md">
                          +{completionPercentage}%
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border-b-4 border-amber-500 p-4.5 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-slate-500 font-bold">مهام قيد التنفيذ حالياً</span>
                        <div className="bg-amber-50 text-amber-500 p-1.5 rounded-lg">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800">{statsInProgress}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          نشط الآن
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border-b-4 border-rose-500 p-4.5 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-slate-500 font-bold">المهام المتأخرة</span>
                        <div className="bg-rose-50 text-rose-600 p-1.5 rounded-lg">
                          <AlertTriangle className="w-4 h-4 animate-pulse" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-rose-600">{statsLate}</span>
                        <span className="text-[10px] text-rose-500 font-bold bg-rose-50 py-0.5 px-2 rounded-md">
                          إشراف طارئ
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border-b-4 border-indigo-500 p-4.5 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-slate-500 font-bold">بانتظار اعتماد الجودة</span>
                        <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-2xl font-black text-indigo-700">{statsPendingApproval}</span>
                        <button
                          onClick={() => setActiveTab('approvals')}
                          className="text-[10px] text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 py-1 px-2.5 rounded-lg border border-indigo-200 cursor-pointer transition flex items-center gap-1"
                        >
                          اعتماد سريع <ChevronLeft className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Zone Status Grid - Real-time compliance boundary map */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">خريطة حالة المناطق ومستويات النظافة</h3>
                        <p className="text-xs text-slate-400">تظهر الغرف بنسب مهامها اليومية وحالة تلميعها طبقا لإدخال الموظفين</p>
                      </div>
                      <span className="text-[10px] text-slate-500 flex items-center gap-3">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> جاهزة بالكامل</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded-full"></span> قيد العمل</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span> متأخرة/معطلة</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {zones.map((zone) => {
                        const zoneTasks = tasks.filter(t => t.zone_id === zone.id);
                        const doneCount = zoneTasks.filter(t => t.status === "completed").length;
                        const totalCount = zoneTasks.length;
                        
                        // Determine high density layout color scheme
                        let cardClass = "bg-white border-slate-200";
                        let badgeClass = "bg-slate-100 text-slate-700";
                        
                        if (totalCount > 0) {
                          const hasLate = zoneTasks.some(t => t.status === "late");
                          const allCompleted = zoneTasks.every(t => t.status === "completed");
                          
                          if (hasLate) {
                            cardClass = "bg-rose-50/50 border-rose-200 shadow-rose-50/30";
                            badgeClass = "bg-rose-500 text-white";
                          } else if (allCompleted) {
                            cardClass = "bg-emerald-50/50 border-emerald-200 shadow-emerald-50/30";
                            badgeClass = "bg-emerald-500 text-white";
                          } else {
                            cardClass = "bg-amber-50/50 border-amber-200 shadow-amber-50/30";
                            badgeClass = "bg-amber-500 text-white";
                          }
                        }

                        return (
                          <div
                            key={zone.id}
                            onClick={() => setSelectedZoneDetail(zone)}
                            className={`border rounded-xl p-4.5 transition duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${cardClass}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold block">{zone.code || "SOP"} • {zone.floor}</span>
                                <h4 className="text-xs font-extrabold text-slate-800 mt-0.5">{zone.name}</h4>
                              </div>
                            </div>

                            <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between items-center text-[10px]">
                              <span className="text-slate-500 font-bold flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {zone.responsible_employee?.full_name || "عفاف أحمد"}
                              </span>
                              <span className={`py-0.5 px-2 rounded font-black ${badgeClass}`}>
                                {doneCount} / {totalCount} مهام
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom double bento column: Assign Manual Task and Live KPI snapshots */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Quick Assign Action Form */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-1 flex flex-col gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">تكليف سريع بمهمة فورية 📌</h3>
                        <p className="text-xs text-slate-400 mt-0.5">لإضافة أي طوارئ غير مجدولة بالـ SOP اليومي</p>
                      </div>

                      <form onSubmit={handleAssignTaskSubmit} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500">عنوان التكليف:</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: تنظيف فوري لقهوة منسكبة بغرفة الاجتماعات"
                            value={newTaskData.title}
                            onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                            className="text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-slate-400"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500">الموظف المسؤول:</label>
                            <select
                              required
                              value={newTaskData.assigned_to}
                              onChange={(e) => setNewTaskData({ ...newTaskData, assigned_to: e.target.value })}
                              className="text-xs p-2 border border-slate-200 rounded-lg outline-none cursor-pointer bg-white"
                            >
                              <option value="">اختر موظف...</option>
                              {profiles.filter(p => p.role === "cleaner").map(p => (
                                <option key={p.id} value={p.id}>{p.full_name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500">موقع الغرفة:</label>
                            <select
                              required
                              value={newTaskData.zone_id}
                              onChange={(e) => setNewTaskData({ ...newTaskData, zone_id: e.target.value })}
                              className="text-xs p-2 border border-slate-200 rounded-lg outline-none cursor-pointer bg-white"
                            >
                              <option value="">اختر منطقة...</option>
                              {zones.map(z => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500">موعد التسليم اليوم (الساعة):</label>
                          <input
                            type="time"
                            value={newTaskData.due_time}
                            onChange={(e) => setNewTaskData({ ...newTaskData, due_time: e.target.value })}
                            className="text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400"
                          />
                        </div>

                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إرسال وتكليف الموظف</span>
                        </button>
                      </form>
                    </div>

                    {/* Quick Live KPI snapshot comparing work */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-2">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">مؤشر الإنجاز والالتزام اللحظي للموظفين 🏆</h3>
                          <p className="text-xs text-slate-400">تقييم مباشر للالتزام بالوقت وسرعة التنظيف وجودة المخرجات</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('kpis')}
                          className="text-xs text-indigo-600 font-bold hover:underline"
                        >
                          التفاصيل الكاملة
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        {kpis.map((kpi) => (
                          <div key={kpi.profile_id} className="border border-slate-100 rounded-xl p-4 bg-slate-50 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-slate-200 text-slate-700 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs">
                                {kpi.cleaner_name.slice(0, 2)}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">{kpi.cleaner_name}</h4>
                                <span className="text-[10px] text-slate-400 font-medium">متوسط وقت إنجاز البند: {kpi.avg_execution_time_minutes} دقيقة</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-left">
                                <span className="text-[10px] text-slate-400 block font-bold">نسبة الالتزام</span>
                                <span className={`text-xs font-extrabold ${kpi.compliance_rate >= 90 ? 'text-emerald-600' : 'text-amber-500'}`}>{kpi.compliance_rate}%</span>
                              </div>

                              <div className="text-left">
                                <span className="text-[10px] text-slate-400 block font-bold">تقييم الجودة</span>
                                <span className="text-xs font-extrabold text-slate-800">{kpi.quality_score}%</span>
                              </div>

                              <div className="text-left">
                                <span className="text-[10px] text-slate-400 block font-bold">المتأخرة/الإعادات</span>
                                <span className="text-xs font-extrabold text-rose-600">{kpi.tasks_late} / {kpi.tasks_reworked}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* High Density Premium Bottom Summary Dark Panel */}
                  <div className="bg-[#1E293B] rounded-xl p-4 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
                    <div className="flex gap-8 items-center flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-lg">🏆</div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">أفضل أداء التزام هذا الأسبوع</div>
                          <div className="text-sm font-black font-sans text-indigo-200">
                            {kpis.length > 0 
                              ? `${[...kpis].sort((a,b) => b.compliance_rate - a.compliance_rate)[0].cleaner_name} (${[...kpis].sort((a,b) => b.compliance_rate - a.compliance_rate)[0].compliance_rate}%)`
                              : "عفاف حسن (98.5%)"}
                          </div>
                        </div>
                      </div>

                      <div className="h-8 w-px bg-slate-700 hidden md:block"></div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold text-base">⏱️</div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">متوسط سرعة الإنجاز الموحد</div>
                          <div className="text-sm font-black font-sans text-emerald-300">
                            {kpis.length > 1
                              ? `${Math.round(kpis.reduce((acc, curr) => acc + curr.avg_execution_time_minutes, 0) / kpis.length)} دقيقة / بند`
                              : "18 دقيقة / بند"}
                          </div>
                        </div>
                      </div>

                      <div className="h-8 w-px bg-slate-700 hidden md:block"></div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center font-bold text-base">📊</div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">إجمالي التدقيق اليومي المعتمد</div>
                          <div className="text-sm font-black font-sans text-amber-300">
                            {tasks.filter(t => t.supervisor_approved).length} / {tasks.length} بنود فحص
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-stretch md:self-auto justify-center">
                      <span>مستوى جودة التشغيل:</span>
                      <span className="bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded">A+ مميز</span>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: TASKS BOARD */}
              {activeTab === 'tasks' && (
                <div className="flex flex-col gap-4">
                  
                  {/* Top Bar with actions and switches */}
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setIsAssignModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition shadow-md shadow-indigo-600/15 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إسناد مهمة فورية</span>
                      </button>

                      <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                      {/* Search */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                        <input
                          type="text"
                          placeholder="بحث بالاسم أو الكود..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="text-xs pr-9 pl-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-400 w-48 bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* View mode toggle */}
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-100 rounded-xl p-0.5 flex">
                        <button
                          onClick={() => setTaskViewMode('table')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1 ${
                            taskViewMode === 'table' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <List className="w-3.5 h-3.5" /> جدول التفاصيل
                        </button>
                        <button
                          onClick={() => setTaskViewMode('kanban')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1 ${
                            taskViewMode === 'kanban' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <Grid className="w-3.5 h-3.5" /> لوحة كانبان
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Filters */}
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-3 items-center text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400">تصنيف المهام:</span>
                      <select
                        value={tasksSubFilter}
                        onChange={(e) => setTasksSubFilter(e.target.value)}
                        className="p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="all">كل بنود اليوم</option>
                        <option value="recurring">المتكررة (SOP)</option>
                        <option value="one_time">الفورية الطارئة</option>
                        <option value="rework">إعادة التنظيف</option>
                        <option value="late">المتأخرة فقط</option>
                        <option value="pending_approval">بانتظار الاعتماد</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400">حسب الموظف:</span>
                      <select
                        value={employeeFilter}
                        onChange={(e) => setEmployeeFilter(e.target.value)}
                        className="p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="all">جميع الموظفين</option>
                        {profiles.filter(p => p.role === "cleaner").map(p => (
                          <option key={p.id} value={p.id}>{p.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400">حسب منطقة وموقع الغرفة:</span>
                      <select
                        value={zoneFilter}
                        onChange={(e) => setZoneFilter(e.target.value)}
                        className="p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="all">جميع الغرف والمناطق</option>
                        {zones.map(z => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="text-left self-end pt-2">
                      <span className="text-[10px] font-bold bg-slate-100 py-1.5 px-3 rounded-full text-slate-600 border border-slate-200">
                        {getFilteredTasks().length} مهام معروضة
                      </span>
                    </div>
                  </div>

                  {/* Tasks Content Display */}
                  {taskViewMode === 'table' ? (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">رمز البند</th>
                            <th className="p-3">المهمة والوصف</th>
                            <th className="p-3">الغرفة / المنطقة</th>
                            <th className="p-3">الموظف المكلف</th>
                            <th className="p-3">الوقت الأقصى</th>
                            <th className="p-3">الحالة</th>
                            <th className="p-3">إثباتات النظافة</th>
                            <th className="p-3 text-center">الإجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {getFilteredTasks().map((task) => (
                            <tr key={task.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-500">{task.template?.task_code || "ONE_TIME"}</td>
                              <td className="p-3">
                                <span className="font-bold text-slate-800 block">{task.title}</span>
                                {task.task_type === "rework" && (
                                  <span className="text-[10px] bg-purple-100 text-purple-700 py-0.5 px-1.5 rounded-full font-bold mt-1 inline-block">
                                    طلب إعادة تنفيذ ⚠️
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-slate-600 font-medium">{task.zone?.name || "مقر الشركة"}</td>
                              <td className="p-3 text-slate-600 font-semibold">{task.assignee?.full_name || "غير محدد"}</td>
                              <td className="p-3 font-bold text-slate-700">{task.due_time || "17:00"}</td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full border inline-block ${
                                  task.status === "completed" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                                  task.status === "in_progress" ? "bg-amber-100 text-amber-800 border-amber-200" :
                                  task.status === "rejected" ? "bg-red-100 text-red-800 border-red-200" : "bg-gray-100 text-gray-600 border-gray-200"
                                }`}>
                                  {task.status === "completed" && task.supervisor_approved ? "مكتملة ومعتمدة ✅" :
                                   task.status === "completed" && !task.supervisor_approved ? "بانتظار الاعتماد ⏳" :
                                   task.status === "in_progress" ? "قيد التنفيذ ⚡" :
                                   task.status === "rejected" ? "مرفوضة / معطلة" : "معلقة"}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-1.5">
                                  {task.photo_before_url ? (
                                    <span className="text-[9px] bg-slate-100 py-0.5 px-1 text-slate-500 rounded border border-slate-200 flex items-center gap-0.5">قبل <Camera className="w-2.5 h-2.5" /></span>
                                  ) : null}
                                  {task.photo_after_url ? (
                                    <span className="text-[9px] bg-slate-100 py-0.5 px-1 text-slate-500 rounded border border-slate-200 flex items-center gap-0.5">بعد <Camera className="w-2.5 h-2.5" /></span>
                                  ) : null}
                                  {task.employee_signature_url ? (
                                    <span className="text-[9px] bg-slate-100 py-0.5 px-1 text-slate-500 rounded border border-slate-200 font-bold">توقيع</span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => {
                                    setReviewingTask(task);
                                    setActiveTab('approvals');
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                                >
                                  عرض ومراجعة
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* KANBAN BOARD VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* PENDING COLUMN */}
                      <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-slate-400 rounded-full"></span> معلقة بانتظار العمل
                          </h4>
                          <span className="bg-slate-200 text-slate-600 font-bold text-[10px] py-0.5 px-2 rounded-full">
                            {getFilteredTasks().filter(t => t.status === "pending").length}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          {getFilteredTasks().filter(t => t.status === "pending").map(task => (
                            <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:shadow hover:border-slate-300 cursor-pointer transition" onClick={() => setReviewingTask(task)}>
                              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                                <span>{task.template?.task_code || "ONE_TIME"}</span>
                                <span>وقت: {task.due_time}</span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-800 mt-1">{task.title}</h5>
                              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-3 border-t border-slate-50 pt-2">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {task.zone?.name}</span>
                                <span className="font-bold text-slate-600">{task.assignee?.full_name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* IN PROGRESS COLUMN */}
                      <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-extrabold text-amber-700 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-amber-400 rounded-full"></span> قيد التنظيف والعمل الآن
                          </h4>
                          <span className="bg-amber-100 text-amber-800 font-bold text-[10px] py-0.5 px-2 rounded-full">
                            {getFilteredTasks().filter(t => t.status === "in_progress").length}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          {getFilteredTasks().filter(t => t.status === "in_progress").map(task => (
                            <div key={task.id} className="bg-white border-2 border-amber-300 rounded-xl p-3.5 shadow-sm hover:shadow cursor-pointer transition" onClick={() => setReviewingTask(task)}>
                              <div className="flex justify-between items-center text-[9px] text-amber-600 font-bold">
                                <span>{task.template?.task_code || "ONE_TIME"}</span>
                                <span>انطلق: {new Date(task.started_at || "").toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-800 mt-1">{task.title}</h5>
                              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-3 border-t border-slate-50 pt-2">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {task.zone?.name}</span>
                                <span className="font-bold text-slate-600">{task.assignee?.full_name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* COMPLETED COLUMN */}
                      <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> مكتملة / بانتظار الاعتماد
                          </h4>
                          <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] py-0.5 px-2 rounded-full">
                            {getFilteredTasks().filter(t => t.status === "completed").length}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          {getFilteredTasks().filter(t => t.status === "completed").map(task => (
                            <div key={task.id} className={`bg-white border rounded-xl p-3.5 shadow-sm hover:shadow cursor-pointer transition ${task.supervisor_approved ? 'border-emerald-300' : 'border-purple-300'}`} onClick={() => { setReviewingTask(task); setActiveTab('approvals'); }}>
                              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                                <span>{task.template?.task_code || "ONE_TIME"}</span>
                                <span>{task.supervisor_approved ? "معتمدة" : "بحاجة لاعتماد"}</span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-800 mt-1">{task.title}</h5>
                              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-3 border-t border-slate-50 pt-2">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {task.zone?.name}</span>
                                <span className="font-bold text-slate-600">{task.assignee?.full_name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: APPROVAL QUEUE - Side-by-side or slider comparisons of cleaning before and after */}
              {activeTab === 'approvals' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: List of completed tasks waiting for audit */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-1 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">طابور انتظار المراجعة والاعتماد</h3>
                      <p className="text-xs text-slate-400 mt-0.5">يتطلب من المشرف فحص جودة العمل واعتماد تقييم A/B/C للموظف</p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {tasks.filter(t => t.status === "completed" && !t.supervisor_approved).length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <span className="text-xs font-bold block">لا توجد مهام تنتظر الاعتماد حالياً</span>
                          <span className="text-[10px] text-slate-400 block mt-1">المهام إما مكتملة معتمدة تلقائياً أو لم تكتمل بعد.</span>
                        </div>
                      ) : (
                        tasks.filter(t => t.status === "completed" && !t.supervisor_approved).map((task) => (
                          <div
                            key={task.id}
                            onClick={() => {
                              setReviewingTask(task);
                              setIsRejecting(false);
                            }}
                            className={`p-3 border rounded-xl cursor-pointer transition flex flex-col gap-1.5 ${
                              reviewingTask?.id === task.id ? "border-slate-800 bg-slate-50" : "border-slate-100 hover:bg-slate-50/50"
                            }`}
                          >
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                              <span>{task.template?.task_code || "ONE_TIME"}</span>
                              <span className="text-slate-500 font-bold">منجز: {task.due_time}</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 leading-tight">{task.title}</h4>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                              <span>غرفة: {task.zone?.name}</span>
                              <span className="font-bold text-slate-700">{task.assignee?.full_name}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: Detailed comparison before/after slider + Grade selection */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-2">
                    {reviewingTask ? (
                      <div className="flex flex-col gap-5">
                        
                        {/* Header details */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-[10px] bg-slate-100 py-0.5 px-2.5 rounded text-slate-600 font-bold mb-1.5 inline-block">
                              بند المعيار: {reviewingTask.template?.task_code || "مهمة طارئة"}
                            </span>
                            <h3 className="text-sm font-extrabold text-slate-800 leading-tight">{reviewingTask.title}</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              بالموقع: <span className="text-slate-700 font-semibold">{reviewingTask.zone?.name}</span> • 
                              منفذ بواسطة: <span className="text-slate-700 font-semibold">{reviewingTask.assignee?.full_name}</span>
                            </p>
                          </div>

                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 block font-bold">الوقت المستغرق فعلياً:</span>
                            <span className="text-xs font-extrabold text-slate-800">
                              {reviewingTask.started_at && reviewingTask.completed_at ? (
                                `${Math.round((new Date(reviewingTask.completed_at).getTime() - new Date(reviewingTask.started_at).getTime()) / 60000)} دقيقة`
                              ) : "غير مسجل"}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Before/After slider comparison */}
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-bold text-slate-600 block">مقارنة حالة التنظيف (قبل و بعد):</span>
                          
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            {/* Photo Before */}
                            <div className="flex flex-col gap-1 text-center">
                              <span className="text-[10px] font-bold text-slate-400 block">قبل التنظيف 📷</span>
                              <div className="aspect-video bg-slate-900 border border-slate-200 rounded-lg overflow-hidden">
                                {reviewingTask.photo_before_url ? (
                                  <img src={reviewingTask.photo_before_url} alt="قبل" className="w-full h-full object-contain" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px] font-semibold">
                                    صورة قبل غير مطلوبة/مرفوعة
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Photo After */}
                            <div className="flex flex-col gap-1 text-center">
                              <span className="text-[10px] font-bold text-emerald-500 block">بعد تلميع الموقع 📸</span>
                              <div className="aspect-video bg-slate-900 border border-slate-200 rounded-lg overflow-hidden">
                                {reviewingTask.photo_after_url ? (
                                  <img src={reviewingTask.photo_after_url} alt="بعد" className="w-full h-full object-contain" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px] font-semibold">
                                    لا توجد صورة بعد
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Signature view if present */}
                          {reviewingTask.employee_signature_url && (
                            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 mt-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-600">توقيع الموظف بالإصبع:</span>
                              <img src={reviewingTask.employee_signature_url} alt="توقيع" className="h-10 object-contain bg-white border border-slate-200 rounded-lg p-1" />
                            </div>
                          )}

                          {reviewingTask.employee_notes && (
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl mt-1 text-xs">
                              <span className="font-bold text-slate-600 block mb-1">ملاحظات الموظف عند التسليم:</span>
                              <p className="text-slate-500 leading-relaxed font-semibold italic">"{reviewingTask.employee_notes}"</p>
                            </div>
                          )}
                        </div>

                        {/* Audit / Action Forms */}
                        <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
                          
                          {!isRejecting ? (
                            <div className="flex flex-col gap-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-xs font-bold text-slate-700">تقييم جودة النظافة (Quality Grade):</label>
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { grade: 'A', label: 'ممتاز جودة A (100%)', color: 'border-emerald-500 text-emerald-600 hover:bg-emerald-50' },
                                      { grade: 'B', label: 'مقبول جودة B (80%)', color: 'border-amber-500 text-amber-600 hover:bg-amber-50' },
                                      { grade: 'C', label: 'ضعيف جودة C (60%)', color: 'border-rose-500 text-rose-600 hover:bg-rose-50' }
                                    ].map(g => (
                                      <button
                                        type="button"
                                        key={g.grade}
                                        onClick={() => setQualityGrade(g.grade as any)}
                                        className={`p-2 rounded-xl text-center text-xs font-bold border cursor-pointer transition ${
                                          qualityGrade === g.grade 
                                            ? "bg-slate-900 text-white border-slate-900 shadow" 
                                            : `bg-white ${g.color}`
                                        }`}
                                      >
                                        {g.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <label className="text-xs font-bold text-slate-700">ملاحظات المشرف (اختياري):</label>
                                  <input
                                    type="text"
                                    placeholder="مثال: تم تلميع الزجاج بجودة عالية جداً، شكراً لك"
                                    value={supervisorNotes}
                                    onChange={(e) => setSupervisorNotes(e.target.value)}
                                    className="text-xs p-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-3 justify-end mt-2">
                                <button
                                  type="button"
                                  onClick={() => setIsRejecting(true)}
                                  className="border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 text-xs font-bold py-2.5 px-6 rounded-xl cursor-pointer transition flex items-center gap-1.5"
                                >
                                  ❌ رفض وإعادة تنظيف (Rework)
                                </button>
                                <button
                                  type="button"
                                  onClick={handleApproveClick}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-8 rounded-xl cursor-pointer transition shadow flex items-center gap-1.5"
                                >
                                  ✅ اعتماد المهمة بنجاح
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Rejection Details Drawer Subview */
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-3">
                              <h4 className="text-xs font-bold text-red-800">تأكيد رفض المهمة وإرسالها لإعادة التنظيف</h4>
                              <p className="text-[11px] text-red-600">
                                عند الرفض، سيتم إعلام الموظف فوراً بالسبب، وسيولّد النظام تلقائياً مهمة إعادة تنفيذ (Rework) بالموقع لتدارك الخطأ.
                              </p>
                              
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-red-800">سبب الرفض والتعليمات المطلوبة (إجباري):</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="اكتب هنا ما لم يتم تنظيفه جيداً (مثال: توجد بصمات على زجاج الباب الأيسر لم يتم تلميعها)"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  className="text-xs p-2.5 border border-red-300 rounded-lg outline-none bg-white focus:border-red-500"
                                />
                              </div>

                              <div className="flex gap-2 justify-end mt-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setIsRejecting(false)}
                                  className="bg-white border border-slate-200 py-1.5 px-4 rounded-lg cursor-pointer hover:bg-slate-50 font-bold text-slate-600"
                                >
                                  تراجع وإلغاء
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRejectClick}
                                  className="bg-red-600 hover:bg-red-700 text-white py-1.5 px-5 rounded-lg cursor-pointer transition font-bold"
                                >
                                  تأكيد الرفض والإرسال ⚠️
                                </button>
                              </div>
                            </div>
                          )}

                        </div>

                      </div>
                    ) : (
                      <div className="text-center py-24 text-slate-400">
                        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-2 animate-bounce" />
                        <h4 className="text-sm font-bold text-slate-700">يرجى اختيار مهمة من القائمة للتدقيق والمراجعة</h4>
                        <p className="text-xs text-slate-400 mt-1">يظهر هنا التوقيع، ملاحظات الموظف وصور قبل/بعد بجودة عالية لاعتماد النظافة</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: EMPLOYEES KPIs REPORT */}
              {activeTab === 'kpis' && (
                <div className="flex flex-col gap-6">
                  
                  {/* KPI Summary Comparison Table */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">مقارنة أداء وتنافس الموظفين</h3>
                      <p className="text-xs text-slate-400 mt-0.5">جدول موضوعي مبني على احتساب البيانات اللحظية لإنجاز المهام اليومية بالدقة والميعاد المحدد</p>
                    </div>

                    <div className="overflow-x-auto mt-4">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">اسم الموظف</th>
                            <th className="p-3">إجمالي التكليفات اليومية</th>
                            <th className="p-3">مكتمل بالوقت المبرمج</th>
                            <th className="p-3">تأخيرات مسجلة</th>
                            <th className="p-3">إعادات تشغيل (Rework)</th>
                            <th className="p-3">معدل الانضباط والالتزام</th>
                            <th className="p-3">سرعة إنجاز البند</th>
                            <th className="p-3">متوسط تقييم الجودة</th>
                            <th className="p-3">حافز الأداء 🏆</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {kpis.map((kpi) => (
                            <tr key={kpi.profile_id} className="hover:bg-slate-50/50 font-medium">
                              <td className="p-3 font-extrabold text-slate-800 flex items-center gap-2">
                                <div className="bg-slate-200 text-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px]">
                                  {kpi.cleaner_name.slice(0, 2)}
                                </div>
                                {kpi.cleaner_name}
                              </td>
                              <td className="p-3 text-slate-700 font-bold">{kpi.tasks_assigned} مهام</td>
                              <td className="p-3 text-emerald-600 font-bold">{kpi.tasks_completed_on_time}</td>
                              <td className="p-3 text-rose-600 font-bold">{kpi.tasks_late}</td>
                              <td className="p-3 text-purple-600 font-bold">{kpi.tasks_reworked}</td>
                              <td className="p-3">
                                <span className={`font-bold py-0.5 px-2 rounded-full border ${
                                  kpi.compliance_rate >= 90 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  kpi.compliance_rate >= 80 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                  "bg-rose-50 text-rose-700 border-rose-200"
                                }`}>
                                  {kpi.compliance_rate}%
                                </span>
                              </td>
                              <td className="p-3 text-slate-600">{kpi.avg_execution_time_minutes} دقيقة</td>
                              <td className="p-3 text-slate-800 font-extrabold">{kpi.quality_score}%</td>
                              <td className="p-3">
                                {kpi.compliance_rate >= 90 ? (
                                  <span className="text-xs text-amber-600 font-bold flex items-center gap-1 bg-amber-50 py-1 px-2 rounded-full border border-amber-200 w-max">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> مرشحة للتميز
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">مستقر</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recharts KPI charts dashboard column */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Compliance bar chart */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <h4 className="text-xs font-bold text-slate-800 mb-4">معدل الانضباط والالتزام بالوقت للعمال (%)</h4>
                      
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={kpis} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="cleaner_name" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 100]} />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="compliance_rate" name="نسبة الانضباط (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="quality_score" name="تقييم الجودة (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Execution times comparing charts */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <h4 className="text-xs font-bold text-slate-800 mb-4">متوسط سرعة إنجاز بند التنظيف (بالدقائق)</h4>
                      
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={kpis} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="cleaner_name" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="avg_execution_time_minutes" name="الزمن بالدقائق" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 5: SOP MASTER TEMPLATES */}
              {activeTab === 'sop' && (
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">إدارة بنود ومقاييس الجودة (SOP Templates)</h3>
                      <p className="text-xs text-slate-400 mt-0.5">القائمة المرجعية للأعمال اليومية المتكررة والتي يولدها السيرفر تلقائياً بمواعيدها كل يوم</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplate({
                          task_code: `SOP_CLE0${templates.length + 1}`,
                          title: "",
                          category: "نظافة",
                          frequency: "يومي",
                          requires_photo_before: true,
                          requires_photo_after: true,
                          requires_supervisor_approval: true,
                          requires_signature: false,
                          is_active: true
                        });
                        setIsSopModalOpen(true);
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> إضافة بند معياري جديد
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">رمز البند</th>
                          <th className="p-3">عنوان البند والهدف</th>
                          <th className="p-3">التصنيف</th>
                          <th className="p-3">التكرار والجدولة</th>
                          <th className="p-3">المعدات والمطهرات المطلوبة</th>
                          <th className="p-3">الشروط والإثباتات</th>
                          <th className="p-3">المسؤول الافتراضي</th>
                          <th className="p-3 text-center">الإجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {templates.map((tpl) => {
                          const zone = zones.find(z => z.id === tpl.zone_id);
                          const assignee = profiles.find(p => p.id === tpl.default_assignee_id);
                          return (
                            <tr key={tpl.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-blue-600">{tpl.task_code}</td>
                              <td className="p-3 max-w-xs">
                                <span className="font-bold text-slate-800 block">{tpl.title}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium leading-relaxed">
                                  الغرفة: <span className="text-slate-600 font-bold">{zone?.name || "عام"}</span>
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="bg-slate-100 py-0.5 px-2 rounded-full text-slate-700 text-[10px] font-bold">
                                  {tpl.category}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="block font-bold text-slate-800">{tpl.frequency}</span>
                                <span className="text-[10px] text-slate-400 block font-medium">ساعة: {tpl.scheduled_time || "08:00"}</span>
                              </td>
                              <td className="p-3 max-w-xs text-slate-500 font-semibold leading-relaxed text-[11px]">{tpl.tools_required || "لا توجد أدوات خاصة"}</td>
                              <td className="p-3">
                                <div className="flex flex-col gap-0.5 text-[9px] text-slate-400">
                                  {tpl.requires_photo_before && <span>• صورة قبل</span>}
                                  {tpl.requires_photo_after && <span>• صورة بعد</span>}
                                  {tpl.requires_supervisor_approval && <span>• مراجعة المشرف</span>}
                                  {tpl.requires_signature && <span>• توقيع الموظف</span>}
                                </div>
                              </td>
                              <td className="p-3 font-semibold text-slate-600">{assignee?.full_name || "توزيع مرن"}</td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTemplate(tpl);
                                      setIsSopModalOpen(true);
                                    }}
                                    className="text-xs text-slate-600 hover:text-slate-800 font-bold bg-slate-100 py-1 px-2 rounded-lg cursor-pointer transition"
                                  >
                                    تعديل
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: OPERATIONAL SCHEDULES */}
              {activeTab === 'operational' && (
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">البنود التشغيلية والتحكم التفاعلي</h3>
                    <p className="text-xs text-slate-400 mt-0.5">لوحة متابعة إضاءة الممرات، النوافير، والساوند سيستم بجميع أرجاء مقر النرجس على مدار اليوم</p>
                  </div>

                  {/* Gantt / Schedule Timeline Layout visually */}
                  <div className="flex flex-col gap-5 mt-6">
                    {operationalTasks.map((ot) => {
                      const zone = zones.find(z => z.id === ot.zone_id);
                      return (
                        <div key={ot.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="max-w-md">
                            <span className="text-[10px] bg-slate-100 py-0.5 px-2 rounded font-bold text-slate-600 mb-1 inline-block">
                              موقع: {zone?.name || "المدخل الرئيسي"}
                            </span>
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Power className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                              {ot.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{ot.description}</p>
                          </div>

                          {/* Time Slots Visualization */}
                          <div className="flex items-center gap-1 flex-1 w-full md:w-auto md:max-w-md bg-white p-2.5 rounded-lg border border-slate-100 text-[10px]">
                            {ot.schedule_windows?.map((window, idx) => (
                              <div key={idx} className="flex-1 text-center border-l border-slate-100 last:border-0 p-1 bg-blue-50/50 rounded">
                                <span className="font-extrabold text-blue-800 block">{window.from} - {window.to}</span>
                                <span className="text-slate-400 font-semibold block text-[9px] mt-0.5">{window.mode}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 self-end md:self-auto">
                            <div className="text-left text-xs">
                              <span className="text-[10px] text-slate-400 block font-bold">المشغل المسؤول:</span>
                              <span className="font-semibold text-slate-700">{ot.responsible_employee?.full_name || "عفاف أحمد"}</span>
                            </div>
                            
                            <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] py-1 px-3 rounded-full border border-emerald-200">
                              مفعل تلقائياً
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </>
          )}

        </main>
      </div>

      {/* QUICK ASSIGN TASK OVERLAY MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-800">إسناد وتكليف مهمة فورية جديدة</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTaskSubmit} className="flex flex-col gap-4 text-xs font-semibold text-slate-700">
              <div className="flex flex-col gap-1">
                <label>عنوان ووصف المهمة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مسح زجاج الواجهة الرئيسي"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({...newTaskData, title: e.target.value})}
                  className="p-2.5 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label>الوصف المفصل والتعليمات:</label>
                <textarea
                  placeholder="مثال: يرجى تنظيف بقع الأتربة ومسح المياه الزائدة من السلم"
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
                  rows={2}
                  className="p-2 border border-slate-200 rounded-lg outline-none resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label>الموظف المسؤول:</label>
                  <select
                    required
                    value={newTaskData.assigned_to}
                    onChange={(e) => setNewTaskData({...newTaskData, assigned_to: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">اختر الموظف...</option>
                    {profiles.filter(p => p.role === "cleaner").map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label>موقع الغرفة / المنطقة:</label>
                  <select
                    required
                    value={newTaskData.zone_id}
                    onChange={(e) => setNewTaskData({...newTaskData, zone_id: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">اختر المنطقة...</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label>موعد الاستحقاق النهائي اليوم:</label>
                <input
                  type="time"
                  value={newTaskData.due_time}
                  onChange={(e) => setNewTaskData({...newTaskData, due_time: e.target.value})}
                  className="p-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl cursor-pointer transition shadow"
              >
                تأكيد الإسناد وإعلام الموظف ✅
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SOP TEMPLATE CONFIGURATION MODAL */}
      {isSopModalOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-800">إضافة/تعديل بند معيار الـ SOP الموحد</h3>
              <button onClick={() => { setIsSopModalOpen(false); setSelectedTemplate(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSopTemplate} className="flex flex-col gap-3.5 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label>رمز البند (كود SOP):</label>
                  <input
                    type="text"
                    required
                    placeholder="SOP_CLE01"
                    value={selectedTemplate.task_code || ""}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, task_code: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1 col-span-2">
                  <label>عنوان البند وموضوع العمل:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تلميع أثاث صالة الاستقبال"
                    value={selectedTemplate.title || ""}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, title: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label>الهدف الرئيسي من البند (SOP Goal):</label>
                <input
                  type="text"
                  placeholder="مثال: الحفاظ على مظهر استقبال نظيف ومشرق وجاذب للزوار"
                  value={selectedTemplate.goal || ""}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, goal: e.target.value})}
                  className="p-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label>التعليمات وخطوات التنفيذ بالتفصيل:</label>
                <textarea
                  placeholder="اكتب الخطوات التفصيلية بدقة..."
                  value={selectedTemplate.description || ""}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, description: e.target.value})}
                  rows={2}
                  className="p-2 border border-slate-200 rounded-lg outline-none resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label>موقع الغرفة / المنطقة المخصصة لها:</label>
                  <select
                    required
                    value={selectedTemplate.zone_id || ""}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, zone_id: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">اختر المنطقة...</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label>المسؤول الافتراضي (Assignee):</label>
                  <select
                    value={selectedTemplate.default_assignee_id || ""}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, default_assignee_id: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">توزيع تلقائي مرن</option>
                    {profiles.filter(p => p.role === "cleaner").map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label>التصنيف:</label>
                  <select
                    value={selectedTemplate.category || "نظافة"}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, category: e.target.value as any})}
                    className="p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="نظافة">نظافة</option>
                    <option value="تشغيل">تشغيل</option>
                    <option value="صيانة">صيانة</option>
                    <option value="سلامة">سلامة</option>
                    <option value="جودة">جودة</option>
                    <option value="تجهيز">تجهيز</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label>توقيت الجدولة المعتاد:</label>
                  <input
                    type="time"
                    value={selectedTemplate.scheduled_time || "08:00"}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, scheduled_time: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label>التكرار:</label>
                  <select
                    value={selectedTemplate.frequency || "يومي"}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, frequency: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="يومي">يومي</option>
                    <option value="أسبوعي">أسبوعي</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label>أدوات التنظيف المطلوبة والمواد المحددة:</label>
                <input
                  type="text"
                  placeholder="مثال: بخاخ مطهر + فوطة مايكروفايبر صفراء"
                  value={selectedTemplate.tools_required || ""}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, tools_required: e.target.value})}
                  className="p-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              {/* Toggle Switches */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTemplate.requires_photo_before ?? true}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, requires_photo_before: e.target.checked})}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <span>تطلب صورة قبل البدء؟</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTemplate.requires_photo_after ?? true}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, requires_photo_after: e.target.checked})}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <span>تطلب صورة إثبات بعد؟</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTemplate.requires_supervisor_approval ?? true}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, requires_supervisor_approval: e.target.checked})}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <span>تتطلب اعتماد المشرف؟</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTemplate.requires_signature ?? false}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, requires_signature: e.target.checked})}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <span>تتطلب توقيع الموظف بالإصبع؟</span>
                </label>
              </div>

              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl cursor-pointer transition shadow mt-3"
              >
                حفظ معيار الجودة بالدليل الموحد ✅
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ZONE DETAIL VIEW OVERLAY */}
      {selectedZoneDetail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <span className="text-[9px] text-slate-400 font-bold block">{selectedZoneDetail.code} • {selectedZoneDetail.floor}</span>
                <h3 className="text-xs font-extrabold text-slate-800">{selectedZoneDetail.name}</h3>
              </div>
              <button onClick={() => setSelectedZoneDetail(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-600 block">مهام الغرفة اليوم:</span>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {tasks.filter(t => t.zone_id === selectedZoneDetail.id).length === 0 ? (
                  <span className="text-xs text-slate-400 text-center py-4">لا توجد مهام مقررة اليوم في هذه الغرفة</span>
                ) : (
                  tasks.filter(t => t.zone_id === selectedZoneDetail.id).map(task => (
                    <div key={task.id} className="p-2 border border-slate-100 rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{task.title}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">مسؤول: {task.assignee?.full_name}</span>
                      </div>
                      <span className={`text-[9px] font-bold py-0.5 px-1.5 rounded border ${
                        task.status === "completed" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                        task.status === "in_progress" ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {task.status === "completed" ? "مكتمل" : task.status === "in_progress" ? "قيد العمل" : "معلق"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
