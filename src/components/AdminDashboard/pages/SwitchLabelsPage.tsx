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
import SwitchLabelsGuide from "../../SwitchLabelsGuide";


type PageProps = { dashboard: AdminDashboardModel };

export default function SwitchLabelsPage({ dashboard }: PageProps) {
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
  <div
    className="
      min-h-full
      w-full
      bg-slate-50
      dark:bg-slate-950
      text-slate-900
      dark:text-slate-100
    "
    dir="rtl"
  >
    {/* =========================================================
        PAGE BACKGROUND
    ========================================================== */}
    <div
      className="
        relative
        min-h-full
        overflow-hidden
      "
    >
      {/* Decorative Background */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
        "
      >
        <div
          className="
            absolute
            -right-32
            -top-32
            h-96
            w-96
            rounded-full
            bg-indigo-500/[0.05]
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -left-32
            top-1/3
            h-96
            w-96
            rounded-full
            bg-violet-500/[0.04]
            blur-3xl
          "
        />

        <div
          className="
            absolute
            bottom-0
            right-1/3
            h-72
            w-72
            rounded-full
            bg-cyan-500/[0.03]
            blur-3xl
          "
        />
      </div>

      {/* =======================================================
          CONTENT CONTAINER
      ======================================================== */}
      <main
        className="
          relative
          mx-auto
          w-full
          max-w-[1680px]
          px-4
          py-5
          sm:px-6
          sm:py-6
          lg:px-8
          lg:py-8
        "
      >

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}
        <section className="mb-6">
          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            {/* Title */}
            <div className="min-w-0">
              <div
                className="
                  mb-2
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-indigo-200
                  bg-indigo-50
                  px-3
                  py-1.5
                  dark:border-indigo-500/20
                  dark:bg-indigo-500/[0.08]
                "
              >
                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-indigo-500
                    shadow-[0_0_8px_rgba(99,102,241,0.65)]
                  "
                />

                <span
                  className="
                    text-[10px]
                    font-extrabold
                    text-indigo-700
                    dark:text-indigo-300
                  "
                >
                  دليل التشغيل
                </span>
              </div>

              <h1
                className="
                  text-2xl
                  font-black
                  tracking-tight
                  text-slate-900
                  dark:text-white
                  sm:text-3xl
                "
              >
                دليل مفاتيح التشغيل
              </h1>

              <p
                className="
                  mt-2
                  max-w-2xl
                  text-xs
                  font-medium
                  leading-6
                  text-slate-500
                  dark:text-slate-400
                  sm:text-sm
                "
              >
                مرجع تشغيلي يوضح طريقة التعامل مع مفاتيح التشغيل،
                الحالات المختلفة، وإجراءات الاستخدام الصحيحة داخل النظام.
              </p>
            </div>

            {/* Page Meta */}
            <div
              className="
                hidden
                shrink-0
                items-center
                gap-3
                rounded-2xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                shadow-sm
                dark:border-slate-800
                dark:bg-slate-900/70
                md:flex
              "
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-indigo-50
                  text-indigo-600
                  dark:bg-indigo-500/10
                  dark:text-indigo-400
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M12 3v18" />
                  <path d="M3 12h18" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>

              <div>
                <p
                  className="
                    text-[9px]
                    font-bold
                    text-slate-400
                    dark:text-slate-500
                  "
                >
                  قسم الإدارة
                </p>

                <p
                  className="
                    mt-0.5
                    text-[11px]
                    font-extrabold
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  التشغيل والجودة
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================
            GUIDE CARD
        ======================================================== */}
        <section
          className="
            relative
            overflow-hidden
            rounded-[26px]
            border
            border-slate-200/80
            bg-white
            shadow-[0_12px_40px_rgba(15,23,42,0.06)]
            dark:border-slate-800
            dark:bg-slate-900/80
            dark:shadow-[0_12px_40px_rgba(0,0,0,0.18)]
          "
        >
          {/* Top Accent */}
          <div
            className="
              absolute
              inset-x-0
              top-0
              h-1
              bg-gradient-to-l
              from-indigo-500
              via-violet-500
              to-cyan-500
            "
          />

          {/* Card Header */}
          <div
            className="
              flex
              flex-col
              gap-3
              border-b
              border-slate-100
              px-5
              py-5
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:px-7
              dark:border-slate-800
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-indigo-50
                  text-indigo-600
                  dark:bg-indigo-500/10
                  dark:text-indigo-400
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M4 5h16v14H4z" />
                  <path d="M8 9h8M8 13h5" />
                </svg>
              </div>

              <div>
                <h2
                  className="
                    text-sm
                    font-black
                    text-slate-900
                    dark:text-white
                    sm:text-base
                  "
                >
                  دليل مفاتيح التشغيل
                </h2>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    font-medium
                    text-slate-400
                    dark:text-slate-500
                  "
                >
                  المرجع البصري والإجرائي للمستخدمين
                </p>
              </div>
            </div>

            {/* Status */}
            <div
              className="
                inline-flex
                w-fit
                items-center
                gap-2
                rounded-full
                border
                border-emerald-200
                bg-emerald-50
                px-3
                py-1.5
                dark:border-emerald-500/20
                dark:bg-emerald-500/[0.07]
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-emerald-500
                  shadow-[0_0_7px_rgba(16,185,129,0.6)]
                "
              />

              <span
                className="
                  text-[9px]
                  font-extrabold
                  text-emerald-700
                  dark:text-emerald-400
                "
              >
                محدث
              </span>
            </div>
          </div>

          {/* Guide Content */}
          <div
            className="
              p-4
              sm:p-6
              lg:p-7
            "
          >
            <div
              className="
                rounded-2xl
                border
                border-slate-100
                bg-slate-50/60
                p-4
                sm:p-5
                dark:border-slate-800
                dark:bg-slate-950/30
              "
            >
              <SwitchLabelsGuide />
            </div>
          </div>
        </section>

        {/* =======================================================
            BOTTOM INFO
        ======================================================== */}
        <div
          className="
            mt-4
            flex
            items-center
            justify-between
            gap-3
            px-1
          "
        >
          <p
            className="
              text-[9px]
              font-medium
              text-slate-400
              dark:text-slate-600
            "
          >
            Admin Operations Center
          </p>

          <div className="flex items-center gap-1.5">
            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-indigo-500
              "
            />

            <span
              className="
                text-[9px]
                font-bold
                text-slate-400
                dark:text-slate-600
              "
            >
              Operations & Quality
            </span>
          </div>
        </div>
      </main>
    </div>
  </div>
);
}
