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

export default function OverviewPage({ dashboard }: PageProps) {
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

                  {/* AI Smart Insights */}
                  <div className="bg-gradient-to-l from-indigo-50 to-blue-50 border border-indigo-100 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <Zap className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h3 className="text-sm font-black text-indigo-900">التحليلات الذكية للمهام والأداء (AI Smart Analytics)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white/90 p-4 rounded-xl border border-white/60 shadow-sm backdrop-blur-md">
                        <div className="text-xs text-slate-500 font-bold mb-1">معدل الإنجاز اليومي</div>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-black text-emerald-600">{completionPercentage}%</span>
                        </div>
                      </div>
                      
                      <div className="bg-white/90 p-4 rounded-xl border border-white/60 shadow-sm backdrop-blur-md">
                        <div className="text-xs text-slate-500 font-bold mb-1">متوسط الوقت المستغرق لكل مهمة</div>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-black text-blue-600">{smartInsights.avgCompletionTime}</span>
                          <span className="text-xs text-slate-400 mb-1.5 font-bold">دقيقة</span>
                        </div>
                      </div>

                      <div className="bg-white/90 p-4 rounded-xl border border-white/60 shadow-sm backdrop-blur-md">
                        <div className="text-xs text-slate-500 font-bold mb-1">تنبيهات تأخير المهام الحالية</div>
                        <div className="flex items-end gap-2">
                          {smartInsights.lateTasksList.length > 0 ? (
                            <>
                              <span className="text-3xl font-black text-rose-600">{smartInsights.lateTasksList.length}</span>
                              <span className="text-xs text-rose-500 mb-1.5 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> مهام متأخرة/معطلة</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-emerald-600 flex items-center gap-1 mt-2"><CheckCircle className="w-4 h-4"/> لا توجد مهام متأخرة</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/90 p-4 rounded-xl border border-white/60 shadow-sm backdrop-blur-md">
                        <div className="text-xs text-slate-500 font-bold mb-1">تحليل الاختناقات (المنطقة)</div>
                        <div className="text-sm font-black text-slate-800 leading-tight mt-1">
                          {smartInsights.topBottleneck ? (
                            <span>عقبات في <span className="text-rose-600">{smartInsights.topBottleneck.name}</span> بمتوسط تأخير {smartInsights.avgDelay} د.</span>
                          ) : (
                            <span className="text-emerald-600">التوزيع الحالي ممتاز ولا يوجد اختناق.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/90 rounded-xl border border-white/60 shadow-sm backdrop-blur-md overflow-hidden">
                      <div className="p-4 border-b border-slate-100 bg-white">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-slate-400" /> 
                          تقييم الجودة اللحظي للموظفين (المهام المكتملة مقابل طلبات الإعادة Rework)
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
                            <tr>
                              <th className="p-3">اسم الموظف</th>
                              <th className="p-3 text-center">المهام المكتملة بنجاح</th>
                              <th className="p-3 text-center">طلبات إعادة التنفيذ (Rework)</th>
                              <th className="p-3 text-center">مؤشر الجودة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {smartInsights.qualityMetrics.length === 0 ? (
                              <tr><td colSpan={4} className="p-4 text-center text-slate-400 font-medium">لا توجد بيانات كافية لتقييم الموظفين اليوم.</td></tr>
                            ) : smartInsights.qualityMetrics.map((metric) => {
                              const total = metric.completedCount + metric.reworkCount;
                              const qualityScore = total > 0 ? Math.round((metric.completedCount / total) * 100) : 100;
                              let scoreColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
                              if (qualityScore < 70) scoreColor = "text-rose-600 bg-rose-50 border-rose-100";
                              else if (qualityScore < 90) scoreColor = "text-amber-600 bg-amber-50 border-amber-100";

                              return (
                                <tr key={metric.id} className="hover:bg-slate-50/50 transition">
                                  <td className="p-3 font-bold text-slate-800">{metric.employeeName}</td>
                                  <td className="p-3 text-center font-black text-emerald-600">{metric.completedCount}</td>
                                  <td className="p-3 text-center font-black text-rose-500">{metric.reworkCount}</td>
                                  <td className="p-3 text-center">
                                    <span className={`inline-block px-2 py-1 rounded border font-bold text-[10px] ${scoreColor}`}>
                                      {qualityScore}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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
                            className={`border rounded-xl p-4 transition duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${cardClass}`}
                          >
                            <div>
                              {zone.cover_image_url && (
                                <div className="w-full h-24 rounded-lg overflow-hidden mb-3 border border-slate-100 shadow-sm">
                                  <img 
                                    src={zone.cover_image_url} 
                                    alt={zone.name} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[9px] text-slate-400 font-bold block">{zone.code || "SOP"} • {zone.floor}</span>
                                  <h4 className="text-xs font-extrabold text-slate-800 mt-0.5">{zone.name}</h4>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between items-center text-[10px]">
                              <span className="text-slate-500 font-bold flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {zone.responsible_employee?.is_active === true
                                  ? zone.responsible_employee.full_name
                                  : "لا يوجد مسؤول نشط"}
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

                  {/* KPI Overview Dashboard Section */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-5">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">مؤشرات الأداء الرئيسية والتحليلات الجغرافية (KPI Overview)</h3>
                        <p className="text-xs text-slate-400 mt-0.5">متابعة دقيقة لمعدلات إنجاز المهام الأسبوعية وسرعة إتمام التنظيف عبر كافة المناطق التشغيلية</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 py-1 px-2.5 rounded-lg font-bold">التحليل اللحظي للمنظومة</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Weekly Completion Rate Trend (Line Chart) */}
                      <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-bold text-slate-700">معدل الإنجاز الأسبوعي (%)</h4>
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold px-2 py-0.5 rounded border border-indigo-100">مستهدف SLA: 90%</span>
                        </div>
                        <div className="h-64 text-xs" style={{ direction: 'ltr' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getWeeklyCompletionTrend()} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="dayName" tick={{ fill: '#64748b', fontSize: 10 }} />
                              <YAxis domain={[50, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                              <RechartsTooltip 
                                contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none', textAlign: 'right' }} 
                                labelStyle={{ fontWeight: 'bold', color: '#38bdf8' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                              <Line type="monotone" dataKey="معدل الإنجاز (%)" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                              <Line type="monotone" dataKey="المستهدف (%)" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Average Task Duration Across Zones (Bar Chart) */}
                      <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-bold text-slate-700">متوسط سرعة التنظيف (دقائق)</h4>
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 font-bold px-2 py-0.5 rounded border border-emerald-100">كلما قل الوقت زادت الكفاءة</span>
                        </div>
                        <div className="h-64 text-xs" style={{ direction: 'ltr' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getZoneDurationData()} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="zoneName" tick={{ fill: '#64748b', fontSize: 10 }} />
                              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                              <RechartsTooltip 
                                contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none', textAlign: 'right' }}
                                labelStyle={{ fontWeight: 'bold', color: '#10b981' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                              <Bar dataKey="duration" name="متوسط الزمن" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Daily Performance Summary (Pie Chart) */}
                      <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-bold text-slate-700">ملخص الأداء اليومي</h4>
                          <span className="text-[10px] text-rose-600 bg-rose-50 font-bold px-2 py-0.5 rounded border border-rose-100">توزيع المهام</span>
                        </div>
                        <div className="h-64 text-xs" style={{ direction: 'ltr' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                              <Pie
                                data={getDailyPerformanceData()}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                              >
                                {getDailyPerformanceData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none', textAlign: 'right' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
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
                              {getEligibleCleaners(profiles).map(p => (
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
                                <span className="text-[10px] text-slate-400 font-medium">متوسط وقت إنجاز البند: {(kpi.tasks_completed_on_time + kpi.tasks_late + kpi.tasks_reworked + kpi.tasks_rejected) === 0 ? '-' : kpi.avg_execution_time_minutes} دقيقة</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-left">
                                <span className="text-[10px] text-slate-400 block font-bold">نسبة الالتزام</span>
                                {(kpi.tasks_completed_on_time + kpi.tasks_late + kpi.tasks_reworked + kpi.tasks_rejected) === 0 ? (
                                  <span className="text-[10px] font-bold text-slate-400">-</span>
                                ) : (
                                  <span className={`text-xs font-extrabold ${kpi.compliance_rate >= 90 ? 'text-emerald-600' : 'text-amber-500'}`}>{kpi.compliance_rate}%</span>
                                )}
                              </div>

                              <div className="text-left">
                                <span className="text-[10px] text-slate-400 block font-bold">تقييم الجودة</span>
                                <span className="text-xs font-extrabold text-slate-800">
                                  {(kpi.tasks_completed_on_time + kpi.tasks_late + kpi.tasks_reworked + kpi.tasks_rejected) === 0 ? "-" : `${kpi.quality_score}%`}
                                </span>
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
                            {kpis.filter(k => k.tasks_completed_on_time > 0).length > 0 
                              ? `${[...kpis].filter(k => k.tasks_completed_on_time > 0).sort((a,b) => b.compliance_rate - a.compliance_rate)[0].cleaner_name} (${[...kpis].filter(k => k.tasks_completed_on_time > 0).sort((a,b) => b.compliance_rate - a.compliance_rate)[0].compliance_rate}%)`
                              : "لا يوجد تقييم كافي"}
                          </div>
                        </div>
                      </div>

                      <div className="h-8 w-px bg-slate-700 hidden md:block"></div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold text-base">⏱️</div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">متوسط سرعة الإنجاز الموحد</div>
                          <div className="text-sm font-black font-sans text-emerald-300">
                            {kpis.filter(k => k.avg_execution_time_minutes > 0).length > 0
                              ? `${Math.round(kpis.filter(k => k.avg_execution_time_minutes > 0).reduce((acc, curr) => acc + curr.avg_execution_time_minutes, 0) / kpis.filter(k => k.avg_execution_time_minutes > 0).length)} دقيقة / بند`
                              : "لا يوجد تقييم كافي"}
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
  );
}
