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
import { getLocalDateString } from "../../../lib/api";


type PageProps = { dashboard: AdminDashboardModel };

export default function ReportsPage({ dashboard }: PageProps) {
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
                <div className="flex flex-col gap-6 text-right" style={{ direction: 'rtl' }}>
                  {/* Header Title Card */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold py-1 px-2.5 rounded-full">التحليلات والأرشيف الفني</span>
                          <h3 className="text-sm font-bold text-slate-800">قسم التقارير الشهرية والأرشيف التاريخي للعمليات 📊</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">عرض وتحليل توزيع المهام المكتملة على الموظفين مع خاصية البحث الفائق واسترجاع سجل الصور والبيانات البرمجية المخزنة بالفترة الزمنية المحددة.</p>
                      </div>
                      
                      {/* Export Button if historical tasks are loaded */}
                      {historicalTasks.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const blob = new Blob([JSON.stringify(historicalTasks, null, 2)], { type: "application/json" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `narisops_report_${reportStartDate}_to_${reportEndDate}.json`;
                              link.click();
                              URL.revokeObjectURL(url);
                              showToast("تم تصدير التقرير كملف JSON بنجاح ✅", "success");
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition duration-150 flex items-center gap-2 cursor-pointer shadow-sm"
                          >
                            📥 تصدير التقرير JSON
                          </button>
                          <button
                            type="button"
                            onClick={exportToPDF}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition duration-150 flex items-center gap-2 cursor-pointer shadow-sm"
                          >
                            📄 تصدير كملف PDF
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Filter & Retrieval Engine Panel */}
                  <div id="pdf-report-container" className="flex flex-col gap-6">
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm no-print">
                      <h4 className="text-xs font-extrabold text-slate-700 mb-4 flex items-center gap-2">
                        <Search className="w-4 h-4 text-indigo-500" />
                        مستعلم الأرشيف ومحرك تصفية البيانات
                      </h4>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs">
                      {/* Select Employee */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-500 font-bold">الموظف المسؤول:</label>
                        <select
                          value={reportEmployeeId}
                          onChange={(e) => setReportEmployeeId(e.target.value)}
                          className="p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-xs font-bold text-slate-700"
                        >
                          <option value="all">جميع الموظفين (الكل)</option>
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.full_name} ({p.role === "admin" ? "مدير" : p.role === "supervisor" ? "مشرف" : "منظف"})</option>
                          ))}
                        </select>
                      </div>

                      {/* Start Date */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-500 font-bold">تاريخ البداية:</label>
                        <input
                          type="date"
                          value={reportStartDate}
                          onChange={(e) => setReportStartDate(e.target.value)}
                          className="p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-xs font-bold text-slate-700"
                        />
                      </div>

                      {/* End Date */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-500 font-bold">تاريخ النهاية:</label>
                        <input
                          type="date"
                          value={reportEndDate}
                          onChange={(e) => setReportEndDate(e.target.value)}
                          className="p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-xs font-bold text-slate-700"
                        />
                      </div>

                      {/* Search Buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={loadHistoricalReports}
                          disabled={loadingHistorical}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition text-center text-xs flex items-center justify-center gap-2"
                        >
                          {loadingHistorical ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                          بحث واسترجاع البيانات
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            const firstDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
                            setReportStartDate(firstDay);
                            setReportEndDate(getLocalDateString());
                            setReportEmployeeId("all");
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-2.5 rounded-xl text-xs transition"
                          title="إعادة التصفية"
                        >
                          🔄
                        </button>
                      </div>
                    </div>

                    {/* Quick Filters Shortcuts */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-bold self-center">روابط سريعة بالفترة:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const today = getLocalDateString();
                          setReportStartDate(today);
                          setReportEndDate(today);
                        }}
                        className="text-[10px] bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 font-bold px-2.5 py-1 rounded-lg transition"
                      >
                        اليوم الحالي
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          const lastWeek = new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000);
                          setReportStartDate(lastWeek.toISOString().split("T")[0]);
                          setReportEndDate(getLocalDateString());
                        }}
                        className="text-[10px] bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 font-bold px-2.5 py-1 rounded-lg transition"
                      >
                        آخر 7 أيام
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          const firstDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
                          setReportStartDate(firstDay);
                          setReportEndDate(getLocalDateString());
                        }}
                        className="text-[10px] bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 font-bold px-2.5 py-1 rounded-lg transition"
                      >
                        الشهر الحالي
                      </button>
                    </div>
                  </div>

                  {/* Monthly Completion Stats & Pie Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recharts Pie Chart component */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">توزيع المهام المكتملة حسب الموظفين 🍕</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">حصة كل موظف تشغيلي من إجمالي البنود المنفذة بنجاح</p>
                      </div>

                      <div className="h-56 my-4 flex items-center justify-center relative" style={{ direction: 'ltr' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getEmployeePieData()}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {getEmployeePieData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '10px', border: 'none', textAlign: 'right' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xs text-slate-400 font-bold">إجمالي المكتمل</span>
                          <span className="text-lg font-extrabold text-slate-800">
                            { (hasSearched ? historicalTasks : tasks).filter(t => t.status === "completed").length }
                          </span>
                        </div>
                      </div>

                      {/* Custom Legend for Pie Chart with scroll/wrap */}
                      <div className="max-h-32 overflow-y-auto space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-right" style={{ direction: 'rtl' }}>
                        {getEmployeePieData().map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-slate-600 font-semibold gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                              <span className="truncate max-w-[120px]">{item.name}</span>
                            </div>
                            <span className="font-mono text-slate-900 bg-slate-50 py-0.5 px-2 rounded-md font-bold text-[10px]">
                              {item.value} مهمة ({Math.round((item.value / Math.max(1, getEmployeePieData().reduce((s, d) => s + d.value, 0))) * 100)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Breakdown Numbers & Performance Insights */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-2 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">مؤشرات الأداء للمجموعة المسترجعة</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">تحليل أداء المهام ونسب الالتزام لفترة التقرير المحددة</p>
                      </div>

                      {/* KPI cards in report */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-4">
                        <div className="bg-indigo-50/40 border border-indigo-100 p-3.5 rounded-xl text-right">
                          <span className="text-[10px] text-slate-400 block font-bold">إجمالي البنود</span>
                          <span className="text-xl font-black text-indigo-700 font-mono">
                            { (hasSearched ? historicalTasks : tasks).length }
                          </span>
                        </div>
                        <div className="bg-emerald-50/40 border border-emerald-100 p-3.5 rounded-xl text-right">
                          <span className="text-[10px] text-slate-400 block font-bold">مكتمل ومعتمد</span>
                          <span className="text-xl font-black text-emerald-700 font-mono">
                            { (hasSearched ? historicalTasks : tasks).filter(t => t.status === "completed" && t.supervisor_approved).length }
                          </span>
                        </div>
                        <div className="bg-rose-50/40 border border-rose-100 p-3.5 rounded-xl text-right">
                          <span className="text-[10px] text-slate-400 block font-bold">متأخر أو معاد العمل</span>
                          <span className="text-xl font-black text-rose-700 font-mono">
                            { (hasSearched ? historicalTasks : tasks).filter(t => t.status === "late" || (t.status === "completed" && (t.delay_minutes || 0) > 0)).length }
                          </span>
                        </div>
                        <div className="bg-amber-50/40 border border-amber-100 p-3.5 rounded-xl text-right">
                          <span className="text-[10px] text-slate-400 block font-bold">قيد التنفيذ والانتظار</span>
                          <span className="text-xl font-black text-amber-700 font-mono">
                            { (hasSearched ? historicalTasks : tasks).filter(t => t.status === "pending" || t.status === "in_progress").length }
                          </span>
                        </div>
                      </div>

                      {/* Big Progress bar section */}
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2 text-xs font-bold">
                          <span className="text-slate-700">معدل الإنجاز العام للفترة:</span>
                          <span className="text-indigo-600 font-mono">
                            { (() => {
                              const total = (hasSearched ? historicalTasks : tasks).length;
                              const done = (hasSearched ? historicalTasks : tasks).filter(t => t.status === "completed").length;
                              return total > 0 ? Math.round((done / total) * 100) : 0;
                            })() }%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 shadow-inner">
                          <div 
                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(() => {
                                const total = (hasSearched ? historicalTasks : tasks).length;
                                const done = (hasSearched ? historicalTasks : tasks).filter(t => t.status === "completed").length;
                                return total > 0 ? Math.round((done / total) * 100) : 0;
                              })()}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                          * يتم احتساب معدل الإنجاز بناءً على المهام التي تم تغيير حالتها بنجاح إلى "مكتمل" من قبل الموظف المسؤول ورفع الصور قبل وبعد الانتهاء.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Operational Archival task log & Verification */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800">أرشيف المهام والتوثيق البصري بالفترة</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">استعراض تفصيلي للمهام المحددة مع صور قبل/بعد وتواقيع الموظفين والملفات الفنية (JSON)</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-100 py-1 px-2.5 rounded-md">
                        العدد المسترجع: { historicalTasks.length } مهمة
                      </span>
                    </div>

                    {loadingHistorical ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-slate-500 font-bold animate-pulse">جاري فك تشفير البيانات واسترجاع الصور من السحابة...</span>
                      </div>
                    ) : !hasSearched ? (
                      <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <div className="text-4xl mb-2">📥</div>
                        <h5 className="text-xs font-bold text-slate-700">في انتظار بدء الاستعلام</h5>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">حدد الموظف والتواريخ أعلاه، ثم اضغط على زر "بحث واسترجاع البيانات" لعرض الأرشيف التاريخي بالكامل وسجلات الصور.</p>
                      </div>
                    ) : historicalTasks.length === 0 ? (
                      <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <div className="text-4xl mb-2">📭</div>
                        <h5 className="text-xs font-bold text-slate-700">لم يتم العثور على أي نتائج</h5>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">لا توجد أي مهام مسجلة للموظف المختار خلال هذه الفترة المحددة. يرجى اختيار تاريخ آخر أو التحقق من جدول المهام اليومي.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {historicalTasks.map((task) => {
                          const isExpanded = !!expandedJsonTasks[task.id];
                          const delayMin = task.delay_minutes || 0;
                          
                          return (
                            <div key={task.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/30 hover:border-indigo-100 transition flex flex-col gap-4 text-xs">
                              {/* Task Header info */}
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="font-extrabold text-slate-800 text-xs">{task.title}</h5>
                                    <span className="text-[9px] bg-slate-100 text-slate-500 font-mono py-0.5 px-1.5 rounded border border-slate-200">
                                      {task.id}
                                    </span>
                                    {task.task_type === "rework" && (
                                      <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">إعادة عمل ⚠️</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{task.description}</p>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Status badge */}
                                  {task.status === "completed" ? (
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3 text-emerald-600" /> مكتملة
                                    </span>
                                  ) : task.status === "in_progress" ? (
                                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold py-1 px-2.5 rounded-full">
                                      قيد التنفيذ
                                    </span>
                                  ) : task.status === "late" ? (
                                    <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold py-1 px-2.5 rounded-full">
                                      متأخرة
                                    </span>
                                  ) : (
                                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold py-1 px-2.5 rounded-full">
                                      بانتظار البدء
                                    </span>
                                  )}

                                  {/* Approval status */}
                                  {task.supervisor_approved ? (
                                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold py-1 px-2.5 rounded-full">
                                      ✓ تم الاعتماد من المشرف
                                    </span>
                                  ) : task.status === "completed" && (
                                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold py-1 px-2.5 rounded-full animate-pulse">
                                      ⏳ بانتظار التدقيق والاعتماد
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Technical Metadata & Operational Info */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-500 font-semibold bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] text-slate-400 block font-bold">الموظف القائم بالعمل:</span>
                                  <span className="text-slate-800 font-bold">{task.assignee?.full_name || "—"} ({task.assignee?.username})</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] text-slate-400 block font-bold">موقع ومنطقة العمل:</span>
                                  <span className="text-indigo-600 font-bold">{task.zone?.name || "—"}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] text-slate-400 block font-bold">تاريخ الاستحقاق والوقت:</span>
                                  <span className="text-slate-800 font-mono">{task.due_date} {task.due_time || "—"}</span>
                                </div>
                              </div>

                              {/* Delay or Quality Insights */}
                              {(delayMin > 0 || task.employee_notes || task.supervisor_notes) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
                                  {task.employee_notes && (
                                    <div>
                                      <span className="font-bold text-slate-700 block">ملاحظات منفذ الخدمة (الموظف):</span>
                                      <p className="text-slate-500 italic mt-0.5">"{task.employee_notes}"</p>
                                    </div>
                                  )}
                                  {task.supervisor_notes && (
                                    <div>
                                      <span className="font-bold text-slate-700 block">توجيهات المشرف والاعتماد الجودة:</span>
                                      <p className="text-indigo-600 font-bold mt-0.5">"{task.supervisor_notes}"</p>
                                    </div>
                                  )}
                                  {delayMin > 0 && (
                                    <div className="col-span-1 md:col-span-2 text-rose-600 font-bold flex items-center gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      <span>تأخر في إتمام المهمة بمقدار {delayMin} دقيقة عن الجدول التشغيلي المستهدف.</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Image Verification logs (صورة قبل وبعد) */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* SOP Official Reference Image */}
                                <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-between h-44">
                                  <span className="text-[10px] font-bold text-indigo-600 mb-2 block border-b border-slate-100 pb-1">💡 الصورة الاسترشادية للمهمة</span>
                                  {task.reference_image_url ? (
                                    <div className="relative group overflow-hidden rounded-lg border border-slate-100 h-full flex items-center justify-center bg-slate-50">
                                      <img 
                                        src={task.reference_image_url} 
                                        alt="الصورة الاسترشادية للمهمة" 
                                        className="max-h-full object-contain cursor-zoom-in transition duration-200 hover:scale-105" 
                                        referrerPolicy="no-referrer"
                                        onClick={() => window.open(task.reference_image_url, '_blank')}
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-full rounded-lg bg-slate-50/50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                      <span className="text-xl">💡</span>
                                      <span className="text-[10px] mt-1">لا توجد صورة استرشادية مسجلة</span>
                                    </div>
                                  )}
                                </div>

                                {/* Photo Before */}
                                <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-between h-44">
                                  <span className="text-[10px] font-bold text-slate-500 mb-2 block border-b border-slate-100 pb-1">📸 صورة قبل البدء بالعمل (SOP)</span>
                                  <div className="relative group overflow-hidden rounded-lg border border-slate-100 h-full flex items-center justify-center bg-slate-50">
                                    <ReportImage
                                      url={task.photo_before_url}
                                      alt="صورة قبل العمل"
                                      emptyLabel="لم يتم طلب أو رفع صورة قبل"
                                      onOpen={() => window.open(task.photo_before_url!, "_blank")}
                                    />
                                  </div>
                                </div>

                                {/* Photo After */}
                                <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-between h-44">
                                  <span className="text-[10px] font-bold text-slate-500 mb-2 block border-b border-slate-100 pb-1">📸 صورة بعد الانتهاء واللمعان</span>
                                  <div className="relative group overflow-hidden rounded-lg border border-slate-100 h-full flex items-center justify-center bg-slate-50">
                                    <ReportImage
                                      url={task.photo_after_url}
                                      alt="صورة بعد العمل"
                                      emptyLabel="لم يتم رفع صورة بعد"
                                      onOpen={() => window.open(task.photo_after_url!, "_blank")}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Toggle stored JSON data button (استرجاع كل البيانات المتخذنه) */}
                              <div className="border-t border-slate-100 pt-3 flex justify-between items-center flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedJsonTasks(prev => ({
                                      ...prev,
                                      [task.id]: !prev[task.id]
                                    }));
                                  }}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                                >
                                  {isExpanded ? "▲ إخفاء السجل الكامل" : "▼ استرجاع وفك تشفير البيانات الكاملة المخزنة (JSON)"}
                                </button>
                                
                                <span className="text-[9px] text-slate-400 font-mono">آخر تحديث: {task.updated_at ? new Date(task.updated_at).toLocaleString('ar-EG') : "—"}</span>
                              </div>

                              {/* Collapsible JSON display */}
                              {isExpanded && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden mt-2">
                                  <div className="bg-slate-800 text-slate-300 px-4 py-2 font-mono text-[10px] flex justify-between items-center select-none">
                                    <span>DATABASE DOCUMENT STRUCTURE (Firestore JSON)</span>
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(task, null, 2));
                                        showToast("تم نسخ بيانات المستند بالكامل إلى الحافظة 📋", "success");
                                      }}
                                      className="text-white bg-slate-700 hover:bg-indigo-600 px-2 py-0.5 rounded transition text-[9px] font-bold cursor-pointer"
                                    >
                                      نسخ المستند 📋
                                    </button>
                                  </div>
                                  <pre className="bg-slate-950 text-emerald-400 p-4 font-mono text-[10px] overflow-x-auto text-left leading-relaxed max-h-64 select-text">
                                    <code>{JSON.stringify(task, null, 2)}</code>
                                  </pre>
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  </div>
                </div>
  );
}
