import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Trash2, 
  Settings,
  X,
  ShieldCheck,
  Globe
} from "lucide-react";
import { firebaseConfig, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { isUsingLocalFallback, setLocalFallback, forceClearAllCaches, syncLocalDatabaseToFirestore } from "../lib/api";

interface DiagnosticReport {
  timestamp: string;
  navigatorOnline: boolean;
  localFallbackActive: boolean;
  currentProjectId: string;
  configMatch: boolean;
  configError?: string;
  appletConfigDetails?: any;
  firestoreStatus: "unknown" | "success" | "quota_exceeded" | "permission_denied" | "error";
  firestoreErrorMessage?: string;
  firestoreLatencyMs?: number;
}

export default function FirebaseDiagnosticTool() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [activeTab, setActiveTab] = useState<"status" | "config" | "actions">("status");

  const runDiagnostics = async () => {
    setIsRunning(true);
    const start = performance.now();
    
    const currentOnline = navigator.onLine;
    const currentFallback = isUsingLocalFallback();
    const activeProjId = firebaseConfig.projectId;

    let appletConfig: any = null;
    let configMatch = false;
    let configErrorMsg = "";

    // 1. Fetch live applet config json
    try {
      const response = await fetch("/firebase-applet-config.json");
      if (response.ok) {
        appletConfig = await response.json();
        // Check if config matches what we initialized
        const fileProjectId = appletConfig.projectId || appletConfig.ProjectId;
        if (fileProjectId === activeProjId) {
          configMatch = true;
        } else {
          configErrorMsg = `الرمز الحالي بالمستعرض هو "${activeProjId}" ولكن بالملف هو "${fileProjectId}"`;
        }
      } else {
        configErrorMsg = `فشل تحميل ملف firebase-applet-config.json (كود: ${response.status})`;
      }
    } catch (e: any) {
      configErrorMsg = `خطأ أثناء قراءة ملف الإعدادات: ${e.message}`;
    }

    // 2. Perform direct Firestore verification read
    let firestoreStatus: DiagnosticReport["firestoreStatus"] = "unknown";
    let firestoreErrorMessage = "";
    let latency = 0;

    if (!currentFallback) {
      try {
        const dummyRef = doc(db, "users", "admin"); // Check if admin profile can be fetched
        const docSnap = await getDoc(dummyRef);
        firestoreStatus = "success";
        latency = Math.round(performance.now() - start);
      } catch (err: any) {
        firestoreErrorMessage = err.message || String(err);
        const errStr = String(err).toLowerCase();
        
        if (errStr.includes("quota") || errStr.includes("resource_exhausted") || errStr.includes("exceeded")) {
          firestoreStatus = "quota_exceeded";
        } else if (errStr.includes("permission") || errStr.includes("denied")) {
          firestoreStatus = "permission_denied";
        } else {
          firestoreStatus = "error";
        }
      }
    } else {
      firestoreStatus = "unknown";
      firestoreErrorMessage = "تم تجاهل الفحص لأن التطبيق مضبوط حالياً على الوضع المحلي (Offline Mode).";
    }

    setReport({
      timestamp: new Date().toLocaleTimeString("ar-EG"),
      navigatorOnline: currentOnline,
      localFallbackActive: currentFallback,
      currentProjectId: activeProjId,
      configMatch,
      configError: configErrorMsg,
      appletConfigDetails: appletConfig,
      firestoreStatus,
      firestoreErrorMessage,
      firestoreLatencyMs: latency > 0 ? latency : undefined
    });

    setIsRunning(false);
  };

  useEffect(() => {
    if (isOpen) {
      void runDiagnostics();
    }
  }, [isOpen]);

  const handleToggleFallback = () => {
    const nextState = !isUsingLocalFallback();
    setLocalFallback(nextState);
    if (report) {
      setReport({
        ...report,
        localFallbackActive: nextState,
        firestoreStatus: nextState ? "unknown" : report.firestoreStatus,
        firestoreErrorMessage: nextState ? "تم تحويل التطبيق للوضع المحلي" : report.firestoreErrorMessage
      });
    }
  };

  const handleClearCacheAndReload = () => {
    if (window.confirm("هل أنت متأكد من مسح جميع البيانات المخزنة محلياً وجلسات الدخول؟ سيقوم التطبيق بإعادة التشغيل.")) {
      forceClearAllCaches();
      window.location.reload();
    }
  };

  const handleSyncToCloud = async () => {
    if (!window.confirm("هل أنت متأكد من مزامنة ونقل كافة البيانات المخزنة محلياً (البنود، المهام، والصور المرفقة بها) إلى السحاب؟ سيتم مسح أي بيانات سحابية وتثبيت البيانات المحلية بدلاً منها لمنع التكرار.")) {
      return;
    }
    
    setIsSyncing(true);
    try {
      await syncLocalDatabaseToFirestore();
      alert("تمت مزامنة ونقل كافة البيانات المحلية بنجاح إلى قاعدة بيانات Firestore السحابية الجديدة! سيقوم التطبيق الآن بإعادة تحميل الصفحة.");
      window.location.reload();
    } catch (err: any) {
      console.error("[Sync Tool Error]:", err);
      alert(`فشل المزامنة: ${err.message || String(err)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        id="btn-diagnostic-trigger"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-full shadow-lg border border-slate-700/60 transition flex items-center gap-2 text-xs font-bold cursor-pointer"
        dir="rtl"
      >
        <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span>فحص جودة الاتصال 🔧</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div 
            id="panel-diagnostic-modal"
            className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold">لوحة تشخيص وفحص الاتصال بالـ Firestore</h3>
              </div>
              <button 
                id="btn-diagnostic-close"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50 p-1 gap-1 text-xs font-bold text-slate-600">
              <button
                id="tab-diagnostic-status"
                onClick={() => setActiveTab("status")}
                className={`flex-1 py-2 px-3 rounded-lg text-center transition ${
                  activeTab === "status" 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" 
                    : "hover:bg-slate-200/50 text-slate-600"
                }`}
              >
                حالة الخادم
              </button>
              <button
                id="tab-diagnostic-config"
                onClick={() => setActiveTab("config")}
                className={`flex-1 py-2 px-3 rounded-lg text-center transition ${
                  activeTab === "config" 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" 
                    : "hover:bg-slate-200/50 text-slate-600"
                }`}
              >
                الملف والربط
              </button>
              <button
                id="tab-diagnostic-actions"
                onClick={() => setActiveTab("actions")}
                className={`flex-1 py-2 px-3 rounded-lg text-center transition ${
                  activeTab === "actions" 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" 
                    : "hover:bg-slate-200/50 text-slate-600"
                }`}
              >
                إجراءات الصيانة
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 text-xs">
              
              {/* Tab 1: Status Details */}
              {activeTab === "status" && (
                <div className="space-y-4">
                  {/* Status Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-slate-500 font-bold">شبكة المستعرض:</span>
                      {report?.navigatorOnline ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <Wifi className="w-4 h-4" /> متصل
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <WifiOff className="w-4 h-4" /> منقطع
                        </span>
                      )}
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-slate-500 font-bold">الوضع الحالي:</span>
                      {report?.localFallbackActive ? (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-extrabold">
                          محلي بالكامل (Offline)
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-extrabold">
                          سحابي مباشر (Cloud)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Real-time Connection Verdict */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-800">اختبار استجابة الـ Firestore:</h4>
                      <button 
                        id="btn-retest-connection"
                        onClick={runDiagnostics} 
                        disabled={isRunning}
                        className="text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
                        إعادة الفحص الآن
                      </button>
                    </div>

                    {report && (
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        {report.localFallbackActive ? (
                          <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200/60 rounded-lg flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">التطبيق قيد التشغيل في الوضع المحلي الآمن!</p>
                              <p className="text-[10px] text-amber-800/80 mt-1 leading-relaxed">
                                يتم تجاوز فحص السحابة لحماية تجربة العميل. إذا كنت قد قمت بتحديث حصة Firebase أو أنشأت مشروعاً جديداً، انقر فوق "إجراءات الصيانة" بالتبويب بالأعلى لإلغاء الوضع المحلي ومحاولة الاتصال مرة أخرى.
                              </p>
                            </div>
                          </div>
                        ) : report.firestoreStatus === "success" ? (
                          <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200/60 rounded-lg flex items-start gap-2.5">
                            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">الاتصال بالـ Firestore سليم وممتاز!</p>
                              <p className="text-[10px] text-emerald-800/80 mt-1">
                                زمن الاستجابة: <strong className="text-emerald-700">{report.firestoreLatencyMs} مللي ثانية</strong>. الكوته كافية وقابلة للعمل.
                              </p>
                            </div>
                          </div>
                        ) : report.firestoreStatus === "quota_exceeded" ? (
                          <div className="p-3 bg-rose-50 text-rose-900 border border-rose-200/60 rounded-lg flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">تم تجاوز حصة استخدام Firestore بالكامل! (Quota Exceeded)</p>
                              <p className="text-[10px] text-rose-800/80 mt-1 leading-relaxed">
                                الكوته المجانية اليومية لهذا المشروع نفدت. يرجى التأكد من ربط مشروع Firebase الجديد تماماً في الكود أو الانتظار لتحديث حصة قوقل اليومية.
                              </p>
                              <p className="text-[10px] text-rose-600 bg-white/60 p-2 rounded border border-rose-100 mt-2 font-mono break-all leading-normal">
                                {report.firestoreErrorMessage}
                              </p>
                            </div>
                          </div>
                        ) : report.firestoreStatus === "permission_denied" ? (
                          <div className="p-3 bg-red-50 text-red-900 border border-red-200/60 rounded-lg flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">صلاحية الوصول مرفوضة! (Permission Denied)</p>
                              <p className="text-[10px] text-red-800/80 mt-1 leading-relaxed">
                                قواعد الحماية بقاعدة البيانات ترفض جلب أو قراءة البيانات. تأكد من رفع قواعد الحماية (firestore.rules) للمشروع الجديد.
                              </p>
                              <p className="text-[10px] text-red-600 bg-white/60 p-2 rounded border border-red-100 mt-2 font-mono break-all leading-normal">
                                {report.firestoreErrorMessage}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">فشل الاتصال بقاعدة البيانات سحابياً!</p>
                              <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                                لم نستطع الاتصال بالـ Firestore. تفاصيل الخطأ:
                              </p>
                              <p className="text-[10px] text-slate-700 bg-white/80 p-2 rounded border border-slate-200 mt-2 font-mono break-all leading-normal">
                                {report.firestoreErrorMessage}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Config Validation */}
              {activeTab === "config" && (
                <div className="space-y-4">
                  {/* Active VS File Verification */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      فحص تطابق معرفات الربط:
                    </h4>

                    {report?.configMatch ? (
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-lg font-bold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>الملفات متطابقة تماماً والمستعرض متصل بالمشروع الجديد!</span>
                      </div>
                    ) : (
                      <div className="bg-rose-50 text-rose-800 border border-rose-100 p-2.5 rounded-lg flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>تحذير: يوجد عدم تطابق أو مشكلة بقراءة ملف الربط!</span>
                        </div>
                        <p className="text-[10px] text-rose-800/85 font-semibold leading-normal">
                          {report?.configError || "يرجى مراجعة إعدادات مشروع cleaner2-a4188."}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 pt-2 text-[11px] font-bold">
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500">المشروع النشط برمجياً:</span>
                        <span className="text-indigo-600 font-mono">{firebaseConfig.projectId}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500">المستند النشط بالملف المصدري:</span>
                        <span className="text-indigo-600 font-mono">
                          {report?.appletConfigDetails?.projectId || report?.appletConfigDetails?.ProjectId || "غير متوفر"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500">معرف تطبيق قوقل (App ID):</span>
                        <span className="text-slate-700 font-mono text-[9px] break-all max-w-[200px] text-left">
                          {firebaseConfig.appId}
                        </span>
                      </div>
                      <div className="flex justify-between pb-0.5">
                        <span className="text-slate-500">مخزن قاعدة البيانات (DB ID):</span>
                        <span className="text-slate-700 font-mono text-[9px] break-all max-w-[200px] text-left">
                          {firebaseConfig.firestoreDatabaseId}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Maintenance Actions */}
              {activeTab === "actions" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                    <h4 className="font-extrabold text-slate-800">صيانة الكاش والتشغيل السحابي:</h4>

                    {/* Action 1: Toggle Fallback */}
                    <div className="space-y-1.5 pb-3.5 border-b border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-700">التبديل بين الاتصال المباشر والمحلي:</span>
                        <button
                          id="btn-diagnostic-toggle-fallback"
                          onClick={handleToggleFallback}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                            report?.localFallbackActive 
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300" 
                              : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border border-indigo-300"
                          }`}
                        >
                          {report?.localFallbackActive ? "تفعيل السحابي (محاولة اتصال)" : "تفعيل المحلي (Offline)"}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        قم بإيقاف "الوضع المحلي" لإجبار المستعرض على توجيه طلبات قراءة وكتابة البيانات مباشرة لخادم Firestore السحابي وفحص الاتصال بالمشروع الجديد.
                      </p>
                    </div>

                    {/* Action 2: Clear Caches completely */}
                    <div className="space-y-1.5 pb-3.5 border-b border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-700">تفريغ الكاش بالكامل وتسجيل الخروج:</span>
                        <button
                          id="btn-diagnostic-wipe-cache"
                          onClick={handleClearCacheAndReload}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          تفريغ الكاش وإعادة الفحص
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        يقوم بمسح كامل لـ `localStorage` والبيانات المؤقتة والبنود المخزنة، بالإضافة لتسجيل الخروج الإجباري، لمنع تلوث المستعرض ببيانات المشاريع السابقة.
                      </p>
                    </div>

                    {/* Action 3: Force Sync Local Database to Cloud */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-700">مزامنة ونقل البيانات المحلية إلى السحاب فوراً:</span>
                        <button
                          id="btn-diagnostic-sync-to-cloud"
                          onClick={handleSyncToCloud}
                          disabled={isSyncing}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isSyncing ? "جاري الرفع..." : "مزامنة ورفع الآن"}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        يقوم بمسح قاعدة البيانات السحابية الحالية ورفع كافة البيانات المخزنة محلياً (البنود والمهام والصور المرفقة بها) لضمان عدم حدوث تكرار أو فقدان للبيانات.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold">
              <span>تحديث الفحص: {report?.timestamp || "قيد التحميل..."}</span>
              <button
                id="btn-diagnostic-modal-close-footer"
                onClick={() => setIsOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                إغلاق اللوحة
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
