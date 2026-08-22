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

export default function EmployeesPage({ dashboard }: PageProps) {
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
                      <h3 className="text-sm font-bold text-slate-800">إدارة حسابات الموظفين وكلمات المرور 👥</h3>
                      <p className="text-xs text-slate-400 mt-0.5">التحكم في بيانات الموظفين وتعيين وتعديل كلمات المرور للوصول الآمن إلى النظام</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEmployeeFullName("");
                        setEmployeeUsername("");
                        setEmployeeRole("cleaner");
                        setEmployeePhone("");
                        setIsAddEmployeeModalOpen(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> إضافة موظف جديد
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">الموظف</th>
                          <th className="p-3">اسم المستخدم للتشغيل</th>
                          <th className="p-3">البريد الإلكتروني للتوثيق</th>
                          <th className="p-3">الدور والمسؤولية</th>
                          <th className="p-3">رقم الهاتف</th>
                          <th className="p-3 text-center">الحالة التشغيلية</th>
                          <th className="p-3 text-center">الإجراءات والتوثيق</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {profiles.map((p) => {
                          const isActive = p.is_active === true;
                          const email = `${p.username.toLowerCase()}@narisops.com`;
                          const roleLabel = p.role === 'admin' ? 'مدير العمليات' : p.role === 'supervisor' ? 'مشرف جودة' : 'موظف تشغيل ونظافة';
                          const roleColor = p.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : p.role === 'supervisor' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200';
                          
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                    p.role === 'admin' ? 'bg-purple-100 text-purple-700' : p.role === 'supervisor' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {p.full_name.slice(0, 2)}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-800 block">{p.full_name}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">ID: {p.id}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-700">{p.username}</td>
                              <td className="p-3 text-slate-400 font-mono text-[10px]">{email}</td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full border ${roleColor}`}>
                                  {roleLabel}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500 font-mono">{p.phone || "—"}</td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleEmployeeStatus(p)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer border transition flex items-center justify-center gap-1 mx-auto ${
                                    isActive 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100" 
                                      : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                                  }`}
                                  title={isActive ? "انقر لتعطيل الموظف" : "انقر لتفعيل الموظف"}
                                >
                                  {isActive ? (
                                    <>
                                      <UserCheck className="w-3 h-3 text-emerald-600" />
                                      <span>نشط ●</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="w-3 h-3 text-red-600" />
                                      <span>معطل ○</span>
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                     setEditingEmployee({ ...p });
                                     setEditingEmployeeInitialActive(p.is_active === true);
                                   }}
                                    className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-1 cursor-pointer shadow-sm"
                                    title="تعديل بيانات الموظف"
                                  >
                                    <Edit2 className="w-3 h-3 text-slate-500" />
                                    تعديل
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleProvisionAccess(p)}
                                    className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                    تهيئة التوثيق
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
  );
}
