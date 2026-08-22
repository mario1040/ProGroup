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

export default function KpisPage({ dashboard }: PageProps) {
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
                <div className="flex flex-col gap-6">

                  {/* AI Predictions Section */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <Zap className="w-4 h-4 text-indigo-600" />
                      </div>
                      <h3 className="text-sm font-bold text-indigo-900">تحليلات وتوقعات النظام الذكية (AI Insights)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white/80 p-4 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
                        <div className="text-xs text-slate-500 font-bold mb-2">توقع الإنجاز لنهاية اليوم</div>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl font-black text-emerald-600">
                            {Math.min(100, Math.round(completionPercentage + (statsInProgress > 0 ? 15 : 0)))}%
                          </span>
                          <span className="text-[10px] text-slate-400 mb-1">معدل متوقع</span>
                        </div>
                      </div>
                      
                      <div className="bg-white/80 p-4 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
                        <div className="text-xs text-slate-500 font-bold mb-2">توصية توزيع العمالة</div>
                        <div className="text-sm font-black text-slate-800 leading-tight">
                          {smartInsights.topBottleneck ? (
                            <span>ينصح بتوجيه دعم إضافي لمنطقة <span className="text-rose-600">{smartInsights.topBottleneck.name}</span> لتقليل الاختناق.</span>
                          ) : (
                            <span className="text-emerald-600">التوزيع الحالي ممتاز ولا يحتاج لتعديل.</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/80 p-4 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
                        <div className="text-xs text-slate-500 font-bold mb-2">نمط التأخير الشائع</div>
                        <div className="text-sm font-black text-slate-800 leading-tight">
                          {smartInsights.avgDelay > 20 ? (
                            <span>معظم التأخيرات تحدث بسبب المهام التي تستغرق أكثر من وقتها المعياري المبرمج.</span>
                          ) : (
                            <span className="text-indigo-600">الالتزام بالوقت المعياري ضمن المعدلات الطبيعية.</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/80 p-4 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
                        <div className="text-xs text-slate-500 font-bold mb-2">أفضل موظف متاح للتدخل السريع</div>
                        <div className="text-sm font-black text-slate-800 leading-tight">
                          {smartInsights.topEmployee ? (
                            <span><span className="text-indigo-600">{smartInsights.topEmployee.name}</span> (معدل إنجاز عالي ومتاح للمهام الطارئة).</span>
                          ) : (
                            <span>جاري جمع البيانات...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
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
                                {(kpi.tasks_completed_on_time + kpi.tasks_late + kpi.tasks_reworked + kpi.tasks_rejected) === 0 ? (
                                  <span className="font-bold py-0.5 px-2 rounded-full border bg-slate-50 text-slate-500 border-slate-200 text-[10px]">لم يتم التقييم</span>
                                ) : (
                                  <span className={`font-bold py-0.5 px-2 rounded-full border ${
                                    kpi.compliance_rate >= 90 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    kpi.compliance_rate >= 80 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}>
                                    {kpi.compliance_rate}%
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-slate-600">
                                {(kpi.tasks_completed_on_time + kpi.tasks_late + kpi.tasks_reworked + kpi.tasks_rejected) === 0 ? "-" : `${kpi.avg_execution_time_minutes} دقيقة`}
                              </td>
                              <td className="p-3 text-slate-800 font-extrabold">
                                {(kpi.tasks_completed_on_time + kpi.tasks_late + kpi.tasks_reworked + kpi.tasks_rejected) === 0 ? "-" : `${kpi.quality_score}%`}
                              </td>
                              <td className="p-3">
                                {(kpi.tasks_completed_on_time + kpi.tasks_late + kpi.tasks_reworked + kpi.tasks_rejected) === 0 ? (
                                  <span className="text-[10px] text-slate-400">لا توجد بيانات</span>
                                ) : kpi.compliance_rate >= 90 ? (
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
                          <BarChart data={kpis.filter(k => (k.tasks_completed_on_time + k.tasks_late + k.tasks_reworked + k.tasks_rejected) > 0)} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
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
                          <BarChart data={kpis.filter(k => (k.tasks_completed_on_time + k.tasks_late + k.tasks_reworked + k.tasks_rejected) > 0)} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
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
  );
}
