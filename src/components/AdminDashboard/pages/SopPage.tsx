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

export default function SopPage({ dashboard }: PageProps) {
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
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">إدارة بنود ومقاييس الجودة (SOP Templates)</h3>
                      <p className="text-xs text-slate-400 mt-0.5">القائمة المرجعية للأعمال اليومية المتكررة والتي يولدها السيرفر تلقائياً بمواعيدها كل يوم</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
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
                            is_active: true
                          });
                          setIsSopModalOpen(true);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> إضافة بند معياري جديد
                      </button>
                    </div>
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
                                <div className="flex items-center gap-2">
                                  {tpl.reference_image_url && (
                                    <img
                                      src={tpl.reference_image_url}
                                      alt="الصورة الاسترشادية للمهمة"
                                      referrerPolicy="no-referrer"
                                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 shadow-sm"
                                    />
                                  )}
                                  <div>
                                    <span className="font-bold text-slate-800 block">{tpl.title}</span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5 font-medium leading-relaxed">
                                      الغرفة: <span className="text-slate-600 font-bold">{zone?.name || "عام"}</span>
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="bg-slate-100 py-0.5 px-2 rounded-full text-slate-700 text-[10px] font-bold">
                                  {tpl.category}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="block font-bold text-slate-800">
                                  {tpl.frequency}
                                  {tpl.frequency === "أسبوعي" && tpl.recurrence_days && tpl.recurrence_days.length > 0 && (
                                    <span className="text-[10px] text-indigo-600 font-extrabold block mt-0.5 leading-normal">
                                      ({tpl.recurrence_days.join("، ")})
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-medium">ساعة: {tpl.scheduled_time || "08:00"}</span>
                              </td>
                              <td className="p-3 max-w-xs text-slate-500 font-semibold leading-relaxed text-[11px]">{tpl.tools_required || "لا توجد أدوات خاصة"}</td>
                              <td className="p-3">
                                <div className="flex flex-col gap-0.5 text-[9px] text-slate-400">
                                  {tpl.requires_photo_before && <span>• صورة قبل</span>}
                                  {tpl.requires_photo_after && <span>• صورة بعد</span>}
                                  {tpl.requires_supervisor_approval && <span>• مراجعة المشرف</span>}
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

                  {/* مركز جودة وصحة البيانات السحابية (Database Validation & Cloud Health) */}
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-right">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 justify-end">
                            ⚙️ فحص صحة وتطابق البيانات السحابية (Firestore & Storage Health)
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            أداة تفتيش شاملة للتحقق من سلامة الجداول في Firestore ومطابقتها للمقاييس الفنية للتشغيل الدائم.
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={isValidatingDb}
                            onClick={handleRunValidation}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
                          >
                            {isValidatingDb ? (
                              <span className="flex items-center gap-1">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> جاري التحقق...
                              </span>
                            ) : (
                              "🔍 تشغيل فحص الداتابيز السحابية"
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Production Cloud Indicators */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs font-bold">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="text-slate-500">سحابة Firestore:</span>
                          <span className="text-emerald-600 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            نشطة ومتزامنة 🟢
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="text-slate-500">حاوية Storage:</span>
                          <span className="text-emerald-600 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            متصلة ومباشرة ☁️
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="text-slate-500">نمط المعمارية:</span>
                          <span className="text-indigo-600 font-extrabold">
                            سحابي حصرياً (Online-Only)
                          </span>
                        </div>
                      </div>

                      {/* Validation results section */}
                      {validationReport && (
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <span className="text-xs font-bold text-slate-700">تقرير جودة قاعدة البيانات الأخير</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">تاريخ الفحص: {new Date(validationReport.timestamp).toLocaleString("ar-EG")}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-500">
                                الأخطاء المكتشفة: <strong className={validationReport.summary.totalErrors > 0 ? "text-rose-600" : "text-emerald-600"}>{validationReport.summary.totalErrors}</strong>
                              </span>
                              <span className="text-xs font-bold text-slate-500">
                                التنبيهات: <strong className="text-amber-600">{validationReport.summary.totalWarnings}</strong>
                              </span>
                              
                              {validationReport.isPassed ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold py-1 px-2.5 rounded-full border border-emerald-200">
                                  ✓ متوافقة تماماً 🟢
                                </span>
                              ) : (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold py-1 px-2.5 rounded-full border border-rose-200">
                                  ⚠️ تنبيهات بالهياكل
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Grid of collections */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {validationReport.details.map((colDetail, idx) => {
                              const hasErrors = colDetail.errors.length > 0;
                              const hasWarnings = colDetail.warnings.length > 0;
                              
                              return (
                                <div key={idx} className={`border rounded-lg p-3 ${hasErrors ? 'border-rose-100 bg-rose-50/10' : hasWarnings ? 'border-amber-100 bg-amber-50/10' : 'border-slate-100 bg-slate-50/20'}`}>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-800">{colDetail.collectionName}</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-400 font-bold">المستندات: {colDetail.totalDocs}</span>
                                      {hasErrors ? (
                                        <span className="text-rose-600 text-xs">❌ {colDetail.errors.length}</span>
                                      ) : hasWarnings ? (
                                        <span className="text-amber-600 text-xs">⚠️ {colDetail.warnings.length}</span>
                                      ) : (
                                        <span className="text-emerald-600 text-xs">✓ سليم</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Error list */}
                                  {colDetail.errors.length > 0 && (
                                    <ul className="text-[10px] text-rose-600 list-disc list-inside space-y-1 mt-1 border-t border-rose-100/30 pt-1.5 font-bold text-right">
                                      {colDetail.errors.map((err, errIdx) => (
                                        <li key={errIdx}>{err}</li>
                                      ))}
                                    </ul>
                                  )}

                                  {/* Warning list */}
                                  {colDetail.warnings.length > 0 && (
                                    <ul className="text-[10px] text-amber-600 list-disc list-inside space-y-1 mt-1 border-t border-amber-100/30 pt-1.5 font-semibold text-right">
                                      {colDetail.warnings.map((warn, warnIdx) => (
                                        <li key={warnIdx}>{warn}</li>
                                      ))}
                                    </ul>
                                  )}

                                  {!hasErrors && !hasWarnings && (
                                    <p className="text-[10px] text-emerald-600 font-bold border-t border-slate-100 pt-1.5 text-right">
                                      ✓ مطابقة لجميع شروط الهياكل البرمجية والواجهات للـ TypeScript.
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
  );
}
