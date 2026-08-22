import React from "react";
import type { AdminDashboardModel } from "../hooks/useAdminDashboard";
import {
  AlertTriangle, BarChart2, BookOpen, Box, Camera, CheckCircle, ChevronLeft, Clock,
  Edit2, Grid, Lightbulb, List, Loader2, MapPin, Plus, Power, Search, Settings,
  ShieldCheck, SlidersHorizontal, Sparkles, Trash2, User, UserCheck, UserX, Users, X, Zap,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import ReportImage from "../components/common/ReportImage";


type PageProps = { dashboard: AdminDashboardModel };

export default function ApprovalsPage({ dashboard }: PageProps) {
  const activeTab = dashboard.activeTab;
  const setActiveTab = dashboard.setActiveTab;
  const tasks = dashboard.tasks;
  const setTasks = dashboard.setTasks;
  const profiles = dashboard.profiles;
  const setProfiles = dashboard.setProfiles;
  const zones = dashboard.zones;
  const setZones = dashboard.setZones;
  const kpis = dashboard.kpis;
  const setKpis = dashboard.setKpis;
  const templates = dashboard.templates;
  const setTemplates = dashboard.setTemplates;
  const operationalTasks = dashboard.operationalTasks;
  const setOperationalTasks = dashboard.setOperationalTasks;
  const deviceSwitches = dashboard.deviceSwitches;
  const setDeviceSwitches = dashboard.setDeviceSwitches;
  const loading = dashboard.loading;
  const setLoading = dashboard.setLoading;
  const loadingZones = dashboard.loadingZones;
  const setLoadingZones = dashboard.setLoadingZones;
  const loadingProfiles = dashboard.loadingProfiles;
  const setLoadingProfiles = dashboard.setLoadingProfiles;
  const isSavingTemplate = dashboard.isSavingTemplate;
  const setIsSavingTemplate = dashboard.setIsSavingTemplate;
  const isSavingTask = dashboard.isSavingTask;
  const setIsSavingTask = dashboard.setIsSavingTask;
  const validationReport = dashboard.validationReport;
  const setValidationReport = dashboard.setValidationReport;
  const isValidatingDb = dashboard.isValidatingDb;
  const setIsValidatingDb = dashboard.setIsValidatingDb;
  const isUploadingZoneImg = dashboard.isUploadingZoneImg;
  const setIsUploadingZoneImg = dashboard.setIsUploadingZoneImg;
  const selectedDate = dashboard.selectedDate;
  const setSelectedDate = dashboard.setSelectedDate;
  const reportEmployeeId = dashboard.reportEmployeeId;
  const setReportEmployeeId = dashboard.setReportEmployeeId;
  const reportStartDate = dashboard.reportStartDate;
  const setReportStartDate = dashboard.setReportStartDate;
  const reportEndDate = dashboard.reportEndDate;
  const setReportEndDate = dashboard.setReportEndDate;
  const historicalTasks = dashboard.historicalTasks;
  const setHistoricalTasks = dashboard.setHistoricalTasks;
  const loadingHistorical = dashboard.loadingHistorical;
  const setLoadingHistorical = dashboard.setLoadingHistorical;
  const hasSearched = dashboard.hasSearched;
  const setHasSearched = dashboard.setHasSearched;
  const expandedJsonTasks = dashboard.expandedJsonTasks;
  const setExpandedJsonTasks = dashboard.setExpandedJsonTasks;
  const taskViewMode = dashboard.taskViewMode;
  const setTaskViewMode = dashboard.setTaskViewMode;
  const tasksSubFilter = dashboard.tasksSubFilter;
  const setTasksSubFilter = dashboard.setTasksSubFilter;
  const searchQuery = dashboard.searchQuery;
  const setSearchQuery = dashboard.setSearchQuery;
  const employeeFilter = dashboard.employeeFilter;
  const setEmployeeFilter = dashboard.setEmployeeFilter;
  const zoneFilter = dashboard.zoneFilter;
  const setZoneFilter = dashboard.setZoneFilter;
  const isAssignModalOpen = dashboard.isAssignModalOpen;
  const setIsAssignModalOpen = dashboard.setIsAssignModalOpen;
  const newTaskData = dashboard.newTaskData;
  const setNewTaskData = dashboard.setNewTaskData;
  const isSopModalOpen = dashboard.isSopModalOpen;
  const setIsSopModalOpen = dashboard.setIsSopModalOpen;
  const selectedTemplate = dashboard.selectedTemplate;
  const setSelectedTemplate = dashboard.setSelectedTemplate;
  const uploadingReference = dashboard.uploadingReference;
  const setUploadingReference = dashboard.setUploadingReference;
  const isConfirmingDelete = dashboard.isConfirmingDelete;
  const setIsConfirmingDelete = dashboard.setIsConfirmingDelete;
  const selectedZoneDetail = dashboard.selectedZoneDetail;
  const setSelectedZoneDetail = dashboard.setSelectedZoneDetail;
  const reviewingTask = dashboard.reviewingTask;
  const setReviewingTask = dashboard.setReviewingTask;
  const qualityGrade = dashboard.qualityGrade;
  const setQualityGrade = dashboard.setQualityGrade;
  const supervisorNotes = dashboard.supervisorNotes;
  const setSupervisorNotes = dashboard.setSupervisorNotes;
  const rejectionReason = dashboard.rejectionReason;
  const setRejectionReason = dashboard.setRejectionReason;
  const isRejecting = dashboard.isRejecting;
  const setIsRejecting = dashboard.setIsRejecting;
  const selectReviewTask = dashboard.selectReviewTask;
  const sliderPosition = dashboard.sliderPosition;
  const setSliderPosition = dashboard.setSliderPosition;
  const toast = dashboard.toast;
  const setToast = dashboard.setToast;
  const showToast = dashboard.showToast;
  const isAddEmployeeModalOpen = dashboard.isAddEmployeeModalOpen;
  const setIsAddEmployeeModalOpen = dashboard.setIsAddEmployeeModalOpen;
  const createdEmployeeCredentials = dashboard.createdEmployeeCredentials;
  const setCreatedEmployeeCredentials = dashboard.setCreatedEmployeeCredentials;
  const employeeFullName = dashboard.employeeFullName;
  const setEmployeeFullName = dashboard.setEmployeeFullName;
  const employeeUsername = dashboard.employeeUsername;
  const setEmployeeUsername = dashboard.setEmployeeUsername;
  const employeeRole = dashboard.employeeRole;
  const setEmployeeRole = dashboard.setEmployeeRole;
  const employeePhone = dashboard.employeePhone;
  const setEmployeePhone = dashboard.setEmployeePhone;
  const empActionLoading = dashboard.empActionLoading;
  const setEmpActionLoading = dashboard.setEmpActionLoading;
  const editingEmployee = dashboard.editingEmployee;
  const setEditingEmployee = dashboard.setEditingEmployee;
  const editingEmployeeInitialActive = dashboard.editingEmployeeInitialActive;
  const setEditingEmployeeInitialActive = dashboard.setEditingEmployeeInitialActive;
  const deactivatingEmployee = dashboard.deactivatingEmployee;
  const setDeactivatingEmployee = dashboard.setDeactivatingEmployee;
  const loadAllData = dashboard.loadAllData;
  const statsCompleted = dashboard.statsCompleted;
  const statsInProgress = dashboard.statsInProgress;
  const statsLate = dashboard.statsLate;
  const statsPendingApproval = dashboard.statsPendingApproval;
  const totalTasksCount = dashboard.totalTasksCount;
  const completionPercentage = dashboard.completionPercentage;
  const smartInsights = dashboard.smartInsights;
  const getFilteredTasks = dashboard.getFilteredTasks;
  const handleAssignTaskSubmit = dashboard.handleAssignTaskSubmit;
  const handleReassignTaskInstance = dashboard.handleReassignTaskInstance;
  const handleApproveClick = dashboard.handleApproveClick;
  const handleRejectClick = dashboard.handleRejectClick;
  const handleReferenceImageUpload = dashboard.handleReferenceImageUpload;
  const handleSaveSopTemplate = dashboard.handleSaveSopTemplate;
  const handleDeleteSopTemplate = dashboard.handleDeleteSopTemplate;
  const handleResetDatabase = dashboard.handleResetDatabase;
  const handleRunValidation = dashboard.handleRunValidation;
  const handleZoneImageUpload = dashboard.handleZoneImageUpload;
  const handleAddEmployee = dashboard.handleAddEmployee;
  const handleToggleEmployeeStatus = dashboard.handleToggleEmployeeStatus;
  const executeToggleEmployeeStatus = dashboard.executeToggleEmployeeStatus;
  const handleEditEmployee = dashboard.handleEditEmployee;
  const handleProvisionAccess = dashboard.handleProvisionAccess;
  const loadHistoricalReports = dashboard.loadHistoricalReports;
  const exportToPDF = dashboard.exportToPDF;
  const PIE_COLORS = dashboard.PIE_COLORS;
  const getEmployeePieData = dashboard.getEmployeePieData;
  const getDailyPerformanceData = dashboard.getDailyPerformanceData;
  const getWeeklyCompletionTrend = dashboard.getWeeklyCompletionTrend;
  const getZoneDurationData = dashboard.getZoneDurationData;
  const getEligibleCleaners = dashboard.getEligibleCleaners;
  const isEligibleCleaner = dashboard.isEligibleCleaner;
  return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: List of completed tasks waiting for audit */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-1 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">طابور انتظار المراجعة والاعتماد</h3>
                      <p className="text-xs text-slate-400 mt-0.5">يتطلب من المشرف فحص جودة العمل واعتماد تقييم A/B/C للموظف</p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {tasks.filter(t => t.status === "completed" && t.supervisor_approved !== true).length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <span className="text-xs font-bold block">لا توجد مهام تنتظر الاعتماد حالياً</span>
                          <span className="text-[10px] text-slate-400 block mt-1">المهام إما مكتملة معتمدة تلقائياً أو لم تكتمل بعد.</span>
                        </div>
                      ) : (
                        tasks.filter(t => t.status === "completed" && t.supervisor_approved !== true).map((task) => (
                          <div
                            key={task.id}
                            onClick={() => {
                              selectReviewTask(task);
                            }}
                            className={`p-3 border rounded-xl cursor-pointer transition flex flex-col gap-1.5 ${
                              reviewingTask?.id === task.id ? "border-slate-800 bg-slate-50" : "border-slate-100 hover:bg-slate-50/50"
                            }`}
                          >
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                              <span>{task.task_code || "ONE_TIME"}</span>
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
                              بند المعيار: {reviewingTask.task_code || "مهمة طارئة"}
                            </span>
                            <h3 className="text-sm font-extrabold text-slate-800 leading-tight">{reviewingTask.title}</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              بالموقع: <span className="text-slate-700 font-semibold">{reviewingTask.zone?.name}</span> • 
                              منفذ بواسطة: <span className="text-slate-700 font-semibold">{reviewingTask.assignee?.full_name || "غير محدد"}</span>
                            </p>
                            <div className="mt-2 flex items-center gap-1.5 text-xs">
                              <span className="text-slate-500 font-bold">إعادة إسناد المهمة:</span>
                              <select
                                value={reviewingTask.assigned_to || ""}
                                onChange={async (e) => {
                                  const val = e.target.value;
                                  if (val) {
                                    await handleReassignTaskInstance(reviewingTask.id, val);
                                    // Update reviewingTask state to reflect immediately in the UI
                                    const updatedProfile = profiles.find(p => p.id === val);
                                    setReviewingTask(prev => prev ? { ...prev, assigned_to: val, assignee: updatedProfile } : null);
                                  }
                                }}
                                className="p-1 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">غير محدد</option>
                                {reviewingTask.assigned_to && !getEligibleCleaners(profiles).some(p => p.id === reviewingTask.assigned_to) && (
                                  <option value={reviewingTask.assigned_to} disabled>
                                    {(profiles.find(p => p.id === reviewingTask.assigned_to)?.full_name || reviewingTask.assigned_to) + " (معطل حالياً)"}
                                  </option>
                                )}
                                {getEligibleCleaners(profiles).map(p => (
                                  <option key={p.id} value={p.id}>{p.full_name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="text-left flex flex-col items-end gap-1">
                            <div className="flex flex-col text-left border-b border-slate-100 pb-1 mb-1">
                              <span className="text-[10px] text-slate-400 font-bold">بدأ: {reviewingTask.started_at ? new Date(reviewingTask.started_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) + " " + new Date(reviewingTask.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</span>
                              <span className="text-[10px] text-slate-400 font-bold">انتهى: {reviewingTask.completed_at ? new Date(reviewingTask.completed_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) + " " + new Date(reviewingTask.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</span>
                            </div>
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
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                            {/* Official SOP Reference Image */}
                            <div className="flex flex-col gap-1 text-center">
                              <span className="text-[10px] font-bold text-indigo-500 block">
                                الصورة الاسترشادية للمهمة 💡
                              </span>
                              <div className="aspect-video bg-slate-900 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center relative">
                                {reviewingTask.reference_image_url ? (
                                  <img 
                                    src={reviewingTask.reference_image_url} 
                                    alt="الصورة الاسترشادية للمهمة" 
                                    className="w-full h-full object-contain cursor-zoom-in" 
                                    referrerPolicy="no-referrer"
                                    onClick={() => window.open(reviewingTask.reference_image_url, '_blank')}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-semibold">
                                    لا توجد صورة استرشادية مسجلة
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Photo Before */}
                            <div className="flex flex-col gap-1 text-center">
                              <span className="text-[10px] font-bold text-slate-400 block">قبل التنظيف 📷</span>
                              <div className="aspect-video bg-slate-900 border border-slate-200 rounded-lg overflow-hidden">
                                {(reviewingTask.photo_before_url || (reviewingTask as any).photos?.before) ? (
                                  <img 
                                    src={reviewingTask.photo_before_url || (reviewingTask as any).photos?.before} 
                                    alt="قبل" 
                                    className="w-full h-full object-contain cursor-zoom-in" 
                                    referrerPolicy="no-referrer"
                                    onClick={() => window.open((reviewingTask.photo_before_url || (reviewingTask as any).photos?.before)!, '_blank')}
                                  />
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
                                {(reviewingTask.photo_after_url || (reviewingTask as any).photos?.after) ? (
                                  <img 
                                    src={reviewingTask.photo_after_url || (reviewingTask as any).photos?.after} 
                                    alt="بعد" 
                                    className="w-full h-full object-contain cursor-zoom-in" 
                                    referrerPolicy="no-referrer"
                                    onClick={() => window.open((reviewingTask.photo_after_url || (reviewingTask as any).photos?.after)!, '_blank')}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px] font-semibold">
                                    لا توجد صورة بعد
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          

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
  );
}
