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


type PageProps = { dashboard: AdminDashboardModel };

export default function TasksPage({ dashboard }: PageProps) {
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
                <div id="tasks-list-container" className="flex flex-col gap-4 tasks-list-print-container">
                  
                  {/* Top Bar with actions and switches */}
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4 no-print">
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
                      <button
                        onClick={exportToPDF}
                        className="bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold py-1.5 px-3 rounded-lg border border-red-200 transition flex items-center gap-1.5 cursor-pointer no-print"
                      >
                        📄 تصدير القائمة (PDF)
                      </button>
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
                        {getEligibleCleaners(profiles).map(p => (
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
                            <th className="p-3">أوقات التنفيذ</th>
                            <th className="p-3">الوقت الأقصى</th>
                            <th className="p-3">الحالة</th>
                            <th className="p-3">إثباتات النظافة</th>
                            <th className="p-3 text-center">الإجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {getFilteredTasks().map((task) => (
                            <tr key={task.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-500">{task.task_code || "ONE_TIME"}</td>
                              <td className="p-3">
                                <span className="font-bold text-slate-800 block">{task.title}</span>
                                {task.task_type === "rework" && (
                                  <span className="text-[10px] bg-purple-100 text-purple-700 py-0.5 px-1.5 rounded-full font-bold mt-1 inline-block">
                                    طلب إعادة تنفيذ ⚠️
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-slate-600 font-medium">{task.zone?.name || "مقر الشركة"}</td>
                              <td className="p-3">
                                <select
                                  value={task.assigned_to || ""}
                                  onChange={(e) => handleReassignTaskInstance(task.id, e.target.value)}
                                  className="p-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-none font-bold text-slate-700 cursor-pointer focus:border-slate-400"
                                >
                                  <option value="">غير محدد</option>
                                  {task.assigned_to && task.assignee && !isEligibleCleaner(task.assignee) && (
                                    <option value={task.assigned_to} disabled>
                                      {task.assignee.full_name} (غير نشطة)
                                    </option>
                                  )}
                                  {getEligibleCleaners(profiles).map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col gap-0.5 text-[10px]">
                                  {task.started_at ? (
                                    <span className="text-slate-600">بدأ: {new Date(task.started_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })} {new Date(task.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  ) : (
                                    <span className="text-slate-400">بدأ: —</span>
                                  )}
                                  {task.completed_at ? (
                                    <span className="text-slate-600 font-bold">انتهى: {new Date(task.completed_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })} {new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  ) : (
                                    <span className="text-slate-400">انتهى: —</span>
                                  )}
                                </div>
                              </td>
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
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => {
                                    selectReviewTask(task);
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
                            <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:shadow hover:border-slate-300 cursor-pointer transition" onClick={() => selectReviewTask(task)}>
                              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                                <span>{task.task_code || "ONE_TIME"}</span>
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
                            <div key={task.id} className="bg-white border-2 border-amber-300 rounded-xl p-3.5 shadow-sm hover:shadow cursor-pointer transition" onClick={() => selectReviewTask(task)}>
                              <div className="flex justify-between items-center text-[9px] text-amber-600 font-bold">
                                <span>{task.task_code || "ONE_TIME"}</span>
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
                            <div key={task.id} className={`bg-white border rounded-xl p-3.5 shadow-sm hover:shadow cursor-pointer transition ${task.supervisor_approved ? 'border-emerald-300' : 'border-purple-300'}`} onClick={() => { selectReviewTask(task); setActiveTab('approvals'); }}>
                              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                                <span>{task.task_code || "ONE_TIME"}</span>
                                <span>{task.supervisor_approved ? "معتمدة" : "بحاجة لاعتماد"}</span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-800 mt-1">{task.title}</h5>
                              {task.completed_at && (
                                <div className="text-[10px] text-emerald-600 font-bold mt-1">
                                  انتهت: {new Date(task.completed_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })} - {new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
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
  );
}
