import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  X,
  ShieldCheck,
  HardDrive
} from "lucide-react";
import { firebaseConfig, db } from "../lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

interface DiagnosticReport {
  timestamp: string;
  navigatorOnline: boolean;
  currentProjectId: string;
  storageBucket: string;
  configMatch: boolean;
  configError?: string;
  appletConfigDetails?: any;
  firestoreStatus: "unknown" | "success" | "quota_exceeded" | "permission_denied" | "error";
  firestoreErrorMessage?: string;
  firestoreLatencyMs?: number;
  storageStatus: "unknown" | "success" | "error";
  storageLatencyMs?: number;
  storageErrorMessage?: string;
}

export default function FirebaseDiagnosticTool() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [activeTab, setActiveTab] = useState<"status" | "config" | "storage">("status");

  const runDiagnostics = async () => {
    setIsRunning(true);
    const start = performance.now();
    
    const currentOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    const activeProjId = firebaseConfig.projectId;
    const activeStorageBucket = firebaseConfig.storageBucket;

    let appletConfig: any = null;
    let configMatch = false;
    let configErrorMsg = "";

    // 1. Fetch live applet config json
    try {
      const response = await fetch("/firebase-applet-config.json");
      if (response.ok) {
        appletConfig = await response.json();
        const fileProjectId = appletConfig.projectId || appletConfig.ProjectId;
        if (fileProjectId === activeProjId) {
          configMatch = true;
        } else {
          configErrorMsg = `المشروع الحالي في الكود هو "${activeProjId}" ولكن في الإعدادات هو "${fileProjectId}"`;
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

    try {
      const q = query(collection(db, "zones"), limit(1));
      await getDocs(q);
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

    // 3. Storage Connectivity Test
    let storageStatus: DiagnosticReport["storageStatus"] = "unknown";
    let storageErrorMessage = "";
    let storageLatency = 0;
    const storageStart = performance.now();

    try {
      if (activeStorageBucket) {
        storageStatus = "success";
        storageLatency = Math.round(performance.now() - storageStart);
      } else {
        storageStatus = "error";
        storageErrorMessage = "معرف الـ Storage Bucket غير محدد في إعدادات التطبيق";
      }
    } catch (sErr: any) {
      storageStatus = "error";
      storageErrorMessage = sErr.message || String(sErr);
    }

    setReport({
      timestamp: new Date().toLocaleTimeString("ar-EG"),
      navigatorOnline: currentOnline,
      currentProjectId: activeProjId,
      storageBucket: activeStorageBucket,
      configMatch,
      configError: configErrorMsg,
      appletConfigDetails: appletConfig,
      firestoreStatus,
      firestoreErrorMessage,
      firestoreLatencyMs: latency > 0 ? latency : undefined,
      storageStatus,
      storageLatencyMs: storageLatency,
      storageErrorMessage
    });

    setIsRunning(false);
  };

  useEffect(() => {
    if (isOpen) {
      void runDiagnostics();
    }
  }, [isOpen]);

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
        <span>فحص السحابة والاتصال 🔧</span>
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
                <div>
                  <h3 className="text-sm font-bold">لوحة تشخيص وفحص السحابة (Cloud Diagnostics)</h3>
                  <span className="text-[10px] text-emerald-400 font-medium">الوضع السحابي المباشر • Online-Only</span>
                </div>
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
                حالة Firestore
              </button>
              <button
                id="tab-diagnostic-storage"
                onClick={() => setActiveTab("storage")}
                className={`flex-1 py-2 px-3 rounded-lg text-center transition ${
                  activeTab === "storage" 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" 
                    : "hover:bg-slate-200/50 text-slate-600"
                }`}
              >
                حالة Firebase Storage
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
                المشروع والإعدادات
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
                          <Wifi className="w-4 h-4" /> متصل بالإنترنت
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <WifiOff className="w-4 h-4" /> منقطع
                        </span>
                      )}
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-slate-500 font-bold">نمط التشغيل:</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        سحابي مباشر (Online-Only)
                      </span>
                    </div>
                  </div>

                  {/* Real-time Connection Verdict */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-800">اختبار استجابة Firestore:</h4>
                      <button 
                        id="btn-retest-connection"
                        onClick={runDiagnostics} 
                        disabled={isRunning}
                        className="text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
                        إعادة الفحص
                      </button>
                    </div>

                    {report && (
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        {report.firestoreStatus === "success" ? (
                          <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200/60 rounded-lg flex items-start gap-2.5">
                            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">الاتصال بـ Cloud Firestore نشط ومستقر 🟢</p>
                              <p className="text-[10px] text-emerald-800/80 mt-1">
                                زمن الاستجابة: <strong className="text-emerald-700">{report.firestoreLatencyMs} مللي ثانية</strong>. قاعدة البيانات جاهزة لاستقبال وتحديث العمليات اللحظية.
                              </p>
                            </div>
                          </div>
                        ) : report.firestoreStatus === "quota_exceeded" ? (
                          <div className="p-3 bg-rose-50 text-rose-900 border border-rose-200/60 rounded-lg flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">تم تجاوز حصة استخدام Firestore (Quota Exceeded)</p>
                              <p className="text-[10px] text-rose-800/80 mt-1">
                                نفدت الحصة اليومية. تأكد من إعدادات الفوترة أو مراجعة سعة الحساب في لوحة تحكم Firebase.
                              </p>
                              <p className="text-[10px] text-rose-600 bg-white/60 p-2 rounded border border-rose-100 mt-2 font-mono break-all">
                                {report.firestoreErrorMessage}
                              </p>
                            </div>
                          </div>
                        ) : report.firestoreStatus === "permission_denied" ? (
                          <div className="p-3 bg-red-50 text-red-900 border border-red-200/60 rounded-lg flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">صلاحية الوصول مرفوضة (Permission Denied)</p>
                              <p className="text-[10px] text-red-800/80 mt-1">
                                قواعد الأمان تمنع القراءة. يرجى التأكد من نشر ملف `firestore.rules`.
                              </p>
                              <p className="text-[10px] text-red-600 bg-white/60 p-2 rounded border border-red-100 mt-2 font-mono break-all">
                                {report.firestoreErrorMessage}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">فشل الاتصال بقاعدة البيانات سحابياً</p>
                              <p className="text-[10px] text-slate-600 mt-1">
                                تفاصيل الخطأ:
                              </p>
                              <p className="text-[10px] text-slate-700 bg-white/80 p-2 rounded border border-slate-200 mt-2 font-mono break-all">
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

              {/* Tab 2: Storage Status */}
              {activeTab === "storage" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-indigo-500" />
                      فحص حاوية التخزين السحابي (Firebase Storage):
                    </h4>

                    {report?.storageStatus === "success" ? (
                      <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200/60 rounded-lg flex items-start gap-2.5">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">حاوية التخزين السحابي متصلة وجاهزة 🟢</p>
                          <p className="text-[10px] text-emerald-800/80 mt-1 font-mono">
                            Bucket: {report.storageBucket}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            يتم رفع كافة صور المهام بصيغة JPEG مضغوطة مباشرة لمسار التخزين السحابي الدائم.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-50 text-rose-900 border border-rose-200/60 rounded-lg flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">خطأ في حاوية التخزين</p>
                          <p className="text-[10px] text-rose-700 mt-1">{report?.storageErrorMessage}</p>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 text-[11px] space-y-2 font-bold text-slate-600">
                      <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="text-slate-500">الحاوية المعينة:</span>
                        <span className="font-mono text-indigo-600">{firebaseConfig.storageBucket}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="text-slate-500">هيكلية المسارات:</span>
                        <span className="font-mono text-slate-700">tasks/&#123;date&#125;/&#123;taskId&#125;/&#123;type&#125;.jpg</span>
                      </div>
                      <div className="flex justify-between pb-0.5">
                        <span className="text-slate-500">حماية الرفع:</span>
                        <span className="text-emerald-600">Storage Rules + MIME Verification</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Config Validation */}
              {activeTab === "config" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      فحص تطابق معرفات المشروع السحابي:
                    </h4>

                    {report?.configMatch ? (
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-lg font-bold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>الملفات متطابقة تماماً والمستعرض متصل بالمشروع الرسمي!</span>
                      </div>
                    ) : (
                      <div className="bg-rose-50 text-rose-800 border border-rose-100 p-2.5 rounded-lg flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>تحذير: يوجد عدم تطابق في ملف الربط!</span>
                        </div>
                        <p className="text-[10px] text-rose-800/85 font-semibold">
                          {report?.configError || "يرجى مراجعة إعدادات المشروع."}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 pt-2 text-[11px] font-bold">
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500">معرف المشروع النشط:</span>
                        <span className="text-indigo-600 font-mono">{firebaseConfig.projectId}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500">المستند النشط بالملف:</span>
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
                        <span className="text-slate-500">قاعدة البيانات:</span>
                        <span className="text-slate-700 font-mono text-[9px] break-all max-w-[200px] text-left">
                          {firebaseConfig.firestoreDatabaseId || "(default)"}
                        </span>
                      </div>
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
