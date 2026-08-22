import React from "react";
import type { AdminDashboardModel } from "../../hooks/useAdminDashboard";
import {
  AlertTriangle, BarChart2, BookOpen, Box, Camera, CheckCircle, ChevronLeft, Clock,
  Edit2, Grid, Lightbulb, List, Loader2, MapPin, Plus, Power, Search, Settings,
  ShieldCheck, SlidersHorizontal, Sparkles, Trash2, User, UserCheck, UserX, Users, X, Zap,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";


type AdminModalsProps = { dashboard: AdminDashboardModel };

export default function AdminModals({ dashboard }: AdminModalsProps) {
  const tasks = dashboard.tasks;
  const profiles = dashboard.profiles;
  const zones = dashboard.zones;
  const loading = dashboard.loading;
  const loadingZones = dashboard.loadingZones;
  const loadingProfiles = dashboard.loadingProfiles;
  const isSavingTemplate = dashboard.isSavingTemplate;
  const isSavingTask = dashboard.isSavingTask;
  const validationReport = dashboard.validationReport;
  const showToast = dashboard.showToast;
  const isAddEmployeeModalOpen = dashboard.isAddEmployeeModalOpen;
  const setIsAddEmployeeModalOpen = dashboard.setIsAddEmployeeModalOpen;
  const handleAddEmployee = dashboard.handleAddEmployee;
  const setEmployeeFullName = dashboard.setEmployeeFullName;
  const setEmployeeUsername = dashboard.setEmployeeUsername;
  const setEmployeePhone = dashboard.setEmployeePhone;
  const setEmployeeRole = dashboard.setEmployeeRole;
  const isValidatingDb = dashboard.isValidatingDb;
  const isUploadingZoneImg = dashboard.isUploadingZoneImg;
  const selectedDate = dashboard.selectedDate;
  const isAssignModalOpen = dashboard.isAssignModalOpen;
  const setIsAssignModalOpen = dashboard.setIsAssignModalOpen;
  const newTaskData = dashboard.newTaskData;
  const setNewTaskData = dashboard.setNewTaskData;
  const isSopModalOpen = dashboard.isSopModalOpen;
  const setIsSopModalOpen = dashboard.setIsSopModalOpen;
  const selectedTemplate = dashboard.selectedTemplate;
  const setSelectedTemplate = dashboard.setSelectedTemplate;
  const uploadingReference = dashboard.uploadingReference;
  const isConfirmingDelete = dashboard.isConfirmingDelete;
  const setIsConfirmingDelete = dashboard.setIsConfirmingDelete;
  const selectedZoneDetail = dashboard.selectedZoneDetail;
  const setSelectedZoneDetail = dashboard.setSelectedZoneDetail;
  const reviewingTask = dashboard.reviewingTask;
  const qualityGrade = dashboard.qualityGrade;
  const setQualityGrade = dashboard.setQualityGrade;
  const supervisorNotes = dashboard.supervisorNotes;
  const setSupervisorNotes = dashboard.setSupervisorNotes;
  const rejectionReason = dashboard.rejectionReason;
  const setRejectionReason = dashboard.setRejectionReason;
  const isRejecting = dashboard.isRejecting;
  const setIsRejecting = dashboard.setIsRejecting;
  const sliderPosition = dashboard.sliderPosition;
  const setSliderPosition = dashboard.setSliderPosition;
  const createdEmployeeCredentials = dashboard.createdEmployeeCredentials;
  const setCreatedEmployeeCredentials = dashboard.setCreatedEmployeeCredentials;
  const editingEmployee = dashboard.editingEmployee;
  const setEditingEmployee = dashboard.setEditingEmployee;
  const deactivatingEmployee = dashboard.deactivatingEmployee;
  const setDeactivatingEmployee = dashboard.setDeactivatingEmployee;
  const employeeFullName = dashboard.employeeFullName;
  const employeeUsername = dashboard.employeeUsername;
  const employeeRole = dashboard.employeeRole;
  const employeePhone = dashboard.employeePhone;
  const empActionLoading = dashboard.empActionLoading;
  const handleAssignTaskSubmit = dashboard.handleAssignTaskSubmit;
  const handleSaveSopTemplate = dashboard.handleSaveSopTemplate;
  const handleDeleteSopTemplate = dashboard.handleDeleteSopTemplate;
  const handleReferenceImageUpload = dashboard.handleReferenceImageUpload;
  const handleZoneImageUpload = dashboard.handleZoneImageUpload;
  const executeToggleEmployeeStatus = dashboard.executeToggleEmployeeStatus;
  const getEligibleCleaners = dashboard.getEligibleCleaners;
  const handleEditEmployee = dashboard.handleEditEmployee;
  const handleProvisionAccess = dashboard.handleProvisionAccess;
  const handleApproveClick = dashboard.handleApproveClick;
  const handleRejectClick = dashboard.handleRejectClick;
  const selectReviewTask = dashboard.selectReviewTask;
  const handleToggleEmployeeStatus = dashboard.handleToggleEmployeeStatus;
  return (
    <>
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
                <label className="flex justify-between items-center">
                  <span>عنوان ووصف المهمة:</span>
                  {isSavingTask && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                </label>
                <input
                  type="text"
                  required
                  disabled={loading || isSavingTask}
                  placeholder="مثال: مسح زجاج الواجهة الرئيسي"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({...newTaskData, title: e.target.value})}
                  className="p-2.5 border border-slate-200 rounded-lg outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="flex justify-between items-center">
                  <span>الوصف المفصل والتعليمات:</span>
                  {isSavingTask && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                </label>
                <textarea
                  disabled={loading || isSavingTask}
                  placeholder="مثال: يرجى تنظيف بقع الأتربة ومسح المياه الزائدة من السلم"
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
                  rows={2}
                  className="p-2 border border-slate-200 rounded-lg outline-none resize-none disabled:bg-slate-50 disabled:text-slate-400"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="flex justify-between items-center">
                    <span>الموظف المسؤول:</span>
                    {loadingProfiles && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                  </label>
                  <select
                    required
                    disabled={loading || isSavingTask || loadingProfiles}
                    value={newTaskData.assigned_to}
                    onChange={(e) => setNewTaskData({...newTaskData, assigned_to: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">اختر الموظف...</option>
                    {getEligibleCleaners(profiles).map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="flex justify-between items-center">
                    <span>موقع الغرفة / المنطقة:</span>
                    {loadingZones && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                  </label>
                  <select
                    required
                    disabled={loading || isSavingTask || loadingZones}
                    value={newTaskData.zone_id}
                    onChange={(e) => setNewTaskData({...newTaskData, zone_id: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">اختر المنطقة...</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="flex justify-between items-center">
                  <span>موعد الاستحقاق النهائي اليوم:</span>
                  {isSavingTask && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                </label>
                <input
                  type="time"
                  disabled={loading || isSavingTask}
                  value={newTaskData.due_time}
                  onChange={(e) => setNewTaskData({...newTaskData, due_time: e.target.value})}
                  className="p-2 border border-slate-200 rounded-lg outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 block font-bold mb-1">شروط توثيق النظافة بالصور:</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      disabled={loading || isSavingTask}
                      checked={newTaskData.requires_photo_before}
                      onChange={(e) => setNewTaskData({...newTaskData, requires_photo_before: e.target.checked})}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer disabled:opacity-50"
                    />
                    <span>صورة قبل البدء 📸</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      disabled={loading || isSavingTask}
                      checked={newTaskData.requires_photo_after}
                      onChange={(e) => setNewTaskData({...newTaskData, requires_photo_after: e.target.checked})}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer disabled:opacity-50"
                    />
                    <span>صورة بعد الانتهاء 📸</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isSavingTask}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl cursor-pointer transition shadow flex items-center justify-center gap-2"
              >
                {isSavingTask ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    جاري التكليف وحفظ البيانات...
                  </>
                ) : (
                  "تأكيد الإسناد وإعلام الموظف ✅"
                )}
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
                  <label className="flex justify-between items-center text-slate-500">
                    <span>رمز البند (كود SOP):</span>
                    {isSavingTemplate && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading || isSavingTemplate}
                    placeholder="SOP_CLE01"
                    value={selectedTemplate.task_code || ""}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, task_code: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg outline-none disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>

                <div className="flex flex-col gap-1 col-span-2">
                  <label className="flex justify-between items-center text-slate-500">
                    <span>عنوان البند وموضوع العمل:</span>
                    {isSavingTemplate && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading || isSavingTemplate}
                    placeholder="مثال: تلميع أثاث صالة الاستقبال"
                    value={selectedTemplate.title || ""}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, title: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg outline-none disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="flex justify-between items-center text-slate-500">
                  <span>الهدف الرئيسي من البند (SOP Goal):</span>
                  {isSavingTemplate && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                </label>
                <input
                  type="text"
                  disabled={loading || isSavingTemplate}
                  placeholder="مثال: الحفاظ على مظهر استقبال نظيف ومشرق وجاذب للزوار"
                  value={selectedTemplate.goal || ""}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, goal: e.target.value})}
                  className="p-2 border border-slate-200 rounded-lg outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="flex justify-between items-center text-slate-500">
                  <span>التعليمات وخطوات التنفيذ بالتفصيل:</span>
                  {isSavingTemplate && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                </label>
                <textarea
                  disabled={loading || isSavingTemplate}
                  placeholder="اكتب الخطوات التفصيلية بدقة..."
                  value={selectedTemplate.description || ""}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, description: e.target.value})}
                  rows={2}
                  className="p-2 border border-slate-200 rounded-lg outline-none resize-none disabled:bg-slate-50 disabled:text-slate-400"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="flex justify-between items-center text-slate-500">
                    <span>موقع الغرفة / المنطقة المخصصة لها:</span>
                    {loadingZones && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                  </label>
                  <select
                    required
                    disabled={loading || isSavingTemplate || loadingZones}
                    value={selectedTemplate.zone_id || ""}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, zone_id: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">اختر المنطقة...</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="flex justify-between items-center text-slate-500">
                    <span>المسؤول الافتراضي (Assignee):</span>
                    {loadingProfiles && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                  </label>
                  <select
                    disabled={loading || isSavingTemplate || loadingProfiles}
                    value={selectedTemplate.default_assignee_id || ""}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, default_assignee_id: e.target.value})}
                    className="p-2 border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">توزيع تلقائي مرن</option>
                    {getEligibleCleaners(profiles).map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="flex justify-between items-center text-slate-500">
                    <span>التصنيف:</span>
                    {isSavingTemplate && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                  </label>
                  <select
                    disabled={loading || isSavingTemplate}
                    value={selectedTemplate.category || "نظافة"}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, category: e.target.value as any})}
                    className="p-2 border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="نظافة">نظافة</option>
                    <option value="تشغيل">تشغيل</option>
                    <option value="صيانة">صيانة</option>
                    <option value="سلامة">سلامة</option>
                    <option value="جودة">جودة</option>
                    <option value="تجهيز">تجهيز</option>
                  </select>
                </div>

                {selectedTemplate.frequency === "ثلاث مرات يوميا" ? (
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="flex justify-between items-center text-slate-500">
                      <span>أوقات الجدولة (3 أوقات مطلوبة):</span>
                      {isSavingTemplate && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                    </label>
                    <div className="flex flex-col gap-2">
                      {(selectedTemplate.scheduled_times || [selectedTemplate.scheduled_time || "08:00"]).map((time, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="time"
                            disabled={loading || isSavingTemplate}
                            value={time}
                            onChange={(e) => {
                              const current = selectedTemplate.scheduled_times || [selectedTemplate.scheduled_time || "08:00"];
                              const updated = [...current];
                              updated[idx] = e.target.value;
                              setSelectedTemplate({...selectedTemplate, scheduled_times: updated});
                            }}
                            className="p-2 border border-slate-200 rounded-lg outline-none disabled:bg-slate-50 disabled:text-slate-400 flex-1"
                          />
                          {(selectedTemplate.scheduled_times || []).length > 1 && (
                            <button type="button" onClick={() => {
                              const current = selectedTemplate.scheduled_times || [];
                              setSelectedTemplate({...selectedTemplate, scheduled_times: current.filter((_, i) => i !== idx)});
                            }} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition">
                              حذف
                            </button>
                          )}
                        </div>
                      ))}
                      {(selectedTemplate.scheduled_times || []).length < 5 && (
                        <button type="button" onClick={() => {
                          const current = selectedTemplate.scheduled_times || [];
                          setSelectedTemplate({...selectedTemplate, scheduled_times: [...current, "08:00"]});
                        }} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold py-1.5 px-3 rounded border border-indigo-200 hover:bg-indigo-50 transition self-start">
                          + إضافة وقت
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="flex justify-between items-center text-slate-500">
                      <span>توقيت الجدولة المعتاد:</span>
                      {isSavingTemplate && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                    </label>
                    <input
                      type="time"
                      disabled={loading || isSavingTemplate}
                      value={selectedTemplate.scheduled_time || "08:00"}
                      onChange={(e) => setSelectedTemplate({...selectedTemplate, scheduled_time: e.target.value})}
                      className="p-2 border border-slate-200 rounded-lg outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="flex justify-between items-center text-slate-500">
                    <span>التكرار:</span>
                    {isSavingTemplate && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                  </label>
                  <select
                    disabled={loading || isSavingTemplate}
                    value={selectedTemplate.frequency || "يومي"}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated: any = { ...selectedTemplate, frequency: val };
                      if ((val === "أسبوعي" || val === "مرتين أسبوعيا" || val === "ثلاث مرات أسبوعيا") && (!selectedTemplate.recurrence_days || selectedTemplate.recurrence_days.length === 0)) {
                        updated.recurrence_days = [];
                      }
                      if (val === "ثلاث مرات يوميا") {
                        updated.scheduled_times = selectedTemplate.scheduled_times?.length > 0
                          ? selectedTemplate.scheduled_times
                          : [selectedTemplate.scheduled_time || "08:00"];
                      }
                      setSelectedTemplate(updated);
                    }}
                    className="p-2 border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="يومي">يومي</option>
                    <option value="يوم ويوم">يوم ويوم (يوم بعد يوم)</option>
                    <option value="أسبوعي">أسبوعي (أيام محددة)</option>
                    <option value="مرتين أسبوعيا">مرتين أسبوعياً</option>
                    <option value="ثلاث مرات أسبوعيا">ثلاث مرات أسبوعياً</option>
                    <option value="ثلاث مرات يوميا">ثلاث مرات يومياً</option>
                  </select>
                </div>
              </div>

              {["أسبوعي", "مرتين أسبوعيا", "ثلاث مرات أسبوعيا"].includes(selectedTemplate.frequency) && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex flex-col gap-2.5 animate-fade-in">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    📅 حدد أيام التكرار في الأسبوع:
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((day) => {
                      const isChecked = (selectedTemplate.recurrence_days || []).includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => {
                            const currentDays = selectedTemplate.recurrence_days || [];
                            const updatedDays = currentDays.includes(day)
                              ? currentDays.filter((d: string) => d !== day)
                              : [...currentDays, day];
                            setSelectedTemplate({
                              ...selectedTemplate,
                              recurrence_days: updatedDays
                            });
                          }}
                          className={`py-2 px-1 rounded-lg border text-[11px] font-extrabold text-center transition-all cursor-pointer ${
                            isChecked
                              ? "bg-slate-900 border-slate-900 text-white shadow-sm scale-[1.03]"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  {/* Informational helper text detailing the repetition count */}
                  {(selectedTemplate.recurrence_days || []).length > 0 && (
                    <div className="text-[10px] text-slate-500 font-bold bg-white/80 py-1 px-2.5 rounded-lg border border-slate-100 self-start">
                      💡 التكرار المعتمد: <span className="text-blue-600">
                        {(selectedTemplate.recurrence_days || []).length === 1 
                          ? "مرة واحدة في الأسبوع" 
                          : (selectedTemplate.recurrence_days || []).length === 2 
                          ? "مرتين أسبوعياً (مرتين في الأسبوع)" 
                          : (selectedTemplate.recurrence_days || []).length === 3
                          ? "ثلاث مرات أسبوعياً (ثلاث مرات في الأسبوع)"
                          : `${(selectedTemplate.recurrence_days || []).length} مرات في الأسبوع`}
                      </span>
                    </div>
                  )}
                </div>
              )}

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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">الصورة الاسترشادية للمهمة:</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="رابط صورة استرشادية أو قم بتحميل ملف لتحديد مكان وتنفيذ العمل للعامل بدقة..."
                      value={selectedTemplate.reference_image_url || ""}
                      onChange={(e) => setSelectedTemplate({...selectedTemplate, reference_image_url: e.target.value})}
                      className="p-2.5 border border-slate-200 rounded-lg outline-none text-xs flex-1 bg-white"
                    />
                    
                    <label className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border cursor-pointer transition text-xs font-bold shrink-0 ${
                      uploadingReference 
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100/75'
                    }`}>
                      <Camera className="w-4 h-4" />
                      {uploadingReference ? "جاري الرفع..." : "إدراج/رفع صورة"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingReference}
                        onChange={handleReferenceImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {selectedTemplate.reference_image_url && (
                    <div className="relative mt-1 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-1.5 flex items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <img
                          src={selectedTemplate.reference_image_url}
                          alt="الصورة الاسترشادية للمهمة"
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover rounded-lg border border-slate-100 shadow-sm"
                        />
                        <span className="text-[11px] text-slate-500 truncate max-w-xs font-mono leading-none">
                          {selectedTemplate.reference_image_url.substring(0, 45)}...
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate({...selectedTemplate, reference_image_url: ""})}
                        className="p-1 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-lg transition"
                        title="إزالة الصورة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
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
              </div>

              {isConfirmingDelete ? (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex flex-col gap-2.5 mt-3 transition-all animate-pulse">
                  <div className="flex gap-2 text-right" dir="rtl">
                    <span className="text-rose-600 text-base">⚠️</span>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-rose-800">تأكيد حذف البند المعياري</h4>
                      <p className="text-[10px] text-rose-600/90 font-semibold mt-0.5 leading-relaxed">
                        هل أنت متأكد من رغبتك في حذف هذا البند المعياري (SOP) نهائياً من قاعدة البيانات؟ لا يمكن استرجاع البيانات بعد الحذف.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer transition shadow-sm"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSopTemplate}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition shadow-sm flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      تأكيد الحذف النهائي 🗑️
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5 mt-3">
                  {selectedTemplate.id && (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-5 rounded-xl cursor-pointer transition shadow flex items-center justify-center gap-1.5 shrink-0 text-xs"
                      title="حذف هذا البند المعياري نهائياً"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف البند 🗑️
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading || isSavingTemplate}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl cursor-pointer transition shadow flex items-center justify-center gap-1.5 text-xs"
                  >
                    {isSavingTemplate ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        جاري حفظ معيار الجودة...
                      </>
                    ) : (
                      "حفظ معيار الجودة بالدليل الموحد ✅"
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* QUICK ZONE DETAIL VIEW OVERLAY */}
      {selectedZoneDetail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 text-right" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <button onClick={() => setSelectedZoneDetail(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer order-2">
                <X className="w-5 h-5" />
              </button>
              <div className="order-1 text-right">
                <span className="text-[9px] text-slate-400 font-bold block">{selectedZoneDetail.code} • {selectedZoneDetail.floor}</span>
                <h3 className="text-xs font-extrabold text-slate-800">{selectedZoneDetail.name}</h3>
              </div>
            </div>

            {/* Zone Cover Image / Photo Upload */}
            <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
              {selectedZoneDetail.cover_image_url ? (
                <img 
                  src={selectedZoneDetail.cover_image_url} 
                  alt={selectedZoneDetail.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 p-4 text-center">
                  <Camera className="w-8 h-8 text-slate-300 animate-pulse" />
                  <span className="text-[11px] font-bold">لا توجد صورة لهذا المكان حالياً 📸</span>
                  <span className="text-[9px] text-slate-400">اضغط بالأسفل لرفع صورة مرجعية من لابتوبك</span>
                </div>
              )}

              {/* Upload Overlay Button */}
              <label className="absolute bottom-2 left-2 right-2 bg-slate-900/85 hover:bg-slate-900 text-white p-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 text-[10px] font-bold shadow-lg transition duration-150">
                {isUploadingZoneImg ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    جاري رفع ومعالجة الصورة...
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-sky-400" />
                    تحميل وتعيين صورة المكان من اللابتوب 📁
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  disabled={isUploadingZoneImg}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleZoneImageUpload(selectedZoneDetail.id, file);
                    }
                  }}
                  className="hidden" 
                />
              </label>
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

      {/* ADD NEW EMPLOYEE MODAL */}
      {isAddEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 text-right" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-extrabold text-slate-800">إضافة موظف تشغيل أو جودة جديد 👥</h3>
              <button onClick={() => setIsAddEmployeeModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="flex flex-col gap-4 text-xs font-semibold text-slate-700">
              <div className="flex flex-col gap-1 text-right">
                <label className="text-slate-600 block mb-1">الاسم الكامل المزدوج:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أسماء محمد علي"
                  value={employeeFullName}
                  onChange={(e) => setEmployeeFullName(e.target.value)}
                  className="p-2.5 border border-slate-200 rounded-lg outline-none text-slate-800 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-600 block mb-1">اسم المستخدم (لاتيني فقط):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: asmaa"
                    value={employeeUsername}
                    onChange={(e) => setEmployeeUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                    className="p-2.5 border border-slate-200 rounded-lg outline-none font-mono text-slate-800 w-full text-left"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-600 block mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    placeholder="مثال: 010xxxxxxxx"
                    value={employeePhone}
                    onChange={(e) => setEmployeePhone(e.target.value)}
                    className="p-2.5 border border-slate-200 rounded-lg outline-none font-mono text-slate-800 w-full text-left"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-right">
                <label className="text-slate-600 block mb-1">الدور والمسؤولية المباشرة:</label>
                <select
                  value={employeeRole}
                  onChange={(e: any) => setEmployeeRole(e.target.value)}
                  className="p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 w-full font-bold"
                >
                  <option value="cleaner">موظف تشغيل ونظافة (Cleaner)</option>
                  <option value="supervisor">مشرف جودة (Supervisor)</option>
                  <option value="admin">مدير العمليات (Admin)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={empActionLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl cursor-pointer transition shadow flex items-center justify-center gap-2 mt-2 w-full"
              >
                {empActionLoading ? "جاري الإضافة وتجهيز الحساب للوصول..." : "تأكيد إضافة الموظف الجديد في النظام ✅"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS PRESENTATION DIALOG */}
      {createdEmployeeCredentials && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 text-right" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 border border-indigo-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <span>تم تهيئة حساب الموظف وتوثيقه بنجاح 🎉</span>
              </h3>
              <button onClick={() => setCreatedEmployeeCredentials(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed font-bold">
              ⚠️ انسخ كلمة المرور هذه الآن - لن يتم عرضها مجدداً.
              <br />
              لن يتم حفظ كلمة المرور هذه في قواعد البيانات لأسباب أمنية.
            </div>

            <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">الاسم الكامل:</span>
                <span className="text-slate-800 font-bold">{createdEmployeeCredentials.fullName}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                <span className="text-slate-500">اسم المستخدم:</span>
                <span className="text-slate-800 font-mono font-bold">{createdEmployeeCredentials.username}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                <span className="text-slate-500">البريد الإلكتروني:</span>
                <span className="text-slate-800 font-mono">{createdEmployeeCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center border-t border-indigo-100 pt-2.5 bg-indigo-50/50 p-2 rounded border">
                <span className="text-indigo-600 font-bold">كلمة المرور المؤقتة:</span>
                <span className="text-slate-900 font-mono font-extrabold bg-white px-2 py-1 rounded border border-indigo-200 select-all tracking-wider text-sm">
                  {createdEmployeeCredentials.passwordStr}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `بيانات حسابك في NarisOps:\nالاسم: ${createdEmployeeCredentials.fullName}\nاسم المستخدم: ${createdEmployeeCredentials.username}\nالبريد الإلكتروني: ${createdEmployeeCredentials.email}\nكلمة المرور: ${createdEmployeeCredentials.passwordStr}`
                );
                showToast("تم نسخ بيانات الموظف إلى الحافظة 📋", "success");
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl cursor-pointer transition shadow flex items-center justify-center gap-2 mt-2 w-full text-xs"
            >
              نسخ البيانات بالكامل للمشاركة 📋
            </button>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 text-right" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>تعديل بيانات الموظف: {editingEmployee.full_name}</span>
              </h3>
              <button 
                onClick={() => setEditingEmployee(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditEmployee} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-slate-600 font-bold block mb-1">الاسم الكامل للموظف:</label>
                <input
                  type="text"
                  required
                  value={editingEmployee.full_name}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, full_name: e.target.value })}
                  className="p-2.5 border border-slate-200 rounded-lg outline-none font-bold text-slate-800 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-600 block mb-1">اسم المستخدم (للقراءة فقط):</label>
                  <input
                    type="text"
                    disabled
                    value={editingEmployee.username}
                    className="p-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-mono w-full cursor-not-allowed text-left"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-600 block mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    placeholder="مثال: 010xxxxxxxx"
                    value={editingEmployee.phone || ""}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                    className="p-2.5 border border-slate-200 rounded-lg outline-none font-mono text-slate-800 w-full text-left"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-right">
                <label className="text-slate-600 font-bold block mb-1">الدور والمسؤولية:</label>
                <select
                  value={editingEmployee.role}
                  onChange={(e: any) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                  className="p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 w-full font-bold"
                >
                  <option value="cleaner">موظف تشغيل ونظافة (Cleaner)</option>
                  <option value="supervisor">مشرف جودة (Supervisor)</option>
                  <option value="admin">مدير العمليات (Admin)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 text-right bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-slate-700 font-bold block mb-1">حالة التفعيل التشغيلية:</label>
                <div className="flex items-center gap-3 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="is_active_edit"
                      checked={editingEmployee.is_active === true}
                      onChange={() => setEditingEmployee({ ...editingEmployee, is_active: true })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-emerald-700">نشط (مؤهل للعمل والتوزيع)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="is_active_edit"
                      checked={editingEmployee.is_active !== true}
                      onChange={() => setEditingEmployee({ ...editingEmployee, is_active: false })}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="font-bold text-red-700">معطل (مستبعد من التوزيع)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={empActionLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl cursor-pointer transition shadow flex items-center justify-center gap-2"
                >
                  {empActionLoading ? "جاري الحفظ..." : "حفظ التعديلات ✅"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEACTIVATION CONFIRMATION DIALOG */}
      {deactivatingEmployee && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 text-right" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 border border-red-100">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">تأكيد تعطيل حساب الموظف</h3>
                <p className="text-[11px] text-slate-500 font-medium">يرجى قراءة تبعات التعطيل بعناية</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-800 leading-relaxed font-semibold">
              <p className="font-bold mb-1.5">هل أنت متأكد من تعطيل حساب الموظف <span className="underline font-extrabold">{deactivatingEmployee.full_name}</span>؟</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-red-700">
                <li>سيتم استبعاد الموظف فوراً من أي توزيع تلقائي للمهام من الـ SOP.</li>
                <li>لن يتم إسناد أي مهام جديدة له.</li>
                <li>لن يتمكن الموظف من تسجيل الدخول إلى النظام حتى يتم تفعيله يدويًا.</li>
                <li>السجلات والمهام التاريخية المكتملة السابقة ستبقى محفوظة وموثقة باسمه دون تغيير.</li>
              </ul>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => executeToggleEmployeeStatus(deactivatingEmployee, false)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl cursor-pointer transition shadow flex items-center justify-center gap-1.5 text-xs"
              >
                <UserX className="w-4 h-4" />
                تأكيد التعطيل الآن
              </button>
              <button
                type="button"
                onClick={() => setDeactivatingEmployee(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition text-xs"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
