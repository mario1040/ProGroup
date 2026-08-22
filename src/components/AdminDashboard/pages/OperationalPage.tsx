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

export default function OperationalPage({ dashboard }: PageProps) {
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
                              <span className="font-semibold text-slate-700">
                                {ot.responsible_employee?.is_active === true
                                  ? ot.responsible_employee.full_name
                                  : "لا يوجد مسؤول نشط"}
                              </span>
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
  );
}
