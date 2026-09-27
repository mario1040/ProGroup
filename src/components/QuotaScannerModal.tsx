import React, { useState, useMemo } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Eye,
  Filter,
  Flame,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
  Wifi,
  X,
  Zap
} from "lucide-react";
import {
  useQuotaTelemetry,
  resetQuotaTelemetryStats,
  runQuotaAuditScan,
  setUltraQuotaSaverEnabled,
  setSkipSessionFocusChecksEnabled,
  QuotaCategory,
  QuotaEvent
} from "../lib/quotaManager";
import { forceClearAllCaches } from "../lib/api";

interface QuotaScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuotaScannerModal({ isOpen, onClose }: QuotaScannerModalProps) {
  const stats = useQuotaTelemetry();
  const [activeTab, setActiveTab] = useState<"overview" | "radar" | "events" | "controls">("overview");
  const [eventFilter, setEventFilter] = useState<"all" | QuotaCategory>("all");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(() => runQuotaAuditScan());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setScanResult(runQuotaAuditScan());
      setIsScanning(false);
      showToast("تم إجراء فحص وتشخيص استهلاك الكوتة بنجاح ⚡");
    }, 450);
  };

  const handleResetCounters = () => {
    if (window.confirm("هل تريد تصفير عداد المراقبة لليوم؟ يفيد هذا في قياس الاستهلاك لجلسة اختبار جديدة دون التأثير على قاعدة البيانات.")) {
      resetQuotaTelemetryStats();
      setScanResult(runQuotaAuditScan());
      showToast("تم تصفير عداد المراقبة لليوم بنجاح 🔄");
    }
  };

  const handleClearCacheAndSync = () => {
    forceClearAllCaches();
    showToast("تم مسح الذاكرة المؤقتة (Cache)؛ سيتم سحب أحدث بيانات من السحابة عند الحاجة.");
  };

  // Calculations
  const totalCombinedReads = stats.totalCloudReads + stats.totalRealtimeReads;
  const readPercent = Math.min(100, Math.round((totalCombinedReads / stats.dailyReadLimit) * 100));
  const writePercent = Math.min(100, Math.round((stats.totalCloudWrites / stats.dailyWriteLimit) * 100));

  const filteredEvents = useMemo(() => {
    if (eventFilter === "all") return stats.recentEvents;
    return stats.recentEvents.filter((ev) => ev.category === eventFilter);
  }, [stats.recentEvents, eventFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 font-sans text-right" dir="rtl">
      <div 
        id="panel-quota-scanner-modal"
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300 shadow-inner">
              <Activity className="w-6 h-6 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">رادار وفحص استهلاك الكوتة السحابية 📊</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Firebase Quota Radar
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                تتبع وتحليل دقيق لكل قراءة وكتابة لمعرفة أين تضيع الكوتة وكيفية إيقاف الهدر
              </p>
            </div>
          </div>

          <button
            id="btn-close-quota-scanner"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2 gap-1.5 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
              activeTab === "overview"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>نظرة عامة والحدود</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("radar");
              handleRunScan();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
              activeTab === "radar"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>فحص: من أين تخلص الكوتة؟ 🔍</span>
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
              activeTab === "events"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>سجل العمليات اللحظي ({stats.recentEvents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("controls")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
              activeTab === "controls"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Shield className="w-4 h-4 text-blue-500" />
            <span>أدوات التوفير والتحكم ⚙️</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Toast notification */}
          {toastMessage && (
            <div className="bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW & GAUGES */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Top Banner Alert */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                readPercent > 80
                  ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300"
                  : readPercent > 50
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300"
                    : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300"
              }`}>
                {readPercent > 80 ? (
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                ) : readPercent > 50 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {readPercent > 80 
                      ? "تحذير: استهلاك الكوتة السحابية مرتفع جداً ويقترب من الحد اليومي المجاني!" 
                      : readPercent > 50
                        ? "تنبيه: تم تجاوز نصف الحصة السحابية اليومية؛ يُنصح بتفعيل وضع التوفير الفائق."
                        : "حالة الكوتة آمنة ومستقرة تماماً ضمن الحصة المجانية السحابية اليومية."}
                  </h4>
                  <p className="text-xs opacity-90 mt-1">
                    حصة Firebase Spark المجانية هي <strong>50,000 عملية قراءة</strong> و<strong>20,000 عملية كتابة</strong> يومياً (تتجدد تلقائياً كل 24 ساعة بتوقيت جرينتش).
                  </p>
                </div>
              </div>

              {/* Quota Progress Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Cloud Reads Gauge */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <span>قراءات السحابة (Cloud Reads)</span>
                    <Eye className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {totalCombinedReads.toLocaleString()}
                      <span className="text-xs font-normal text-slate-400 mr-1.5">/ 50,000</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      المباشرة: {stats.totalCloudReads.toLocaleString()} | اللحظية: {stats.totalRealtimeReads.toLocaleString()}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        readPercent > 80 ? "bg-red-500" : readPercent > 50 ? "bg-amber-500" : "bg-indigo-600"
                      }`}
                      style={{ width: `${Math.max(2, readPercent)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-left text-slate-400 font-medium">
                    {readPercent}% مستهلك اليوم
                  </div>
                </div>

                {/* 2. Cloud Writes Gauge */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <span>عمليات الكتابة (Writes)</span>
                    <Flame className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {stats.totalCloudWrites.toLocaleString()}
                      <span className="text-xs font-normal text-slate-400 mr-1.5">/ 20,000</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      حفظ التحديثات والصور والمهام
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        writePercent > 80 ? "bg-red-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.max(2, writePercent)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-left text-slate-400 font-medium">
                    {writePercent}% مستهلك اليوم
                  </div>
                </div>

                {/* 3. Cache Savings */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <span>قراءات وفرها الكاش مجاناً</span>
                    <Zap className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      +{stats.totalCacheSavedReads.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      قراءة تم توفيرها عبر Smart Cache
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                    🛡️ لم تُسحب من كوتة السحابة نهائياً
                  </div>
                </div>

                {/* 4. Real-time Snapshots */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <span>الاستماع اللحظي (Snapshots)</span>
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {stats.totalRealtimeReads.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      تحديثات مهام حية عبر onSnapshot
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                    ⚡ تزامن حي بين الإدارة وهواتف العمال
                  </div>
                </div>
              </div>

              {/* The Core Question: Where is Quota Wasted? */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-slate-800/80 dark:via-slate-800 dark:to-slate-850 border border-indigo-100 dark:border-indigo-900/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-900/40 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-500" />
                      <span>توزيع الاستهلاك: من أين تخلص الكوتة بالضبط؟</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      مقارنة مباشرة بين لوحة الإدارة، وعمال النظافة، وعمليات الدخول والجلسات
                    </p>
                  </div>
                  <button
                    onClick={handleRunScan}
                    disabled={isScanning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow cursor-pointer self-start sm:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                    <span>فحص فوري للاستهلاك</span>
                  </button>
                </div>

                {/* Comparative Multi-color Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>نسب استهلاك القراءات اليوم:</span>
                    <span>الإجمالي: {totalCombinedReads.toLocaleString()} قراءة</span>
                  </div>
                  <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-indigo-600 transition-all duration-500 h-full" 
                      style={{ width: `${stats.categories.admin.percentageOfReads}%` }}
                      title={`لوحة الإدارة: ${stats.categories.admin.percentageOfReads}%`}
                    />
                    <div 
                      className="bg-emerald-500 transition-all duration-500 h-full" 
                      style={{ width: `${stats.categories.cleaners.percentageOfReads}%` }}
                      title={`عمال النظافة: ${stats.categories.cleaners.percentageOfReads}%`}
                    />
                    <div 
                      className="bg-amber-500 transition-all duration-500 h-full" 
                      style={{ width: `${stats.categories.auth_session.percentageOfReads}%` }}
                      title={`الدخول والجلسات: ${stats.categories.auth_session.percentageOfReads}%`}
                    />
                    <div 
                      className="bg-blue-500 transition-all duration-500 h-full" 
                      style={{ width: `${stats.categories.realtime_listeners.percentageOfReads}%` }}
                      title={`الاستماع اللحظي: ${stats.categories.realtime_listeners.percentageOfReads}%`}
                    />
                  </div>
                </div>

                {/* 4 Source Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Card 1: Admin */}
                  <div className={`p-3.5 rounded-xl border transition ${
                    stats.categories.admin.percentageOfReads >= 40
                      ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                        <Database className="w-4 h-4" />
                        <span>لوحة الإدارة</span>
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-black bg-indigo-600 text-white">
                        {stats.categories.admin.percentageOfReads}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {(stats.categories.admin.reads + stats.categories.admin.realtimeReads).toLocaleString()} قراءة
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                        <div>• مهام اليوم ومؤشرات KPI</div>
                        <div>• إدارة الكوادر والمناطق</div>
                        <div>• {stats.categories.admin.writes} عمليات كتابة واعتماد</div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Cleaners */}
                  <div className={`p-3.5 rounded-xl border transition ${
                    stats.categories.cleaners.percentageOfReads >= 40
                      ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4" />
                        <span>عمال النظافة</span>
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-black bg-emerald-600 text-white">
                        {stats.categories.cleaners.percentageOfReads}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {(stats.categories.cleaners.reads + stats.categories.cleaners.realtimeReads).toLocaleString()} قراءة
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                        <div>• عرض مهام العامل فقط</div>
                        <div>• فحص البنود ورفع الصور</div>
                        <div>• {stats.categories.cleaners.writes} تسليم مهمة وتحديث</div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Auth & Sessions */}
                  <div className={`p-3.5 rounded-xl border transition ${
                    stats.categories.auth_session.percentageOfReads >= 30
                      ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <Lock className="w-4 h-4" />
                        <span>الدخول والجلسات</span>
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-black bg-amber-600 text-white">
                        {stats.categories.auth_session.percentageOfReads}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {stats.categories.auth_session.reads.toLocaleString()} قراءة
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                        <div>• تسجيل الدخول لأول مرة</div>
                        <div>• استرجاع الجلسة المحفوظة</div>
                        <div>• فحص الجلسة عند قفل الشاشة</div>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Realtime Snapshots & Sync */}
                  <div className={`p-3.5 rounded-xl border transition ${
                    stats.categories.realtime_listeners.percentageOfReads >= 30
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4" />
                        <span>الاستماع والتهيئة</span>
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-black bg-blue-600 text-white">
                        {stats.categories.realtime_listeners.percentageOfReads}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {(stats.categories.realtime_listeners.realtimeReads + stats.categories.background_tasks.reads).toLocaleString()} قراءة
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                        <div>• onSnapshot لتحديث المهام</div>
                        <div>• توليد مهام اليوم المتكررة</div>
                        <div>• فحص التهيئة الأولي (سريع)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED SCAN & AUDIT (RADAR) */}
          {activeTab === "radar" && (
            <div className="space-y-6">
              {/* Scan Header Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-400" />
                      <h3 className="text-base font-black">تقرير فحص وتحليل استهلاك الكوتة السحابية</h3>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      آخر فحص تم في: {scanResult.scanTimestamp} • التقييم:{" "}
                      <span className={`font-bold ${
                        scanResult.riskLevel === "safe" ? "text-emerald-400" : scanResult.riskLevel === "moderate" ? "text-amber-400" : "text-red-400"
                      }`}>
                        {scanResult.riskLevel === "safe" ? "استهلاك آمن ومثالي" : scanResult.riskLevel === "moderate" ? "استهلاك متوسط بحاجة للمراقبة" : "استهلاك خطر يقترب من الحد"}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={handleRunScan}
                    disabled={isScanning}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow cursor-pointer self-start sm:self-auto"
                  >
                    <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
                    <span>إعادة الفحص الآن</span>
                  </button>
                </div>

                {/* Direct Answer Banner */}
                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                  <div className="text-xs font-semibold text-amber-300">
                    💡 الإجابة المباشرة: من أين تخلص الكوتة؟
                  </div>
                  <div className="text-sm font-black text-white mt-1">
                    أكبر مصدر للاستهلاك هو: {scanResult.mainCulprit.title} (يشكل {scanResult.mainCulprit.percentage}% من إجمالي القراءات)
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {scanResult.mainCulprit.description}
                  </p>
                </div>
              </div>

              {/* Scan Findings */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-500" />
                  <span>نتائج الفحص والتحليل التفصيلي:</span>
                </h4>
                <div className="space-y-2">
                  {scanResult.findings.map((finding, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>الإجراءات المنفذة والتوصيات لحماية الكوتة من النفاد:</span>
                </h4>
                <div className="space-y-2">
                  {scanResult.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE OPERATIONS LOG */}
          {activeTab === "events" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  يعرض آخر {stats.recentEvents.length} عملية سحابية تم تسجيلها لحظياً مع نوعها ومصدرها:
                </div>

                {/* Filter buttons */}
                <div className="flex flex-wrap gap-1 text-[11px] font-bold">
                  <button
                    onClick={() => setEventFilter("all")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      eventFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    الكل ({stats.recentEvents.length})
                  </button>
                  <button
                    onClick={() => setEventFilter("admin")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      eventFilter === "admin" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    الإدارة
                  </button>
                  <button
                    onClick={() => setEventFilter("cleaners")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      eventFilter === "cleaners" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    العمال
                  </button>
                  <button
                    onClick={() => setEventFilter("auth_session")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      eventFilter === "auth_session" ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    الجلسات
                  </button>
                  <button
                    onClick={() => setEventFilter("realtime_listeners")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      eventFilter === "realtime_listeners" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    اللحظية
                  </button>
                </div>
              </div>

              {/* Event Table / Cards */}
              {filteredEvents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-medium">
                  لا توجد عمليات مسجلة تحت هذا التصنيف حتى الآن.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((ev) => (
                    <div 
                      key={ev.id} 
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition ${
                        ev.isCacheHit
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300"
                          : ev.operation === "write"
                            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40 text-slate-800 dark:text-slate-200"
                            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          ev.isCacheHit
                            ? "bg-emerald-600 text-white"
                            : ev.operation === "write"
                              ? "bg-amber-500 text-white"
                              : ev.operation === "realtime_read"
                                ? "bg-blue-600 text-white"
                                : "bg-indigo-600 text-white"
                        }`}>
                          {ev.isCacheHit ? "كاش مجاني 0$" : ev.operation === "write" ? "كتابة" : ev.operation === "realtime_read" ? "لحظي" : "قراءة سحابية"}
                        </span>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{ev.action}</span>
                            <span className="text-[10px] text-slate-400 font-mono">[{ev.collection}]</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            المصدر: {ev.categoryLabel}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {ev.docCount} مستند
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {ev.timeFormatted}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONTROLS & OPTIMIZATION SETTINGS */}
          {activeTab === "controls" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>إعدادات حماية الكوتة الفائقة (Quota Protections):</span>
                </h4>

                <div className="space-y-3">
                  {/* Setting 1: Ultra Quota Saver Mode */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        وضع التوفير الفائق للكوتة (Ultra Quota-Saver Mode)
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        تمديد كاش البيانات الثابتة (المناطق، القوالب، قائمة العمال) إلى 60 دقيقة وتخطي عمليات القراءة الزائدة أثناء تحديث المهام.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const next = !stats.ultraQuotaSaver;
                        setUltraQuotaSaverEnabled(next);
                        showToast(next ? "تم تفعيل وضع التوفير الفائق ✅" : "تم تعطيل وضع التوفير الفائق");
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                        stats.ultraQuotaSaver
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {stats.ultraQuotaSaver ? "مفعّل 🛡️" : "معطل"}
                    </button>
                  </div>

                  {/* Setting 2: Skip Session Focus Checks */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        قفل فحص الجلسة عند قفل شاشات الهواتف والعودة للمتصفح
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        يمنع استهلاك قراءات سحابية كلما قفل العامل هاتفه أو انتقل للكاميرا ثم عاد للتطبيق؛ يتم الاعتماد على الجلسة المحلية الآمنة.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const next = !stats.skipSessionFocusChecks;
                        setSkipSessionFocusChecksEnabled(next);
                        showToast(next ? "تم قفل فحص الجلسة عند فتح الشاشة ✅" : "تم السماح بفحص الجلسة");
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                        stats.skipSessionFocusChecks
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {stats.skipSessionFocusChecks ? "مفعّل 🔒" : "معطل"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Maintenance Actions */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-500" />
                  <span>عمليات الصيانة وإعادة الضبط:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleResetCounters}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-3 transition text-right cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 shrink-0">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">تصفير عداد المراقبة لليوم</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">يفيد لقياس استهلاك جلسة محددة واختبارها</div>
                    </div>
                  </button>

                  <button
                    onClick={handleClearCacheAndSync}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-3 transition text-right cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 shrink-0">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">تفريغ الكاش ومزامنة كاملة</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">مسح التخزين المؤقت وسحب بيانات جديدة</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>نظام المراقبة نشط ويسجل كافة عمليات Firestore لحظياً</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunScan}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition cursor-pointer"
            >
              فحص سريع
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
