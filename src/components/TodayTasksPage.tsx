import React, { useState, useEffect, useRef } from "react";
import { 
  CheckCircle2, 
  Clock, 
  Camera, 
  PenTool, 
  MapPin, 
  Play, 
  Check, 
  AlertTriangle, 
  ChevronLeft, 
  BookOpen, 
  Wrench, 
  FileText, 
  Send,
  Loader2,
  Calendar,
  Sparkles
} from "lucide-react";
import { Profile, TaskInstance, Zone, TaskTemplate } from "../types";
import { getTasks, updateTask } from "../lib/api";
import PhotoCapture from "./PhotoCapture";

function getLocalDateString() {
  const date = new Date();
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().split("T")[0];
}

interface TodayTasksPageProps {
  user: Profile;
  onLogout: () => void;
  onNavigateToKpis: () => void;
}

export default function TodayTasksPage({ user, onLogout, onNavigateToKpis }: TodayTasksPageProps) {
  const [tasks, setTasks] = useState<(TaskInstance & { zone?: Zone; assignee?: Profile; template?: TaskTemplate })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<(TaskInstance & { zone?: Zone; assignee?: Profile; template?: TaskTemplate }) | null>(null);
  
  // Executing state
  const [executingStep, setExecutingStep] = useState<'details' | 'before_photo' | 'after_photo' | 'signature_and_notes'>('details');
  const [photoBefore, setPhotoBefore] = useState<string | null>(null);
  const [photoAfter, setPhotoAfter] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Canvas ref for signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      // Only show tasks assigned to this cleaner
      const myTasks = data.filter((t: any) => t.assigned_to === user.id);
      setTasks(myTasks);
    } catch (err) {
      console.error(err);
      showToast("فشل في تحميل مهام اليوم", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user.id]);

  // Filter logic
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return t.status === "pending";
    if (activeTab === "in_progress") return t.status === "in_progress";
    if (activeTab === "completed") return t.status === "completed";
    if (activeTab === "rework") return t.status === "rejected" || t.task_type === "rework";
    return true;
  });

  const getStatusColor = (status: string, taskType?: string) => {
    if (taskType === "rework") return "bg-purple-100 text-purple-800 border-purple-200";
    switch (status) {
      case "pending": return "bg-gray-100 text-gray-700 border-gray-200";
      case "in_progress": return "bg-amber-100 text-amber-800 border-amber-200";
      case "completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "late": return "bg-rose-100 text-rose-800 border-rose-200";
      case "escalated": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status: string, taskType?: string) => {
    if (taskType === "rework" && status === "pending") return "إعادة تنظيف ⚠️";
    switch (status) {
      case "pending": return "معلقة";
      case "in_progress": return "قيد التنفيذ ⚡";
      case "completed": return "مكتملة";
      case "rejected": return "مرفوضة / بحاجة لإعادة ⚠️";
      case "late": return "متأخرة ⏰";
      case "escalated": return "مصعّدة";
      default: return status;
    }
  };

  // Start executing task
  const handleStartTask = async () => {
    if (!selectedTask) return;
    
    const requiresPhotoBefore = selectedTask.template ? selectedTask.template.requires_photo_before : true;

    if (requiresPhotoBefore) {
      // Go to take before photo
      setExecutingStep('before_photo');
    } else {
      // Transition immediately to in_progress in API
      try {
        setIsSubmitting(true);
        const updated = await updateTask(selectedTask.id, { status: 'in_progress' });
        showToast("تم بدء المهمة بنجاح، بالتوفيق! 👍", "success");
        
        // Refresh local items
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...updated } : t));
        setSelectedTask(prev => prev ? { ...prev, ...updated } : null);
        setExecutingStep('details');
      } catch (err) {
        console.error(err);
        showToast("فشل في تحديث حالة المهمة", "error");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Confirm photo before and transition to in_progress
  const handlePhotoBeforeSubmitted = async (url: string) => {
    if (!selectedTask) return;
    setPhotoBefore(url);
    
    try {
      setIsSubmitting(true);
      const updated = await updateTask(selectedTask.id, { 
        photo_before_url: url,
        status: 'in_progress' 
      });
      showToast("تم تسجيل صورة قبل وبدء المهمة! ⚡", "success");
      
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...updated } : t));
      setSelectedTask(prev => prev ? { ...prev, ...updated } : null);
      
      // Return to details showing that it is now in progress
      setExecutingStep('details');
    } catch (err) {
      console.error(err);
      showToast("حدث خطأ أثناء حفظ صورة قبل", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete task flow trigger
  const handleFinishTaskClick = () => {
    if (!selectedTask) return;
    const requiresPhotoAfter = selectedTask.template ? selectedTask.template.requires_photo_after : true;

    if (requiresPhotoAfter) {
      setExecutingStep('after_photo');
    } else {
      // Skip photo after and go to signature or submit directly
      goToSignatureOrSubmit();
    }
  };

  const handlePhotoAfterSubmitted = (url: string) => {
    setPhotoAfter(url);
    goToSignatureOrSubmit();
  };

  const goToSignatureOrSubmit = () => {
    if (!selectedTask) return;
    const requiresSignature = selectedTask.template ? selectedTask.template.requires_signature : false;

    if (requiresSignature) {
      setExecutingStep('signature_and_notes');
    } else {
      // Submit immediately
      submitTaskCompleted();
    }
  };

  const submitTaskCompleted = async (signatureUrl?: string) => {
    if (!selectedTask) return;
    setIsSubmitting(true);
    
    try {
      const updates: Partial<TaskInstance> = {
        status: 'completed',
        employee_notes: notes,
        photo_after_url: photoAfter || undefined,
        employee_signature_url: signatureUrl || undefined
      };

      const updated = await updateTask(selectedTask.id, updates);
      
      const approvalRequired = selectedTask.template ? selectedTask.template.requires_supervisor_approval : true;
      if (approvalRequired) {
        showToast("أحسنت! تم تسليم المهمة وهي بانتظار اعتماد المشرف ⏳", "success");
      } else {
        showToast("أحسنت! تم إكمال المهمة بنجاح وتقفيلها 🎉", "success");
      }

      // Reset states
      setSelectedTask(null);
      setPhotoBefore(null);
      setPhotoAfter(null);
      setNotes("");
      setHasSigned(false);
      
      // Refresh task list
      fetchTasks();
    } catch (err) {
      console.error(err);
      showToast("فشل تسليم المهمة. يرجى المحاولة لاحقاً.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Canvas Drawing Handlers for Finger/Mouse Signatures
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ("touches" in e) {
      // Prevent scrolling on touch devices while signing
      if (e.cancelable) e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSignatureSubmit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (!hasSigned) {
      showToast("يرجى كتابة التوقيع أولاً بإصبعك", "warning");
      return;
    }

    // Export canvas as data URI
    const signatureDataUrl = canvas.toDataURL("image/png");
    submitTaskCompleted(signatureDataUrl);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 md:left-auto md:w-96 z-50 p-4 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 flex items-center gap-3 ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
          toast.type === "error" ? "bg-rose-50 text-rose-800 border-rose-200" :
          "bg-amber-50 text-amber-800 border-amber-200"
        }`}>
          {toast.type === "success" && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
          {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
          {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Modern Top Employee Bar */}
      <div className="bg-slate-900 text-white rounded-b-3xl shadow-md p-6">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                تشغيل العمليات • Naris Ops
              </span>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                مرحباً، {user.full_name} 👋
              </h2>
              <span className="text-xs text-slate-400 mt-1 inline-block bg-slate-800 py-0.5 px-2 rounded-md border border-slate-700">
                فترة الدوام: {user.shift_start} - {user.shift_end}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={onNavigateToKpis}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 px-3 rounded-xl font-semibold cursor-pointer shadow-md shadow-indigo-600/15 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" /> مؤشراتي 🏆
              </button>
              <button
                onClick={onLogout}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 px-3 rounded-xl font-semibold cursor-pointer transition border border-slate-700"
              >
                خروج
              </button>
            </div>
          </div>

          {/* Core Daily Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6 bg-slate-800/60 border border-slate-800 p-3 rounded-2xl">
            <div className="text-center">
              <span className="text-2xl font-extrabold text-white">{tasks.length}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">إجمالي المهام</span>
            </div>
            <div className="text-center border-x border-slate-800">
              <span className="text-2xl font-extrabold text-emerald-400">
                {tasks.filter(t => t.status === "completed").length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">المكتملة</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-extrabold text-amber-400">
                {tasks.filter(t => t.status === "pending" || t.status === "in_progress").length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">بانتظار العمل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Task Feed Container */}
      <div className="max-w-md mx-auto p-4 mt-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4 px-1">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>جدول مهام اليوم:</span>
          <span className="bg-slate-200 text-slate-700 py-0.5 px-2 rounded-full">
            {getLocalDateString()}
          </span>
        </div>

        {/* Categories / Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none px-1">
          {[
            { id: "all", label: "الكل" },
            { id: "pending", label: "معلقة" },
            { id: "in_progress", label: "قيد التنفيذ" },
            { id: "completed", label: "مكتملة" },
            { id: "rework", label: "إعادة التنظيف ⚠️" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <span className="text-xs font-semibold">جاري تحميل المهام...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center mt-4">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">لا توجد مهام في هذا التصنيف حالياً</p>
            <p className="text-xs text-slate-400 mt-1">العمليات تسير بشكل رائع وممتاز!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTask(task);
                  setExecutingStep('details');
                }}
                className={`bg-white border hover:border-slate-300 rounded-2xl p-4 shadow-sm hover:shadow transition duration-200 cursor-pointer flex justify-between items-center relative overflow-hidden ${
                  task.task_type === "rework" ? "border-purple-300 bg-purple-50/20" : "border-slate-200"
                }`}
              >
                {/* Rework left banner indicator */}
                {task.task_type === "rework" && (
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-purple-500"></div>
                )}

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full border ${getStatusColor(task.status, task.task_type)}`}>
                      {getStatusLabel(task.status, task.task_type)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {task.template?.task_code || "ONE_TIME"}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 mt-1">
                    {task.title}
                  </h3>

                  <div className="flex items-center gap-3 text-slate-500 mt-1">
                    <span className="text-xs flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {task.zone?.name || "مقر الشركة"}
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      قبل {task.due_time || "17:00"}
                    </span>
                  </div>

                  {/* Mandatories Indicators */}
                  <div className="flex gap-2 mt-2">
                    {task.template?.requires_photo_before && (
                      <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 py-0.5 px-1.5 rounded flex items-center gap-0.5">
                        <Camera className="w-3 h-3" /> صورة قبل
                      </span>
                    )}
                    {task.template?.requires_photo_after && (
                      <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 py-0.5 px-1.5 rounded flex items-center gap-0.5">
                        <Camera className="w-3 h-3" /> صورة بعد
                      </span>
                    )}
                    {task.template?.requires_signature && (
                      <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 py-0.5 px-1.5 rounded flex items-center gap-0.5">
                        <PenTool className="w-3 h-3" /> توقيع
                      </span>
                    )}
                  </div>
                </div>

                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Modal / Detail Drawer Sheet */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-xl max-h-[92vh] overflow-y-auto pb-8 flex flex-col transform translate-y-0 transition-transform duration-300">
            
            {/* Drawer Header */}
            <div className="border-b border-slate-100 p-4 sticky top-0 bg-white z-10 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setSelectedTask(null);
                  setPhotoBefore(null);
                  setPhotoAfter(null);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1 bg-slate-100 py-1.5 px-3 rounded-full"
              >
                إغلاق النافذة
              </button>
              <h3 className="text-sm font-bold text-slate-800">
                {selectedTask.task_type === "rework" ? "إعادة تنفيذ المهمة" : "تفاصيل المهمة"}
              </h3>
              <div className="w-16"></div> {/* Spacer for symmetry */}
            </div>

            {/* Modal Body depending on executingStep */}
            <div className="p-5 flex-1">
              
              {/* STEP 1: Details & Start */}
              {executingStep === 'details' && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className={`text-[10px] font-bold py-0.5 px-2.5 rounded-full border inline-block mb-1.5 ${getStatusColor(selectedTask.status, selectedTask.task_type)}`}>
                        {getStatusLabel(selectedTask.status, selectedTask.task_type)}
                      </span>
                      <h2 className="text-base font-bold text-slate-800 leading-snug">
                        {selectedTask.title}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">المنطقة والموقع:</span>
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {selectedTask.zone?.name || "مقر الشركة"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">وقت التسليم المحدد:</span>
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        قبل الساعة {selectedTask.due_time || "17:00"}
                      </span>
                    </div>
                  </div>

                  {/* SOP Specific Guidelines */}
                  <div className="flex flex-col gap-3 mt-1">
                    {selectedTask.template?.goal && (
                      <div className="flex items-start gap-2.5">
                        <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-100">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">الهدف من البند (SOP):</span>
                          <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
                            {selectedTask.template.goal}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedTask.template?.tools_required && (
                      <div className="flex items-start gap-2.5">
                        <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg border border-blue-100">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">المعدات والمطهرات المطلوبة:</span>
                          <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
                            {selectedTask.template.tools_required}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2.5">
                      <div className="bg-slate-50 text-slate-600 p-1.5 rounded-lg border border-slate-200">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">خطوات وتعليمات العمل بالتفصيل:</span>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                          {selectedTask.description || "تنظيف وتجهيز الموقع على النحو المطلوب طبقا للمعايير السليمة."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* If rejected, show why */}
                  {selectedTask.status === "rejected" && selectedTask.supervisor_notes && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mt-2 text-red-800 flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold block">ملاحظات وسبب الرفض من المشرف:</span>
                        <p className="text-xs mt-1 font-semibold leading-relaxed">
                          {selectedTask.supervisor_notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Core Action Footer inside Drawer */}
                  <div className="mt-6">
                    {selectedTask.status === "pending" && (
                      <button
                        type="button"
                        onClick={handleStartTask}
                        disabled={isSubmitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition shadow-md shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Play className="w-5 h-5" />
                            <span>ابدأ التنفيذ الآن</span>
                          </>
                        )}
                      </button>
                    )}

                    {selectedTask.status === "in_progress" && (
                      <button
                        type="button"
                        onClick={handleFinishTaskClick}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>إنهاء المهمة وتسليمها</span>
                      </button>
                    )}

                    {selectedTask.status === "completed" && (
                      <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-center text-xs font-bold">
                        {selectedTask.supervisor_approved ? (
                          <p className="flex items-center justify-center gap-1.5 text-sm text-emerald-700">
                            <CheckCircle2 className="w-5 h-5" /> تم التنفيذ والاعتماد بنجاح بتقدير ({selectedTask.quality_grade})
                          </p>
                        ) : (
                          <p className="flex items-center justify-center gap-1.5">
                            <Clock className="w-4 h-4 animate-spin text-emerald-600" /> تم التسليم، بانتظار مراجعة واعتماد المشرف...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Before Photo */}
              {executingStep === 'before_photo' && (
                <div className="flex flex-col gap-4">
                  <div className="text-center mb-2">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-1.5" />
                    <h3 className="text-sm font-bold text-slate-800">صورة ما قبل البدء مطلوبة</h3>
                    <p className="text-xs text-slate-400 mt-1">يرجى تصوير حالة المكان "قبل التنظيف" كدليل إثبات للمهمة</p>
                  </div>

                  <PhotoCapture 
                    label="صورة المكان قبل التنظيف" 
                    onPhotoUploaded={handlePhotoBeforeSubmitted} 
                    required={true}
                  />

                  {isSubmitting && (
                    <div className="flex justify-center items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> جاري الحفظ والتسجيل...
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: After Photo */}
              {executingStep === 'after_photo' && (
                <div className="flex flex-col gap-4">
                  <div className="text-center mb-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-1.5 animate-bounce" />
                    <h3 className="text-sm font-bold text-slate-800">صورة إثبات التنظيف مطلوبة</h3>
                    <p className="text-xs text-slate-400 mt-1">يرجى تصوير المكان بدقة بعد إنهاء التنظيف ليرى المشرف جودة عملك</p>
                  </div>

                  <PhotoCapture 
                    label="صورة المكان بعد التنظيف" 
                    onPhotoUploaded={handlePhotoAfterSubmitted} 
                    required={true}
                  />
                </div>
              )}

              {/* STEP 4: Signature and Optional Notes */}
              {executingStep === 'signature_and_notes' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">الخطوة الأخيرة: التوقيع والملاحظات</h3>
                    <p className="text-xs text-slate-400 mt-0.5">يرجى كتابة اسمك/توقيعك بإصبعك على اللوحة وكتابة أي ملاحظات</p>
                  </div>

                  {/* Notes */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">ملاحظاتك للمشرف (اختياري):</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="مثال: تم مسح الموقع بالكامل وملء مناديل الديتول..."
                      rows={2}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 resize-none outline-none"
                    ></textarea>
                  </div>

                  {/* Canvas Signature Drawer */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-600">توقيع الموظف بالإصبع:</label>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 py-0.5 px-2 rounded cursor-pointer"
                      >
                        مسح التوقيع
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden relative">
                      <canvas
                        ref={canvasRef}
                        width={350}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[120px] block cursor-crosshair touch-none"
                      />
                      {!hasSigned && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-[10px] pointer-events-none">
                          وقّع هنا بإصبعك
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignatureSubmit}
                    disabled={isSubmitting || !hasSigned}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>تسليم المهمة النهائية ✅</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
